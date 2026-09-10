const test = require('node:test'),
  assert = require('node:assert/strict')
const { loader } = require('./loader.cjs')
const load = loader()
const { initial, step, vote, pendingVote, outfitRevealed, account } = load(__dirname + '/../src/model.ts')
const { inventory, CONFIG, validOutfit } = load(__dirname + '/../src/data.ts')
const { UiController } = load(__dirname + '/../src/ui/controller.ts')

test('saved session preset restores an independent snapshot and respects the preparation deadline', () => {
  const ctrl = new UiController()
  const look = { ...inventory.initial(), Back: 2, Effects: 0, customWearables: ['urn:original'] }
  ctrl.saveLook(look)
  look.Top = 5
  look.customWearables.push('urn:later')
  const updates = []
  const n = { state: { phase: 'PREPARATION', round: 2, remaining: 30 }, nativeWardrobe: true, update: x => updates.push(x) }
  ctrl.restoreLook(n)
  assert.deepEqual(updates[0].outfit.customWearables, ['urn:original'])
  assert.equal(updates[0].outfit.Top, inventory.initial().Top)
  assert.equal(updates[0].outfit.Back, 2)
  assert.equal(n.nativeWardrobe, false)
  updates[0].outfit.customWearables.push('urn:changed')
  ctrl.restoreLook(n)
  assert.deepEqual(updates[1].outfit.customWearables, ['urn:original'])
  n.state.remaining = 1
  ctrl.restoreLook(n)
  n.state.phase = 'VOTING'; n.state.remaining = 10
  ctrl.restoreLook(n)
  assert.equal(updates.length, 2)
})

test('pose buttons use the same native emote as stage avatars, including purchased poses', () => {
  const commands = [], updates = []
  const controlledLoad = loader({ '~system/RestrictedActions': {
    triggerEmote: async (command) => { commands.push(command.predefinedEmote) },
    movePlayerTo: async () => ({})
  } })
  const { UiController } = controlledLoad(__dirname + '/../src/ui/controller.ts')
  const { createAvatarConfig, POSE_TO_EMOTE } = controlledLoad(__dirname + '/../src/avatar-factory.ts')
  const controller = new UiController()
  const network = { state: { round: 4 }, update: (value) => updates.push(value) }
  for (let i = 0; i < POSE_TO_EMOTE.length; i++) {
    controller.setPose(i, network)
    assert.equal('urn:decentraland:off-chain:base-emotes:' + commands[i].toLowerCase(), createAvatarConfig('p', 'P', inventory.initial(), i).expressionTriggerId)
    assert.deepEqual(updates[i], { pose: i, round: 4 })
  }
  for (const i of [-1, 10, NaN, 0.5]) controller.setPose(i, network)
  assert.equal(commands.length, 10)
})
const member = (id) => ({
  playerId: id,
  name: id,
  token: id,
  beat: 0,
  outfit: inventory.initial(),
  pose: 0,
  round: 0,
  ready: false,
  vote: '',
  purchase: ''
})

