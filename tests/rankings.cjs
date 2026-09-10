const test = require('node:test')
const assert = require('node:assert/strict')
const load = require('./loader.cjs').loader()
const { recordRanking, ranking, periodKey } = load(__dirname + '/../src/rankings.ts')
test('UTC day/week boundaries, legacy accounts and bounded period rollover', () => {
  const sunday = Date.parse('2026-09-13T23:59:59Z')
  const monday = sunday + 1000
  assert.equal(periodKey('week', sunday), '2026-09-07')
  assert.equal(periodKey('week', monday), '2026-09-14')
  const account = { wins: 2, votes: 9, participations: 4 }
  assert.equal(ranking({ p: account }, 'all', sunday)[0].winRate, 50)
  assert.deepEqual(ranking({ p: account }, 'day', sunday), [])
  recordRanking(account, 'Player', true, 3, sunday)
  assert.equal(ranking({ p: account }, 'day', sunday)[0].wins, 1)
  assert.deepEqual(ranking({ p: account }, 'week', monday), [])
  recordRanking(account, 'Player', false, 1, monday)
  assert.equal(ranking({ p: account }, 'week', monday)[0].participations, 1)
  assert.equal(ranking({ p: account }, 'week', monday)[0].winRate, 0)
  assert.equal(Object.keys(account.periods).length, 2)
  assert.equal(account.wins, 2)
})
test('ranking ties have stable order and empty accounts are excluded', () => {
  const stats = { wins: 1, votes: 4, participations: 2 }
  assert.deepEqual(ranking({ b: stats, a: stats, empty: { wins: 0, votes: 0, participations: 0 } }, 'all', 0).map(a => a.id), ['a', 'b'])
})
