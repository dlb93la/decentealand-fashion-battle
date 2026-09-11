const test = require('node:test'),
  assert = require('node:assert/strict')
const { loader } = require('./loader.cjs')
function fixture() {
  let id = 0
  const make = () => {
    const data = new Map()
    const writes = new Map()
    return {
      data, writes,
      create: (e, v) => data.set(e, structuredClone(v)),
      createOrReplace: (e, v) => data.set(e, structuredClone(v)),
      get: (e) => data.get(e),
      getMutable: (e) => { writes.set(e, (writes.get(e) || 0) + 1); return data.get(e) },
      has: (e) => data.has(e),
      deleteFrom: (e) => data.delete(e)
    }
  }
  const ecs = { engine: { addEntity: () => ++id }, AvatarModifierType: { AMT_HIDE_AVATARS: 0 }, AvatarAnchorPointType: { AAPT_SPINE2: 8 } }
  for (const name of [
    'Transform',
    'AvatarShape',
    'AvatarAttach',
    'TextShape',
    'Billboard',
    'AvatarModifierArea',
    'LightSource',
    'AudioSource',
    'Material',
    'MeshRenderer',
    'MeshCollider'
  ])
    ecs[name] = make()
  ecs.engine.removeEntity = e => { for (const component of Object.values(ecs)) component.data?.delete(e) }
  ecs.MeshRenderer.setBox = (e) => ecs.MeshRenderer.create(e, {})
  ecs.MeshCollider.setBox = (e) => ecs.MeshCollider.create(e, {})
  ecs.Material.setPbrMaterial = (e, v) => ecs.Material.create(e, v)
  ecs.LightSource.Type = { Spot: (x) => x, Point: (x) => x }
  ecs.AudioSource.playSound = (e, url) => {
    ecs.AudioSource.calls ||= []
    ecs.AudioSource.calls.push(url)
    ecs.AudioSource.getMutable(e).audioClipUrl = url
    ecs.AudioSource.getMutable(e).playing = true
  }
  const color = (hex) => ({ r: 1, g: 1, b: 1, a: 1 })
  const math = {
    Color3: { fromHexString: color, create: (r, g, b) => ({ r, g, b }) },
    Color4: { fromHexString: color },
    Quaternion: { fromEulerDegrees: (x, y, z) => ({ x, y, z, w: 1 }) },
    Vector3: { create: (x, y, z) => ({ x, y, z }) }
  }
  const load = loader({ '@dcl/sdk/ecs': ecs, '@dcl/sdk/math': math })
  const { FashionWorld } = load(__dirname + '/../src/world.ts'),
    { initial } = load(__dirname + '/../src/model.ts'),
    { inventory } = load(__dirname + '/../src/data.ts')
  return { ecs, world: new FashionWorld(), s: initial(), outfit: inventory.initial() }
}
test('invisible full-height colliders protect stage, backstage, both previews and champion', () => {
  const { ecs } = fixture()
  const volumes = [...ecs.MeshCollider.data.keys()]
    .filter((e) => !ecs.MeshRenderer.has(e))
    .map((e) => ecs.Transform.get(e))
  for (const [x, z] of [
    [12, 14],
    [12, 26],
    [3.5, 12],
    [20.5, 12],
    [38, 18]
  ]) {
    assert.ok(
      volumes.some(
        (v) =>
          Math.abs(x - v.position.x) <= v.scale.x / 2 && Math.abs(z - v.position.z) <= v.scale.z / 2 && v.scale.y === 10
      )
    )
  }
})
test('local previews differ per client; shared neutral models do not expose prepared clothes', () => {
  const a = fixture(),
    b = fixture()
  b.outfit.Top = 5
  for (const f of [a, b]) {
    f.s.phase = 'PREPARATION'
    f.s.remaining = 20
    f.s.cast = [{ id: 'other', name: 'Other', bot: false, outfit: f.outfit, pose: 0 }]
    f.world.update(f.s, f.outfit, 0, 0.2, [], 'local')
  }
  assert.notDeepEqual(
    a.ecs.AvatarShape.get(a.world.previewLeft.root).wearables,
    b.ecs.AvatarShape.get(b.world.previewLeft.root).wearables
  )
  assert.deepEqual(
    a.ecs.AvatarShape.get(a.world.figures[0].root).wearables,
    b.ecs.AvatarShape.get(b.world.figures[0].root).wearables
  )
  assert.ok(a.ecs.AvatarModifierArea.has(a.world.privacyArea))
})

