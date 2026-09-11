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

function stepUntil(s, m, condition, maxSteps = 1000) {
  for (let i = 0; i < maxSteps; i++) {
    step(s, m, 1, 1000 + i * 1000)
    if (condition(s)) return
  }
  throw Error('Softlock condition not met: phase=' + s.phase + ', duelIndex=' + s.duelIndex)
}

test('1v1 duels: generates correct duels and steps through each duel to results', () => {
  const s = initial()
  const m = [member('p1'), member('p2')]

  // 1. Advance to PREPARATION
  stepUntil(s, m, (st) => st.phase === 'PREPARATION')
  assert.equal(s.round, 1)
  assert.equal(s.cast.length, 6) // 2 humans + 4 bots
  assert.equal(s.duels.length, 3) // 3 duels for 6 contestants
  assert.equal(s.duels[0].aId, s.cast[0].id)
  assert.equal(s.duels[0].bId, s.cast[1].id)
  assert.equal(s.duels[1].aId, s.cast[2].id)
  assert.equal(s.duels[1].bId, s.cast[3].id)

  // 2. Mark players ready and advance to RUNWAY (Duel 0)
  m[0].ready = true
  m[0].round = 1
  m[1].ready = true
  m[1].round = 1

  stepUntil(s, m, (st) => st.phase === 'RUNWAY' && st.duelIndex === 0)
  assert.equal(s.duelIndex, 0)

  // 3. Advance to VOTING (Duel 0)
  stepUntil(s, m, (st) => st.phase === 'VOTING' && st.duelIndex === 0)
  assert.equal(s.duelIndex, 0)

  // In Duel 0 (p1 vs p2), self-voting is rejected:
  // p1 cannot vote for p1
  assert.equal(vote(s, 'p1', 'p1', s.round), false)
  // p1 cannot vote for someone not in the duel
  assert.equal(vote(s, 'p1', s.cast[2].id, s.round), false)

  // 4. Advance through remaining duels to RESULTS
  stepUntil(s, m, (st) => st.phase === 'RESULTS')
  assert.equal(s.results.length, 6)
  assert.ok(s.results[0].duelWins >= s.results[1].duelWins)
  assert.ok(s.results[0].points >= 100) // winner gets at least 100 SP bonus + 10 SP participation

  // Verify accounts received style points
  const p1Points = s.accounts.p1.points
  const p2Points = s.accounts.p2.points
  assert.ok(p1Points >= 10, 'Participation points awarded')
  assert.ok(p2Points >= 10, 'Participation points awarded')
})

test('GDD point economy: duel winner gets +50 SP, match winner gets +100 SP, participation +10 SP', () => {
  const s = initial()
  const m = [member('alice'), member('bob'), member('charlie'), member('diana'), member('eve'), member('fred')]

  stepUntil(s, m, (st) => st.phase === 'PREPARATION')
  m.forEach((p) => {
    p.ready = true
    p.round = 1
  })

  // In Duel 0: Alice vs Bob. Voters Charlie and Diana vote for Alice
  stepUntil(s, m, (st) => st.phase === 'VOTING' && st.duelIndex === 0)
  assert.equal(vote(s, 'charlie', 'alice', s.round), true)
  assert.equal(vote(s, 'diana', 'alice', s.round), true)

  // In Duel 1: Charlie vs Diana. Voters Alice and Bob vote for Charlie
  stepUntil(s, m, (st) => st.phase === 'VOTING' && st.duelIndex === 1)
  assert.equal(vote(s, 'alice', 'charlie', s.round), true)
  assert.equal(vote(s, 'bob', 'charlie', s.round), true)

  // Advance to RESULTS
  stepUntil(s, m, (st) => st.phase === 'RESULTS')

  // Alice won Duel 0 (2 votes). Charlie won Duel 1 (2 votes).
  // Winner gets +100 bonus, duel win gets +50, participation gets +10.
  const aliceRes = s.results.find((r) => r.id === 'alice')
  const bobRes = s.results.find((r) => r.id === 'bob')
  assert.equal(aliceRes.duelWins, 1)
  assert.equal(bobRes.duelWins, 0)
  assert.ok(aliceRes.points >= 60) // at least 50 (duel win) + 10 (participation)
  for(const r of s.results) assert.equal(s.accounts[r.id].points, r.points)
  assert.equal(bobRes.points, 10) // 10 participation
})

test('bot voting in duels: non-duelist bots cast votes deterministically', () => {
  const s = initial()
  // 1 human, 3 bots
  const m = [member('solo')]
  stepUntil(s, m, (st) => st.phase === 'PREPARATION')
  m[0].ready = true
  m[0].round = 1

  // Advance to VOTING in duel 0
  stepUntil(s, m, (st) => st.phase === 'VOTING' && st.duelIndex === 0)

  // Advance to RESULTS - all duels settle without softlock
  stepUntil(s, m, (st) => st.phase === 'RESULTS')
  assert.equal(s.results.length, 6)
  assert.ok(s.hall.length >= 1)
})


test('bot judges wait before voting, then submit within five seconds', () => {
  const s = initial(), m = [member('solo')]
  stepUntil(s, m, st => st.phase === 'VOTING')
  step(s, m, 1, 10000)
  assert.equal(Object.keys(s.ballots).length, 0)
  const eligible = s.cast.filter(c => c.bot && c.id !== s.duels[0].aId && c.id !== s.duels[0].bId)
  for (let i = 0; i < 4; i++) step(s, m, 1, 11000 + i * 1000)
  assert.ok(s.phase !== 'VOTING' || eligible.every(c => s.ballots[c.id]))
})
