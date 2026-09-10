const test = require('node:test')
const assert = require('node:assert/strict')
const { loader } = require('./loader.cjs')
const { botOutfit, botLookScore, THEMES, STYLES, inventory, validOutfit } = loader()(__dirname + '/../src/data.ts')
test('bots interpret every theme with available clothes and deterministic choices', () => {
  for (const id of ['Fashionista', 'Chaos', 'Cyber Queen', 'Space Cowboy', 'Comedian', 'Stylist']) {
    for (const theme of THEMES) {
      const look = botOutfit(id, theme)
      assert.ok(validOutfit(look))
      assert.ok(theme.keywords.includes(STYLES[look.Top].tag))
      assert.deepEqual(look, botOutfit(id, theme))
    }
  }
})
test('bot scoring ignores skin, premium cosmetics and stale native catalog choices', () => {
  const look = inventory.initial()
  const score = botLookScore(look, THEMES[0], 'Fashionista', 'fixed')
  assert.equal(botLookScore({ ...look, Head: 5, Face: 5, Effects: 1, Back: 3 }, THEMES[0], 'Fashionista', 'fixed'), score)
  const native = { ...look, customWearables: ['urn:test'] }
  assert.equal(botLookScore(native, THEMES[0], 'Chaos', 'fixed'), botLookScore({ ...native, Top: 5 }, THEMES[0], 'Chaos', 'fixed'))
  assert.ok(botLookScore(native, THEMES[0], 'Chaos', 'fixed') <= 2)
})
test('strong theme interpretation wins over unrelated clothes despite bounded randomness', () => {
  const look = inventory.initial()
  const aligned = { ...look }, unrelated = { ...look }
  for (const category of ['Hair', 'Top', 'Bottom', 'Shoes', 'Accessories', 'Glasses', 'Hat']) {
    aligned[category] = 0
    unrelated[category] = 3
  }
  for (let seed = 0; seed < 30; seed++) assert.ok(
    botLookScore(aligned, THEMES[0], 'Fashionista', 'a' + seed) > botLookScore(unrelated, THEMES[0], 'Fashionista', 'b' + seed)
  )
})
