const test = require('node:test'), assert = require('node:assert/strict')
const { loader } = require('./loader.cjs')
function fixture() {
  const listeners = {}, sent = []
  const status = { epoch: 'boot-1', beat: 1, status: 'ready' }
  const load = loader({
    '@dcl/sdk/ecs': { engine: { PlayerEntity: 1, getEntitiesWith: () => [[10, status]] },
      AvatarEquippedData: { getOrNull: () => null }, AvatarBase: { getOrNull: () => null } },
    '@dcl/sdk/network': { isStateSyncronized: () => true },
    '@dcl/sdk/network/message-bus-sync': { AUTH_SERVER_PEER_ID: 'authoritative-server' },
    '@dcl/sdk/src/players': { getPlayer: () => ({ userId: 'alice', name: 'Alice' }) },
    './shared/messages': { ServerStatus: {}, SNAPSHOT_CHARS: 1800, MAX_SNAPSHOT_CHUNKS: 64,
      room: { onMessage: (event, callback) => { listeners[event] = callback },
        send: async (event, data) => { sent.push({ event, data }) } } }
  })
  const n = new (load(__dirname + '/../src/network.ts').FashionNetwork)()
  const state = load(__dirname + '/../src/model.ts').initial()
  return { n, status, sent, state, deliver: data => listeners.snapshot(data) }
}
test('client rejects partial snapshots and needs live evidence after a stale heartbeat', () => {
  const { n, state, sent, deliver } = fixture()
  n.tick(1)
  assert.equal(n.ready, false)
  assert.equal(sent.length, 0)
  const json = JSON.stringify({ state, people: [{ playerId: 'alice', name: 'Alice' }] })
  const part = { epoch: 'boot-1', revision: 1, count: 2, index: 0, json: json.slice(0, 40) }
  deliver({ ...part, index: 1, json: json.slice(40) })
  n.tick(0.1)
  assert.equal(n.ready, false)
  deliver(part)
  n.tick(0.1)
  assert.equal(n.ready, true)
  assert.equal(sent[0].event, 'intent')
  assert.equal(JSON.parse(sent[0].data.json).playerId, undefined)
  n.tick(7)
  assert.equal(n.ready, false)
})
test('server restart permits a lower revision, discards old chunks, and storage errors block readiness', () => {
  const { n, state, status, deliver } = fixture()
  n.tick(1)
  const packet = { epoch: 'boot-1', revision: 100, count: 1, index: 0,
    json: JSON.stringify({ state, people: [] }) }
  deliver(packet); n.tick(0.1)
  assert.equal(n.ready, true)
  status.epoch = 'boot-2'; n.tick(0.1)
  assert.equal(n.ready, false)
  deliver(packet); n.tick(0.1)
  assert.equal(n.ready, false)
  deliver({ ...packet, epoch: 'boot-2', revision: 1 }); n.tick(0.1)
  assert.equal(n.ready, true)
  status.status = 'storage-error'; n.tick(0.1)
  assert.equal(n.ready, false)
  assert.match(n.connectionMessage, /salvar/)
})
