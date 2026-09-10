const test = require('node:test')
const assert = require('node:assert/strict')
const { loader } = require('./loader.cjs')

const load = loader()
const {
  createAvatarConfig,
  FACIAL_WEARABLES,
  TOP_WEARABLES,
  BOTTOM_WEARABLES,
  SHOES_WEARABLES,
  HAIR_WEARABLES,
  POSE_TO_EMOTE,
  BASE_BODY_SHAPES
} = load(__dirname + '/../src/avatar-factory.ts')
const { inventory, validOutfit } = load(__dirname + '/../src/data.ts')

test('appearance choices preserve legacy looks and validate incoming faces', () => {
  const old = inventory.initial()
  delete old.Face
  assert.equal(validOutfit(old), true)
  for (const Face of [-1, 6, 1.5, '1', null]) assert.equal(validOutfit({ ...old, Face }), false)
  for (const Effects of [-1, 2, 1.5, '1', null]) assert.equal(validOutfit({ ...old, Effects }), false)
  for (const Effects of [0, 1]) assert.equal(validOutfit({ ...old, Effects }), true)
  const metadata = require('../docs/base-wearables.json')
  for (let i = 0; i < 6; i++) {
    const look = { ...old, Head: i, Face: i }
    assert.equal(validOutfit(look), true)
    const avatar = createAvatarConfig('p', 'P', look)
    for (const category of ['eyes', 'mouth', 'eyebrows']) {
      const id = category + '_0' + i
      assert.ok(avatar.wearables.some(w => w.endsWith(':' + id)))
      assert.ok(metadata.find(w => w.id === id).bodies.includes('BaseMale'))
      assert.ok(metadata.find(w => w.id === id).bodies.includes('BaseFemale'))
    }
    if (i) assert.notDeepEqual(avatar.skinColor, createAvatarConfig('p', 'P', old).skinColor)
    const hidden = createAvatarConfig('p', 'P', look, 0, 1, true)
    const neutral = createAvatarConfig('p', 'P', old, 0, 1, true)
    assert.deepEqual(hidden.wearables, neutral.wearables)
    assert.deepEqual(hidden.skinColor, neutral.skinColor)
  }
})

test('createAvatarConfig includes all mandatory facial features and clothes', () => {
  const outfit = inventory.initial()
  const config = createAvatarConfig('player-1', 'Player One', outfit, 0, 1)

  assert.equal(config.id, 'player-1')
  assert.equal(config.name, 'Player One')
  assert.ok(FACIAL_WEARABLES.every((w) => config.wearables.includes(w)))
  assert.ok(config.wearables.includes(TOP_WEARABLES[outfit.Top % 6]))
  assert.ok(config.wearables.includes(BOTTOM_WEARABLES[outfit.Bottom % 6]))
  assert.ok(config.wearables.includes(SHOES_WEARABLES[outfit.Shoes % 6]))
  assert.ok(config.wearables.includes(HAIR_WEARABLES[outfit.Hair % 6]))
  assert.equal(config.wearables.length, 10)
})

test('createAvatarConfig maps bot personalities to body shapes and styling', () => {
  const outfit = inventory.initial()
  const fashionista = createAvatarConfig('bot:Fashionista', 'Bot: Fashionista', outfit, 0, 1)
  const cowboy = createAvatarConfig('bot:Space Cowboy', 'Bot: Space Cowboy', outfit, 0, 1)

  assert.equal(fashionista.bodyShape, BASE_BODY_SHAPES.female)
  assert.equal(cowboy.bodyShape, BASE_BODY_SHAPES.male)
})

test('createAvatarConfig maps all 10 poses to valid built-in emotes', () => {
  const outfit = inventory.initial()
  for (let pose = 0; pose < 10; pose++) {
    const config = createAvatarConfig('p', 'P', outfit, pose, pose + 1)
    assert.equal(config.expressionTriggerId, 'urn:decentraland:off-chain:base-emotes:' + POSE_TO_EMOTE[pose].toLowerCase())
    assert.equal(config.expressionTriggerTimestamp, pose + 1)
    assert.ok(typeof config.expressionTriggerId === 'string' && config.expressionTriggerId.length > 0)
  }
})
