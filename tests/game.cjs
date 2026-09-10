const test = require('node:test'),
  assert = require('node:assert/strict')
const { loader } = require('./loader.cjs')
const load = loader()
const { initial, step, vote, buy, account } = load(__dirname + '/../src/model.ts')
const { inventory, validOutfit, CONFIG } = load(__dirname + '/../src/data.ts')
const member = (id) => ({
  playerId: id,
  name: id,
  token: id,
  beat: 0,
  outfit: inventory.initial(),
  pose: 0,
  ready: false,
  round: 0,
  vote: '',
  purchase: ''
})
function until(s, m, phase) {
  for (let i = 0; i < 500; i++) {
    step(s, m, 1, 1000 + i * 1000)
    if (s.phase === phase) return
  }
  throw Error('Softlock: ' + s.phase + ' -> ' + phase)
}
test('three complete rounds, bots dressed, rewards exactly once and automatic restart', () => {
  const s = initial(),
    m = [member('human')]
  for (let round = 1; round <= 3; round++) {
    until(s, m, 'PREPARATION')
    assert.equal(s.round, round)
    assert.equal(s.cast.length, 6)
    assert.ok(s.cast.every((c) => validOutfit(c.outfit)))
    m[0].round = round
    m[0].outfit.Top = 5
    until(s, m, 'VOTING')
    assert.equal(s.cast[0].outfit.Top, 5)
    assert.equal(vote(s, 'human', s.cast[1].id, round), false) // Active duelists cannot vote
    until(s, m, 'RESULTS')
    assert.equal(s.results.length, 6)
    assert.equal(s.hall.length, round)
    const points = s.accounts.human.points
    step(s, m, 1, 30000)
    assert.equal(s.accounts.human.points, points)
    assert.equal(s.accounts.human.participations, round)
    until(s, m, 'LOBBY')
  }
})
test('reject self, duplicate, stale, unknown voter and candidate', () => {
  const s = initial(),
    m = [member('a'), member('b'), member('c')]
  until(s, m, 'VOTING')
  assert.equal(vote(s, 'a', 'a', s.round), false)
  assert.equal(vote(s, 'a', 'b', s.round - 1), false)
  assert.equal(vote(s, 'intruder', 'b', s.round), false)
  assert.equal(vote(s, 'a', 'missing', s.round), false)
  assert.equal(vote(s, 'a', 'b', s.round), false)
  assert.equal(vote(s, 'c', 'b', s.round), true)
  assert.equal(vote(s, 'c', 'a', s.round), false)
  assert.equal(vote(s, 'a', s.cast[2].id, s.round), false)
})
test('2 to 6 humans participate, 7+ rotate and spectators can vote', () => {
  for (let count = 2; count <= 9; count++) {
    const s = initial(),
      m = Array.from({ length: count }, (_, i) => member('p' + i))
    until(s, m, 'VOTING')
    assert.equal(s.cast.filter((c) => !c.bot).length, Math.min(6, count))
    if (count > 6) {
      const spectator = m.find((x) => !s.cast.some((c) => c.id === x.playerId))
      assert.ok(vote(s, spectator.playerId, s.cast[0].id, s.round))
    }
  }
})
test('absent voters and unready humans cannot stall timers', () => {
  const s = initial(),
    m = [member('a'), member('b')]
  until(s, m, 'PREPARATION')
  until(s, [], 'RESULTS')
  assert.ok(s.results.length)
  until(s, [], 'LOBBY')
})
test('snapshot recovery does not award twice', () => {
  const s = initial(),
    m = [member('a')]
  until(s, m, 'RESULTS')
  const restored = JSON.parse(JSON.stringify(s))
  const before = restored.accounts.a.points
  until(restored, m, 'LOBBY')
  assert.equal(restored.accounts.a.points, before)
})
test('shop balance, ownership and insufficient funds', () => {
  const s = initial()
  s.accounts.a = account()
  assert.equal(buy(s, 'a', 'superstar'), false)
  s.accounts.a.points = 300
  assert.equal(buy(s, 'a', 'superstar'), true)
  assert.equal(s.accounts.a.points, 50)
  assert.equal(buy(s, 'a', 'superstar'), false)
  assert.equal(buy(s, 'a', 'unknown'), false)
})
test('idle scene waits for player; all theme data remains selectable', () => {
  const s = initial()
  for (let i = 0; i < 100; i++) step(s, [], 1, 0)
  assert.equal(s.round, 0)
  assert.equal(s.phase, 'LOBBY')
})
