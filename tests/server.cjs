const test = require('node:test'), assert = require('node:assert/strict')
const { loader } = require('./loader.cjs')
const load = loader()
const { AuthoritativeGame, readCheckpoint } = load(__dirname + '/../src/server/game.ts')
const { CheckpointWriter } = load(__dirname + '/../src/server/persistence.ts')
const { inventory, CONFIG } = load(__dirname + '/../src/data.ts')
const request = () => ({ name: 'Alice', outfit: inventory.initial(), pose: 0, round: 0, ready: false, vote: '', purchase: '' })
function until(game, present, phase) {
  for (let i = 0; i < 1000; i++) { if (game.state.phase === phase) return; game.tick(present, 1, i * 1000) }
  throw new Error('phase timeout')
}
test('server trusts transport identity and ignores forged points, ownership and absent senders', () => {
  const game = new AuthoritativeGame(), present = new Set(['alice'])
  assert.equal(game.receive('mallory', request(), present), false)
  assert.equal(game.receive('alice', { ...request(), playerId: 'bob', points: 999, accounts: { alice: { points: 999 } } }, present), true)
  assert.equal(game.members.has('bob'), false)
  assert.equal(game.state.accounts.alice, undefined)
  until(game, present, 'PREPARATION')
  game.receive('alice', { ...request(), round: game.state.round, pose: 9, purchase: 'royal' }, present)
  game.tick(present, 0.5, 0)
  assert.equal(game.state.cast.find(c => c.id === 'alice').pose, 0)
  assert.equal(game.state.accounts.alice, undefined)
})
test('private snapshots hide future looks and other voters while exposing a confirmed personal ballot', () => {
  const game = new AuthoritativeGame(), present = new Set(['alice', 'bob', 'carol'])
  for (const player of present) game.receive(player, request(), present)
  until(game, present, 'PREPARATION')
  game.receive('alice', { ...request(), round: game.state.round, outfit: { ...inventory.initial(), Top: 5 } }, present)
  game.tick(present, 0.5, 0)
  assert.notEqual(game.state.cast[0].outfit.Top, game.view('bob').state.cast[0].outfit.Top)
  until(game, present, 'VOTING')
  game.receive('carol', { ...request(), round: game.state.round, vote: 'alice', voteDuel: 0 }, present)
  game.tick(present, 0.5, 0)
  assert.equal(game.state.ballots.carol, 'alice')
  assert.equal(game.view('alice').state.ballots.carol, undefined)
  assert.deepEqual(game.view('carol').state.ballots, { carol: 'alice' })
  const future = game.state.cast[2]
  assert.deepEqual(game.view('alice').state.cast[2].outfit, inventory.initial())
  assert.ok(future)
})
test('persisted results resume without awarding points a second time and corrupt storage is rejected', () => {
  const game = new AuthoritativeGame(), present = new Set(['alice'])
  game.receive('alice', request(), present)
  until(game, present, 'RESULTS')
  const points = game.state.accounts.alice.points
  const restored = new AuthoritativeGame(readCheckpoint(JSON.stringify({ version: 2, state: game.state })))
  until(restored, new Set(), 'LOBBY')
  assert.equal(restored.state.accounts.alice.points, points)
  assert.equal(restored.state.hall.length, 1)
  assert.throws(() => readCheckpoint({ version: 9 }), /Invalid/)
  assert.equal(readCheckpoint(null).phase, 'LOBBY')
})
test('failed checkpoint is retained for retry and overlapping flushes never race', async () => {
  const writes = []
  let succeed = false
  const writer = new CheckpointWriter(async value => { writes.push(value); return succeed })
  writer.queue('rewards')
  assert.equal(await writer.flush(), false)
  assert.equal(writer.failed, true)
  assert.equal(writer.pending, 'rewards')
  succeed = true
  const first = writer.flush()
  assert.equal(await writer.flush(), false)
  assert.equal(await first, true)
  assert.equal(writer.pending, '')
  assert.deepEqual(writes, ['rewards', 'rewards'])
})

test('storage restore starts empty only on confirmed 404, never on a failed or ambiguous read', async () => {
  let response = ['missing', null, 404]
  const loadStorage = loader({
    '@dcl/sdk/server/storage-url': { getStorageServerUrl: async () => 'https://storage.test' },
    '@dcl/sdk/server/utils': { wrapSignedFetch: async () => response }
  })
  const { restoreCheckpoint } = loadStorage(__dirname + '/../src/server/storage.ts')
  assert.equal((await restoreCheckpoint('test')).phase, 'LOBBY')
  for (const failure of [['timeout', null], ['unavailable', null, 500], [null, {}, 200], [null, { value: null }, 200]]) {
    response = failure
    await assert.rejects(restoreCheckpoint('test'), /refusing/)
  }
  response = [null, { value: JSON.stringify({ version: 2, state: new AuthoritativeGame().state }) }, 200]
  assert.equal((await restoreCheckpoint('test')).phase, 'LOBBY')
})