test('vote highlight is private, follows the confirmed choice and resets between duels', () => {
  const { world, ecs, s, outfit } = fixture()
  s.phase = 'VOTING'
  s.duels = [
    { aId: 'a', bId: 'b' },
    { aId: 'c', bId: 'd' }
  ]
  s.ballots = { local: 'a', other: 'b' }
  world.update(s, outfit, 0, 0.2, [], 'local')
  assert.equal(ecs.Transform.get(world.voteLight).position.x, 10.9)
  assert.equal(ecs.LightSource.get(world.voteLight).intensity, 900)
  world.update(s, outfit, 0, 0.2, [], 'unvoted')
  assert.equal(ecs.LightSource.get(world.voteLight).intensity, 0)
  s.duelIndex = 1
  world.update(s, outfit, 0, 0.2, [], 'local')
  assert.equal(ecs.Transform.get(world.voteMarker).scale.x, 0)
})
test('hall reproduces recorded pose/effect and supports older records', () => {
  const { world, ecs, s, outfit } = fixture()
  s.hall = [{ winner: 'p', name: 'P', theme: 'Moon', votes: 3, timestamp: 1, outfit, pose: 1, cosmetics: ['sparkles'] }]
  world.update(s, outfit, 0, 0.2)
  assert.equal(ecs.AvatarShape.get(world.champion.root).expressionTriggerId, 'urn:decentraland:off-chain:base-emotes:disco')
  assert.equal(world.champion.sparkles.length, 6)
  const timestamp = ecs.AvatarShape.get(world.champion.root).expressionTriggerTimestamp
  s.hall[0] = { ...s.hall[0], timestamp: 2 }
  world.update(s, outfit, 0, 0.2)
  assert.ok(ecs.AvatarShape.get(world.champion.root).expressionTriggerTimestamp > timestamp)
  delete s.hall[0].pose
  delete s.hall[0].cosmetics
  world.update(s, outfit, 0, 0.2)
  assert.equal(ecs.AvatarShape.get(world.champion.root).expressionTriggerId, 'urn:decentraland:off-chain:base-emotes:clap')
  assert.ok(world.champion.sparkles.every((e) => ecs.Transform.get(e).scale.x === 0))
})

test('effects can be unequipped, cannot bypass ownership and remain hidden before reveal', () => {
  const { world, ecs, s, outfit } = fixture()
  outfit.Effects = 1
  world.update(s, outfit, 0, 0.2, [], 'local')
  assert.equal(world.previewLeft.sparkles.length, 0)
  world.update(s, outfit, 0, 0.2, ['sparkles'], 'local')
  assert.equal(world.previewLeft.sparkles.length, 6)
  outfit.Effects = 0
  world.update(s, outfit, 0, 0.2, ['sparkles'], 'local')
  assert.ok(world.previewLeft.sparkles.every(e => ecs.Transform.get(e).scale.x === 0))
  outfit.Effects = 1
  s.cast = [{ id: 'a', name: 'A', bot: true, outfit, pose: 0 }]
  s.accounts.a = { owned: ['sparkles'] }
  s.duels = [{ aId: 'a', bId: 'b' }]
  s.phase = 'PREPARATION'
  s.remaining = 10
  world.update(s, outfit, 0, 0.2)
  assert.equal(world.figures[0].sparkles.length, 0)
  s.phase = 'VOTING'
  world.update(s, outfit, 0, 0.2)
  assert.equal(world.figures[0].sparkles.length, 6)
  s.hall = [{ winner: 'a', name: 'A', theme: 'Moon', timestamp: 1, votes: 2, outfit: { ...outfit, Effects: 0 }, cosmetics: ['sparkles'] }]
  world.update(s, outfit, 0, 0.2)
  assert.equal(world.champion.sparkles.length, 0)
})