test('late arrivals join the audience without changing cast; departing voters keep accepted ballots', () => {
  const s = initial()
  const humans = Array.from({ length: 6 }, (_, i) => member('p' + i))
  until(s, humans, (state) => state.phase === 'VOTING')
  const cast = s.cast.map(c => c.id)
  const late = member('late')
  Object.assign(late, { round: s.round, voteDuel: s.duelIndex, vote: s.duels[0].aId })
  step(s, [...humans, late], 0.2, 1000)
  assert.deepEqual(s.cast.map(c => c.id), cast)
  assert.ok(s.voters.includes('late'))
  assert.equal(s.ballots.late, s.duels[0].aId)
  step(s, humans, 0.2, 1200)
  assert.equal(s.voters.includes('late'), false)
  assert.equal(s.ballots.late, s.duels[0].aId)
  for (const human of humans) {
    Object.assign(human, { round: s.round, voteDuel: s.duelIndex, vote: s.duels[0].aId })
  }
  step(s, humans, 0.2, 1400)
  assert.equal(s.phase, 'DUEL_RESULT')
  assert.equal(s.duels[0].votesA, 5)
})
function until(s, m, p) {
  for (let i = 0; i < 2000; i++) {
    step(s, m, 0.2, i * 200)
    if (p(s)) return
  }
  throw Error('timeout ' + s.phase)
}
test('same spectator votes in consecutive duels; delayed first-duel request is rejected', () => {
  const s = initial(),
    m = Array.from({ length: 7 }, (_, i) => member('p' + i)),
    spectator = m[6]
  until(s, m, (s) => s.phase === 'VOTING')
  Object.assign(spectator, { round: s.round, voteDuel: 0, vote: s.duels[0].aId })
  assert.equal(pendingVote(s, spectator), spectator.vote)
  step(s, m, 0.2, 0)
  assert.equal(s.ballots.p6, spectator.vote)
  until(s, m, (s) => s.phase === 'VOTING' && s.duelIndex === 1)
  assert.equal(pendingVote(s, spectator), '')
  step(s, m, 0.2, 0)
  assert.equal(s.ballots.p6, undefined)
  assert.equal(vote(s, 'p6', s.duels[1].aId, s.round, 0), false)
  Object.assign(spectator, { voteDuel: 1, vote: s.duels[1].aId })
  step(s, m, 0.2, 0)
  assert.equal(s.ballots.p6, spectator.vote)
})
test('1 through 9 humans: six unique contestants, everybody paired once', () => {
  for (let n = 1; n <= 9; n++) {
    const s = initial(),
      m = Array.from({ length: n }, (_, i) => member('p' + i))
    until(s, m, (s) => s.phase === 'PREPARATION')
    assert.equal(s.cast.length, 6)
    const paired = s.duels.flatMap((d) => [d.aId, d.bId])
    assert.equal(new Set(paired).size, 6)
    for (const c of s.cast) assert.equal(paired.filter((id) => id === c.id).length, 1)
  }
})
test('wardrobe closes at T-1 even for READY player; last accepted outfit stays frozen', () => {
  const s = initial(),
    m = [member('p')],
    ctrl = new UiController()
  until(s, m, (s) => s.phase === 'PREPARATION')
  m[0].round = s.round
  const n = { state: s, mine: m[0], update: (p) => Object.assign(m[0], p) }
  ctrl.tick(n)
  ctrl.wardrobeOpen = true
  s.remaining = 1.1
  m[0].outfit.Top = 3
  step(s, m, 0.2, 0)
  ctrl.tick(n)
  assert.equal(ctrl.wardrobeOpen, false)
  assert.equal(m[0].ready, true)
  m[0].outfit.Top = 5
  step(s, m, 0.2, 0)
  assert.equal(s.cast[0].outfit.Top, 3)
  s.remaining = 0
  step(s, m, 0.2, 0)
  assert.equal(s.phase, 'RUNWAY')
})
test('all models stay private during preparation and reveal together at runway', () => {
  const s = initial(),
    m = [member('p')]
  until(s, m, (s) => s.phase === 'PREPARATION')
  assert.ok(s.cast.every((c) => !outfitRevealed(s, c.id)))
  until(s, m, (s) => s.phase === 'RUNWAY')
  s.remaining = CONFIG.duelPose
  assert.equal(outfitRevealed(s, s.duels[0].aId), true)
  assert.equal(outfitRevealed(s, s.duels[0].bId), true)
  assert.equal(outfitRevealed(s, s.duels[1].aId), true)
})
test('every reward displayed equals actual points added, including duel wins, for two rounds', () => {
  const s = initial(),
    m = Array.from({ length: 6 }, (_, i) => member('p' + i))
  for (let round = 1; round <= 2; round++) {
    const before = Object.fromEntries(Object.entries(s.accounts).map(([id, a]) => [id, a.points]))
    until(s, m, (s) => s.phase === 'RESULTS')
    for (const [i, r] of s.results.entries()) {
      assert.equal(r.points, 10 + 50 * r.duelWins + (i === 0 ? 100 : 0))
      assert.equal(s.accounts[r.id].points - (before[r.id] || 0), r.points)
    }
    until(s, m, (s) => s.phase === 'LOBBY')
  }
})
test('malformed native inventory cannot crash avatar factory', () => {
  assert.equal(validOutfit({ ...inventory.initial(), customWearables: 'bad' }), false)
  assert.equal(validOutfit({ ...inventory.initial(), customWearables: [123] }), false)
})
test('shared catalog and privacy robe resolve to official metadata for both body shapes', () => {
  const { createAvatarConfig, PRIVACY_ROBE_WEARABLES } = load(__dirname + '/../src/avatar-factory.ts')
  const rows = require('../docs/base-wearables.json')
  for (let i = 0; i < 6; i++) {
    const outfit = Object.fromEntries(Object.keys(inventory.initial()).map((k) => [k, i]))
    for (const urn of [...createAvatarConfig('p', 'P', outfit).wearables, ...PRIVACY_ROBE_WEARABLES]) {
      const item = rows.find((r) => r.id === urn.split(':').pop())
      assert.ok(item, 'Missing ' + urn)
      assert.ok(item.bodies.includes('BaseMale') && item.bodies.includes('BaseFemale'), urn)
    }
  }
})

test('winner history captures pose and owns independent copies of cosmetics and native clothes', () => {
  const s = initial(),
    m = Array.from({ length: 6 }, (_, i) => member('p' + i))
  until(s, m, (s) => s.phase === 'PREPARATION')
  for (const c of s.cast) {
    c.pose = 1
    c.outfit.customWearables = ['urn:test']
    s.accounts[c.id] = account()
    s.accounts[c.id].owned = ['sparkles']
  }
  until(s, m, (s) => s.phase === 'RESULTS')
  const w = s.hall[0],
    winner = s.cast.find((c) => c.id === w.winner)
  assert.equal(w.pose, 1)
  assert.deepEqual(w.cosmetics, ['sparkles'])
  winner.outfit.customWearables.push('urn:later')
  s.accounts[w.winner].owned.push('icon')
  assert.deepEqual(w.outfit.customWearables, ['urn:test'])
  assert.deepEqual(w.cosmetics, ['sparkles'])
})
