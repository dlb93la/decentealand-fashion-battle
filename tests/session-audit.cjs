const test = require('node:test')
const assert = require('node:assert/strict')
const { loader } = require('./loader.cjs')
const { SessionAudit } = loader()(__dirname + '/../src/session-audit.ts')

test('audit confirms authoritative ballots only and emits once across repeated frames', () => {
  const lines = []
  const audit = new SessionAudit((line) => lines.push(JSON.parse(line.slice('[FashionAudit] '.length))))
  const s = { round: 1, duelIndex: 0, phase: 'VOTING', ballots: {}, cast: [{ id: 'private-a' }, { id: 'private-b' }] }
  audit.observe(s, 'private-a')
  assert.equal(lines.length, 0)
  s.ballots['private-a'] = 'private-b'
  audit.observe(s, 'private-a')
  audit.observe(s, 'private-a')
  s.phase = 'DUEL_RESULT'
  audit.observe(s, 'private-a')
  assert.deepEqual(lines, [{ event: 'vote-accepted', round: 1, duel: 0, candidateSlot: 1 }])
})

test('audit captures comparable results and individual balance without player identifiers', () => {
  const lines = []
  const audit = new SessionAudit((line) => lines.push(line))
  const s = { phase: 'RESULTS', round: 2, theme: 4, duelIndex: 1, ballots: {},
    cast: [{ id: 'private-a' }], results: [{ id: 'private-a', votes: 3, duelWins: 1, points: 160 }],
    accounts: { 'private-a': { points: 170 } } }
  audit.observe(s, 'private-a')
  audit.observe(s, 'private-a')
  assert.equal(lines.length, 1)
  assert.equal(lines[0].includes('private-a'), false)
  assert.deepEqual(JSON.parse(lines[0].slice('[FashionAudit] '.length)), {
    event: 'results-received', round: 2, theme: 4,
    results: [{ slot: 0, votes: 3, duelWins: 1, points: 160 }], localSlot: 0, localPoints: 170
  })
})