test('audio cues fire once per event and ballots from other players remain silent', () => {
  const { world, ecs, s, outfit } = fixture()
  const update = (id = 'local') => world.update(s, outfit, 0, 0.2, [], id)
  s.phase = 'THEME_REVEAL'
  update(); update()
  assert.deepEqual(ecs.AudioSource.calls, ['assets/Audio/transition.wav'])
  s.phase = 'VOTING'
  s.duels = [{ aId: 'a', bId: 'b' }, { aId: 'c', bId: 'd' }]
  s.ballots = { other: 'a' }
  update()
  assert.equal(ecs.AudioSource.calls.length, 1)
  s.ballots.local = 'a'
  update(); update()
  assert.equal(ecs.AudioSource.calls.length, 2)
  s.duelIndex = 1
  update()
  assert.equal(ecs.AudioSource.calls.length, 2)
  s.ballots.local = 'c'
  update(); update()
  assert.equal(ecs.AudioSource.calls.length, 3)
  s.phase = 'RESULTS'
  update(); update()
  assert.equal(ecs.AudioSource.calls.at(-1), 'assets/Audio/victory.wav')
  assert.equal(ecs.AudioSource.calls.length, 4)
})

test('back accessories attach to each local model, hide before reveal and reuse geometry', () => {
  const { world, ecs, s, outfit } = fixture()
  outfit.Back = 2
  s.cast = [{ id: 'a', name: 'A', bot: true, outfit, pose: 0 }]
  s.phase = 'PREPARATION'
  world.update(s, outfit, 0, 0.2)
  assert.equal(world.previewLeft.backParts.length, 3)
  assert.equal(ecs.AvatarAttach.get(world.previewLeft.backAnchor).avatarId, 'preview-left')
  assert.equal(world.figures[0].backParts.length, 0)
  s.phase = 'RESULTS'
  world.update(s, outfit, 0, 0.2)
  assert.equal(world.figures[0].backParts.length, 3)
  outfit.Back = 3
  world.update(s, outfit, 0, 0.2)
  assert.equal(world.figures[0].backParts.length, 3)
  s.cast = []
  world.update(s, outfit, 0, 0.2)
  assert.ok(world.figures[0].backParts.every(e => ecs.Transform.get(e).scale.x === 0))
})

test('future backstage models stay neutral and idle while local preview rotation remains local', () => {
  const { world, ecs, s, outfit } = fixture()
  s.phase = 'VOTING'
  s.cast = ['a', 'b', 'c'].map(id => ({ id, name: id, bot: true, outfit, pose: 1 }))
  s.duels = [{ aId: 'a', bId: 'b' }]
  world.update(s, outfit, 0, 0.2, [], 'local', 90)
  const backstage = world.figures[2]
  assert.equal(ecs.AvatarShape.get(backstage.root).expressionTriggerId, '')
  const { PRIVACY_ROBE_WEARABLES } = loader()(__dirname + '/../src/avatar-factory.ts')
  assert.deepEqual(ecs.AvatarShape.get(backstage.root).wearables, PRIVACY_ROBE_WEARABLES)
  assert.notDeepEqual(ecs.AvatarShape.get(backstage.root).wearables, ecs.AvatarShape.get(world.figures[0].root).wearables)
  const timestamp = ecs.AvatarShape.get(backstage.root).expressionTriggerTimestamp
  for (let i = 0; i < 20; i++) world.update(s, outfit, 0, 0.2, [], 'local', 90)
  assert.equal(ecs.AvatarShape.get(backstage.root).expressionTriggerTimestamp, timestamp)
  assert.equal(world.previewLeft.rotY, 225)
  assert.equal(world.previewRight.rotY, 315)
  assert.equal(world.figures[0].rotY, 180)
})


test('stationary avatars send no transform writes, even with fractional stage positions', () => {
  const { world, ecs, s, outfit } = fixture()
  s.phase = 'VOTING'
  s.cast = ['a', 'b', 'c'].map(id => ({ id, name: id, bot: true, outfit, pose: 1 }))
  s.duels = [{ aId: 'a', bId: 'b' }]
  world.update(s, outfit, 0, 0.2)
  const stableRoots = world.figures.map(f => f.root)
  const before = world.figures.map(f => ecs.Transform.writes.get(f.root) || 0)
  for (let i = 0; i < 60; i++) world.update(s, outfit, 0, 1 / 60)
  assert.deepEqual(world.figures.map(f => ecs.Transform.writes.get(f.root) || 0), before)
  assert.deepEqual(world.figures.map(f => f.root), stableRoots)
})

