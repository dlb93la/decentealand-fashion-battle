import { engine, PlayerIdentityData, Transform } from '@dcl/sdk/ecs'
import { syncEntity, isServer } from '@dcl/sdk/network'
import { AUTH_SERVER_PEER_ID } from '@dcl/sdk/network/message-bus-sync'
import { Storage } from '@dcl/sdk/server'
import { room, ServerStatus, SNAPSHOT_CHARS, MAX_SNAPSHOT_CHUNKS } from '../shared/messages'
import { AuthoritativeGame } from './game'
import { restoreCheckpoint } from './storage'
import { CheckpointWriter } from './persistence'

const KEY = 'fashion:checkpoint:v2'
export function initServer() {
  if (!isServer()) return
  ServerStatus.validateBeforeChange(value => value.senderAddress === AUTH_SERVER_PEER_ID)
  const epoch = `${Date.now()}:${Math.random()}`
  const entity = engine.addEntity()
  ServerStatus.create(entity, { epoch, beat: Date.now(), status: 'loading' })
  syncEntity(entity, [ServerStatus.componentId], 9801)
  let game: AuthoritativeGame | undefined
  let loading = false, elapsed = 0, heartbeat = 0, retry = 0, periodic = 0, sending = false
  let present = new Set<string>()
  const writer = new CheckpointWriter(value => Storage.set(KEY, value))
  async function load() {
    if (loading || game) return
    loading = true
    try { game = new AuthoritativeGame(await restoreCheckpoint(KEY)) }
    catch (error) { console.error('[SERVER] Cannot restore progression:', error) }
    finally { loading = false }
  }
  void load()
  room.onMessage('intent', (data, context) => {
    if (!game || writer.pending || !context || data.json.length > SNAPSHOT_CHARS) return
    try { game.receive(context.from.toLowerCase(), JSON.parse(data.json), present) } catch {}
  })
  async function publish() {
    if (!game || sending) return
    sending = true
    try {
      const revision = game.state.revision
      const views = [...present].map(viewer => ({ viewer, json: JSON.stringify(game!.view(viewer)) }))
      for (const { viewer, json } of views) {
        const count = Math.ceil(json.length / SNAPSHOT_CHARS)
        if (count > MAX_SNAPSHOT_CHUNKS) { console.error('[SERVER] Snapshot budget exceeded'); continue }
        for (let index = 0; index < count; index++) {
          await room.send('snapshot', { epoch, revision, index, count,
            json: json.slice(index * SNAPSHOT_CHARS, (index + 1) * SNAPSHOT_CHARS) }, { to: [viewer] })
        }
      }
    } catch (error) { console.error('[SERVER] Snapshot delivery failed:', error) }
    finally { sending = false }
  }
  engine.addSystem(dt => {
    elapsed += dt; heartbeat += dt; retry += dt; periodic += dt
    if (heartbeat >= 2) {
      heartbeat = 0
      ServerStatus.createOrReplace(entity, { epoch, beat: Date.now(), status: !game ? 'loading' :
        writer.failed ? 'storage-error' : writer.pending ? 'saving' : 'ready' })
    }
    if (!game) { if (retry >= 5) { retry = 0; void load() }; return }
    if (writer.pending) {
      if (!writer.busy && (!writer.failed || retry >= 3)) {
        retry = 0
        void writer.flush().then(ok => { if (ok) void publish() })
      }
      elapsed = 0 // Storage delay must not consume dressing/voting time.
      return
    }
    if (elapsed < 0.5) return
    const delta = elapsed; elapsed = 0
    present = new Set<string>()
    for (const [player, identity] of engine.getEntitiesWith(PlayerIdentityData)) {
      const t = Transform.getOrNull(player)
      if (t && t.position.x >= 0 && t.position.x <= 48 && t.position.z >= 0 && t.position.z <= 32)
        present.add(identity.address.toLowerCase())
    }
    const phase = `${game.state.round}:${game.state.phase}:${game.state.duelIndex}`
    const economy = JSON.stringify(game.state.accounts)
    game.tick(present, delta, Date.now())
    const checkpoint = phase !== `${game.state.round}:${game.state.phase}:${game.state.duelIndex}` ||
      economy !== JSON.stringify(game.state.accounts) || periodic >= 15
    if (checkpoint) {
      periodic = 0
      writer.queue(JSON.stringify({ version: 2, state: game.state }))
      void writer.flush().then(ok => { if (ok) void publish() })
    } else void publish()
  })
}
