const test = require('node:test')
const assert = require('node:assert/strict')
const { loader } = require('./loader.cjs')

const load = loader()
const { LeaseObserver, LEASE_SECONDS } = load(__dirname + '/../src/shared/lease.ts')

test('LeaseObserver maintains local heartbeat validity and expires after 30 seconds', () => {
  const leases = new LeaseObserver()
  const claim = { playerId: 'player-1', name: 'Alice', token: 'token-abc', beat: 0 }

  // Initial beat seen at t = 100
  assert.equal(leases.active('entity-1', claim, 100), true)

  // Still active at t = 120 (20 seconds elapsed, lease is 30)
  assert.equal(leases.active('entity-1', claim, 120), true)

  // At boundary (29.9s)
  assert.equal(leases.active('entity-1', claim, 129.9), true)

  // Expired at 30 seconds and beyond without new beat
  assert.equal(leases.active('entity-1', claim, 130), false)
  assert.equal(leases.active('entity-1', claim, 135), false)
})

test('LeaseObserver renews validity when heartbeat increments', () => {
  const leases = new LeaseObserver()
  const claim0 = { playerId: 'player-1', name: 'Alice', token: 'token-abc', beat: 0 }

  assert.equal(leases.active('entity-1', claim0, 100), true)

  // Heartbeat increments at t = 125
  const claim1 = { playerId: 'player-1', name: 'Alice', token: 'token-abc', beat: 1 }
  assert.equal(leases.active('entity-1', claim1, 125), true)

  // Would have expired at t = 131 if not renewed, but now active until t = 155
  assert.equal(leases.active('entity-1', claim1, 131), true)
  assert.equal(leases.active('entity-1', claim1, 154), true)
  assert.equal(leases.active('entity-1', claim1, 155), false)
})

test('LeaseObserver rejects invalid or corrupted claims', () => {
  const leases = new LeaseObserver()
  const valid = { playerId: 'player-1', name: 'Alice', token: 'token-abc', beat: 0 }

  assert.equal(leases.active('entity-1', { ...valid, playerId: '' }, 100), false)
  assert.equal(leases.active('entity-1', { ...valid, token: '' }, 100), false)
  assert.equal(leases.active('entity-1', { ...valid, beat: -1 }, 100), false)
  assert.equal(leases.active('entity-1', { ...valid, beat: 1.5 }, 100), false)
  assert.equal(leases.active('entity-1', { ...valid, beat: NaN }, 100), false)
})

test('LeaseObserver tracks separate entities independently', () => {
  const leases = new LeaseObserver()
  const claimA = { playerId: 'alice', name: 'Alice', token: 'tok-a', beat: 0 }
  const claimB = { playerId: 'bob', name: 'Bob', token: 'tok-b', beat: 0 }

  assert.equal(leases.active('entity-alice', claimA, 100), true)
  assert.equal(leases.active('entity-bob', claimB, 115), true)

  // At t = 132, alice is expired (>30s) but bob is still active (17s elapsed)
  assert.equal(leases.active('entity-alice', claimA, 132), false)
  assert.equal(leases.active('entity-bob', claimB, 132), true)
})