test('hidden slots remove AvatarShape without ever zero-scaling the avatar skeleton', () => {
  const { world, ecs, s, outfit } = fixture()
  world.update(s, outfit, 0, 0.2)
  const f = world.figures[0]
  assert.equal(ecs.AvatarShape.has(f.root), false)
  assert.equal(ecs.Transform.get(f.root).scale.x, 1)
  s.cast = [{ id: 'a', name: 'A', bot: true, outfit, pose: 1 }]
  world.update(s, outfit, 0, 0.2)
  assert.equal(ecs.AvatarShape.has(f.root), true)
  assert.equal(ecs.Transform.get(f.root).scale.x, 1)
})

test('pose replay is bounded, uses supported names, and leaves backstage idle', () => {
  const { world, ecs, s, outfit } = fixture()
  s.phase = 'VOTING'
  s.cast = ['a', 'b', 'c'].map(id => ({ id, name: id, bot: true, outfit, pose: 1 }))
  s.duels = [{ aId: 'a', bId: 'b' }]
  world.update(s, outfit, 0, 0.2)
  const f = world.figures[0], bg = world.figures[2]
  const first = ecs.AvatarShape.get(f.root).expressionTriggerTimestamp
  world.update(s, outfit, 0, 7)
  assert.equal(ecs.AvatarShape.get(f.root).expressionTriggerTimestamp, first)
  world.update(s, outfit, 0, 1.1)
  assert.equal(ecs.AvatarShape.get(f.root).expressionTriggerTimestamp, first + 1)
  assert.equal(ecs.AvatarShape.get(f.root).expressionTriggerId, 'urn:decentraland:off-chain:base-emotes:disco')
  assert.equal(ecs.AvatarShape.get(bg.root).expressionTriggerId, '')
})

test('privacy never covers fitting-room or backstage NPCs and ends before runway', () => {
  const { world, ecs, s, outfit } = fixture()
  s.phase = 'PREPARATION'
  s.cast = [{ id: 'a', name: 'A', bot: true, outfit, pose: 0 }]
  world.update(s, outfit, 0, 0.2)
  const center = ecs.Transform.get(world.privacyArea).position
  const area = ecs.AvatarModifierArea.get(world.privacyArea).area
  for (const f of [world.previewLeft, world.previewRight, world.champion, world.figures[0]]) {
    const p = ecs.Transform.get(f.root).position
    assert.ok(Math.abs(p.x - center.x) > area.x / 2 || Math.abs(p.z - center.z) > area.z / 2)
  }
  s.phase = 'RUNWAY'
  world.update(s, outfit, 0, 0.2)
  assert.equal(ecs.AvatarModifierArea.has(world.privacyArea), false)
})


test('stage relocation resets locomotion by replacing the entity and preserves appearance', () => {
  const { world, ecs, s, outfit } = fixture()
  s.cast = ['a', 'b'].map(id => ({ id, name: id, bot: true, outfit, pose: 1 }))
  s.phase = 'PREPARATION'
  world.update(s, outfit, 0, 0.2)
  const f = world.figures[0], oldRoot = f.root
  s.phase = 'VOTING'
  s.duels = [{ aId: 'a', bId: 'b' }]
  world.update(s, outfit, 0, 0.2)
  assert.notEqual(f.root, oldRoot)
  assert.equal(ecs.Transform.has(oldRoot), false)
  assert.equal(ecs.AvatarShape.get(f.root).id, f.id)
  assert.equal(ecs.AvatarShape.get(f.root).expressionTriggerId, 'urn:decentraland:off-chain:base-emotes:disco')
  assert.equal(ecs.Transform.get(f.root).position.x, 10.9)
})

test('music fades out before effects and returns smoothly without restarting its loop', () => {
  const { world, ecs, s, outfit } = fixture()
  const tick = () => world.update(s, outfit, 0, 0.05)
  for (let i = 0; i < 40; i++) tick()
  const music = ecs.AudioSource.get(world.audioMusic)
  assert.ok(music.loop && music.global && music.playing)
  assert.ok(music.volume > 0.2)
  s.phase = 'PREPARATION'; s.remaining = 80
  tick()
  assert.ok(music.volume > 0 && music.volume < 0.22)
  assert.equal(ecs.AudioSource.calls?.length || 0, 0)
  for (let i = 0; i < 8; i++) tick()
  assert.equal(music.volume, 0)
  assert.deepEqual(ecs.AudioSource.calls, ['assets/Audio/transition.wav'])
  for (let i = 0; i < 90; i++) tick()
  assert.ok(music.volume > 0.2)
  assert.equal(ecs.AudioSource.calls.length, 1)
})
