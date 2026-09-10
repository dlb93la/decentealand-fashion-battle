import { engine, Entity, Schemas, AvatarEquippedData, AvatarBase } from '@dcl/sdk/ecs'
import { syncEntity, isStateSyncronized } from '@dcl/sdk/network'
import { getPlayer } from '@dcl/sdk/src/players'
import { openExplorerUi } from '~system/RestrictedActions'
import { LeaseObserver } from './shared/lease'
import { initial, State, Member, step } from './model'
import { inventory, validOutfit } from './data'

export async function openBackpack(): Promise<boolean> {
  try {
    const result = await openExplorerUi({ ui: 2 })
    return result.openResult === 1 || result.openResult === 2
  } catch (err) {
    console.log('[FashionNetwork] Failed to open native backpack UI:', err)
    return false
  }
}

const Session = engine.defineComponent('fashion::session:v1', { json: Schemas.String })
const Presence = engine.defineComponent('fashion::presence:v1', {
  playerId: Schemas.String,
  name: Schemas.String,
  token: Schemas.String,
  beat: Schemas.Int,
  json: Schemas.String
})
export class FashionNetwork {
  state: State = initial()
  members: Member[] = []
  mine?: Member
  private entity: Entity
  private me?: Entity
  private leases = new LeaseObserver()
  private beat = 0
  private elapsed = 0
  private election = ''
  private stable = 0
  private cached = ''
  ready = false
  nativeWardrobe = false
  constructor() {
    this.entity = engine.addEntity()
    Session.create(this.entity, { json: JSON.stringify(initial()) })
    syncEntity(this.entity, [Session.componentId], 9800)
  }
  update(data: Partial<Member>) {
    if (!this.mine || !this.me) return
    this.mine = { ...this.mine, ...data }
    Presence.createOrReplace(this.me, {
      playerId: this.mine.playerId,
      name: this.mine.name,
      token: this.mine.token,
      beat: this.mine.beat,
      json: JSON.stringify(this.mine)
    })
  }
  tick(dt: number) {
    if (!isStateSyncronized()) return
    const p = getPlayer()
    const equipped =
      typeof AvatarEquippedData?.getOrNull === 'function' && engine?.PlayerEntity !== undefined
        ? AvatarEquippedData.getOrNull(engine.PlayerEntity)
        : null
    const bodyShape =
      typeof AvatarBase?.getOrNull === 'function' && engine?.PlayerEntity !== undefined
        ? AvatarBase.getOrNull(engine.PlayerEntity)?.bodyShapeUrn || p?.avatar?.bodyShapeUrn
        : p?.avatar?.bodyShapeUrn
    const liveWearables =
      equipped?.wearableUrns && equipped.wearableUrns.length > 0
        ? equipped.wearableUrns
        : p?.wearables && p.wearables.length > 0
          ? p.wearables
          : undefined

    if (!this.me && p?.userId) {
      this.me = engine.addEntity()
      const initialOutfit = inventory.initial()
      if (bodyShape) {
        initialOutfit.bodyShape = bodyShape
      }
      this.mine = {
        playerId: p.userId.toLowerCase(),
        name: p.name.replace(/[<>\r\n]/g, '').slice(0, 20),
        token: `${p.userId}:${Date.now()}:${Math.random()}`,
        beat: 0,
        outfit: initialOutfit,
        pose: 0,
        ready: false,
        round: 0,
        vote: '',
        purchase: ''
      }
      this.update({})
      syncEntity(this.me, [Presence.componentId])
    }

    if (
      this.nativeWardrobe &&
      this.state.phase === 'PREPARATION' &&
      this.state.remaining > 1 &&
      this.mine &&
      liveWearables &&
      liveWearables.length > 0
    ) {
      const current = this.mine.outfit.customWearables || []
      const changed =
        current.length !== liveWearables.length ||
        liveWearables.some((urn, idx) => urn !== current[idx]) ||
        (bodyShape && bodyShape !== this.mine.outfit.bodyShape)
      if (changed) {
        this.update({
          outfit: {
            ...this.mine.outfit,
            customWearables: [...liveWearables],
            bodyShape: bodyShape || this.mine.outfit.bodyShape
          }
        })
      }
    }
    this.beat += dt
    if (this.beat >= 2 && this.mine) {
      this.beat = 0
      this.update({ beat: this.mine.beat + 1 })
    }
    const unique = new Map<string, Member>()
    for (const [e, presence] of engine.getEntitiesWith(Presence)) {
      if (!this.leases.active(String(e), presence, Date.now() / 1000)) continue
      try {
        const m = JSON.parse(presence.json) as Member
        if (m.playerId !== presence.playerId || m.token !== presence.token || !validOutfit(m.outfit)) continue
        const old = unique.get(m.playerId)
        if (!old || m.token < old.token) unique.set(m.playerId, m)
      } catch {}
    }
    this.members = Array.from(unique.values()).sort((a, b) => a.token.localeCompare(b.token))
    const raw = Session.get(this.entity).json
    if (raw !== this.cached) {
      try {
        const s = JSON.parse(raw) as State
        if (s && Array.isArray(s.cast) && s.accounts && Number.isFinite(s.remaining)) {
          this.state = s
          this.cached = raw
        }
      } catch {}
    }
    const leader = this.members.some((m) => m.token === this.state.leader)
      ? this.state.leader
      : this.members[0]?.token || ''
    if (leader !== this.election) {
      this.election = leader
      this.stable = 0
    }
    this.stable += dt
    this.ready = !!this.mine && this.stable > 3
    this.elapsed += dt
    if (!this.ready || this.elapsed < 0.2) return
    const delta = this.elapsed
    this.elapsed = 0
    if (leader === this.mine?.token) {
      this.state.leader = leader
      step(this.state, this.members, delta, Date.now())
      this.state.revision++
      const json = JSON.stringify(this.state)
      Session.createOrReplace(this.entity, { json })
      this.cached = json
    }
  }
}
