import { engine, AvatarEquippedData, AvatarBase } from '@dcl/sdk/ecs'
import { isStateSyncronized } from '@dcl/sdk/network'
import { getPlayer } from '@dcl/sdk/src/players'
import { openExplorerUi } from '~system/RestrictedActions'
import { initial, State, Member } from './model'
import { inventory } from './data'
import { room, ServerStatus, SNAPSHOT_CHARS, MAX_SNAPSHOT_CHUNKS } from './shared/messages'

export async function openBackpack(): Promise<boolean> {
  try { const result = await openExplorerUi({ ui: 2 }); return result.openResult === 1 || result.openResult === 2 }
  catch { return false }
}

/** Client sends intentions only. State, ballots and balances come exclusively from the server. */
export class FashionNetwork {
  state: State = initial()
  members: { playerId: string; name: string }[] = []
  mine?: Member
  ready = false
  nativeWardrobe = false
  intentError = ''
  connectionMessage = 'Conectando ao servidor do show...'
  private clock = 0
  private lastAlive = -Infinity
  private beat?: number
  private epoch = ''
  private applied = -1
  private assembling = -1
  private chunks = new Map<number, string>()
  private count = 0
  private sent = 0
  private dirty = true
  private status = 'loading'

  constructor() {
    // The pinned Room implementation filters server origin before invoking client callbacks.
    // Unlike server callbacks, client callbacks deliberately receive no sender context.
    room.onMessage('snapshot', (data) => {
      if (data.epoch !== this.epoch ||
        data.revision <= this.applied || data.count < 1 || data.count > MAX_SNAPSHOT_CHUNKS ||
        data.index < 0 || data.index >= data.count || data.json.length > SNAPSHOT_CHARS) return
      if (data.revision < this.assembling) return
      if (data.revision !== this.assembling) {
        this.chunks.clear(); this.assembling = data.revision; this.count = data.count
      }
      if (this.count !== data.count) return
      this.chunks.set(data.index, data.json)
      if (this.chunks.size !== this.count) return
      try {
        const json = Array.from({ length: this.count }, (_, i) => this.chunks.get(i)!).join('')
        const result = JSON.parse(json) as { state: State; people: { playerId: string; name: string }[] }
        if (!result.state || !Array.isArray(result.state.cast) || !Array.isArray(result.people)) return
        this.state = result.state; this.members = result.people
        this.applied = data.revision; this.lastAlive = this.clock
      } catch { /* Keep the last complete snapshot; never apply a partial one. */ }
      this.chunks.clear()
    })
  }

  update(data: Partial<Member>) {
    if (!this.mine) return
    this.mine = { ...this.mine, ...data }
    this.dirty = true
  }

  tick(dt: number) {
    this.clock += dt; this.sent += dt
    if (!isStateSyncronized()) { this.ready = false; return }
    for (const [, status] of engine.getEntitiesWith(ServerStatus)) {
      if (status.epoch !== this.epoch) {
        this.epoch = status.epoch; this.applied = -1; this.assembling = -1
        this.chunks.clear(); this.beat = undefined; this.lastAlive = -Infinity; this.dirty = true
      }
      if (this.beat !== undefined && this.beat !== status.beat) this.lastAlive = this.clock
      this.beat = status.beat; this.status = status.status
      break
    }
    const player = getPlayer()
    if (!this.mine && player?.userId) {
      const outfit = inventory.initial()
      if (player.avatar?.bodyShapeUrn) outfit.bodyShape = player.avatar.bodyShapeUrn
      this.mine = { playerId: player.userId.toLowerCase(), name: player.name.replace(/[<>\r\n]/g, '').slice(0, 20),
        token: '', beat: 0, outfit, pose: 0, ready: false, round: 0, vote: '', purchase: '' }
    }
    this.ready = !!this.mine && this.applied >= 0 && this.clock - this.lastAlive < 6 &&
      this.status !== 'loading' && this.status !== 'storage-error'
    this.connectionMessage = this.status === 'storage-error'
      ? 'Não foi possível salvar. O show está pausado e tentará novamente.'
      : 'Aguardando o servidor do show. A primeira conexão pode demorar.'
    if (!this.mine || this.clock - this.lastAlive >= 6 || this.status === 'loading' || this.status === 'storage-error') return
    if (this.nativeWardrobe && this.state.phase === 'PREPARATION' && this.state.remaining > 1) {
      const equipped = AvatarEquippedData.getOrNull(engine.PlayerEntity)
      const body = AvatarBase.getOrNull(engine.PlayerEntity)?.bodyShapeUrn || player?.avatar?.bodyShapeUrn
      if (equipped?.wearableUrns.length && (JSON.stringify(equipped.wearableUrns) !== JSON.stringify(this.mine.outfit.customWearables) ||
        body !== this.mine.outfit.bodyShape)) this.update({ outfit: { ...this.mine.outfit, bodyShape: body,
          customWearables: [...equipped.wearableUrns] } })
    }
    // Retry the latest intent: protects against cold starts and a checkpoint temporarily pausing reception.
    if (this.sent < (this.dirty ? 0.2 : 2)) return
    this.sent = 0; this.dirty = false
    const { name, outfit, pose, ready, round, vote, voteDuel, purchase } = this.mine
    const json = JSON.stringify({ name, outfit, pose, ready, round, vote, voteDuel, purchase })
    if (json.length > SNAPSHOT_CHARS) {
      this.intentError = 'Look grande demais para enviar. Escolha um look do catálogo da cena.'
      return
    }
    this.intentError = ''
    void room.send('intent', { json }).catch(() => { this.dirty = true })
  }
}
