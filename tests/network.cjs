const test = require('node:test'),
  assert = require('node:assert/strict'),
  { loader } = require('./loader.cjs')
function transport() {
  let next = 100
  const shared = new Map(),
    clients = []
  return {
    client(id) {
      const maps = new Map(),
        links = new Map()
      let local = 10
      let online = true
      const component = (name) => {
        const data = new Map()
        const c = {
          componentId: name,
          create: (e, v) => data.set(e, structuredClone(v)),
          createOrReplace(e, v) {
            data.set(e, structuredClone(v))
            if (links.has(e) && online) {
              const key = links.get(e)
              shared.set(key, { name, value: structuredClone(v) })
              for (const other of clients) if (other !== api) other.receive(key, name, v)
            }
          },
          get: (e) => data.get(e),
          has: (e) => data.has(e),
          data
        }
        return c
      }
      const api = {
        receive(key, name, v) {
          if (!online) return
          const comp = maps.get(name)
          if (!comp) return
          let e = Array.from(links).find(([_, k]) => k === key)?.[0]
          if (e === undefined) {
            e = local++
            links.set(e, key)
          }
          comp.create(e, v)
        },
        disconnect() {
          online = false
        },
        tick(dt) {
          if (online) this.net.tick(dt)
        }
      }
      clients.push(api)
      const ecs = {
        engine: {
          addEntity: () => local++,
          defineComponent(name) {
            const c = component(name)
            maps.set(name, c)
            return c
          },
          getEntitiesWith(c) {
            return c.data.entries()
          }
        },
        Schemas: { String: 0, Int: 0 },
        AvatarEquippedData: { getOrNull: () => null },
        AvatarBase: { getOrNull: () => null }
      }
      const load = loader({
        '@dcl/sdk/ecs': ecs,
        '@dcl/sdk/network': {
          isStateSyncronized: () => true,
          syncEntity(e, ids, sid) {
            const key = sid ?? next++
            links.set(e, key)
            const c = maps.get(ids[0])
            if (shared.has(key)) {
              const x = shared.get(key)
              c.create(e, x.value)
            } else {
              shared.set(key, { name: ids[0], value: structuredClone(c.get(e)) })
              for (const other of clients) if (other !== api) other.receive(key, ids[0], c.get(e))
            }
            for (const [k, x] of shared) if (k !== key) api.receive(k, x.name, x.value)
          }
        },
        '@dcl/sdk/src/players': { getPlayer: () => ({ userId: id, name: id }) }
      })
      api.net = new (load(__dirname + '/../src/network.ts').FashionNetwork)()
      return api
    }
  }
}
test('two network clients share cast, accepted vote, results and leader recovery', () => {
  const oldNow = Date.now
  let now = 100000
  Date.now = () => now
  try {
    const t = transport(),
      a = t.client('alice'),
      b = t.client('bob')
    const tick = (seconds) => {
      for (let i = 0; i < seconds * 5; i++) {
        now += 200
        a.tick(0.2)
        b.tick(0.2)
      }
    }
    tick(80)
    assert.equal(a.net.state.round, 1)
    assert.deepEqual(a.net.state.cast, b.net.state.cast)
    assert.equal(a.net.state.leader, b.net.state.leader)
    while (a.net.state.phase !== 'VOTING' || a.net.state.duelIndex !== 1) tick(0.2)
    const candidate = a.net.state.duels[1].aId
    a.net.update({ round: 1, vote: candidate, voteDuel: 1 })
    tick(1)
    assert.equal(b.net.state.ballots.alice, candidate)
    while (a.net.state.phase !== 'RESULTS') tick(1)
    assert.deepEqual(a.net.state.results, b.net.state.results)
    const before = b.net.state.accounts.bob.points
    a.disconnect()
    tick(40)
    assert.equal(b.net.state.leader, b.net.mine.token)
    tick(25)
    assert.ok(b.net.state.round >= 2)
    assert.ok(b.net.state.accounts.bob.points >= before)
  } finally {
    Date.now = oldNow
  }
})
