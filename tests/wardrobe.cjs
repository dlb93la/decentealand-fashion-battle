const test = require('node:test')
const assert = require('node:assert/strict')
const { loader } = require('./loader.cjs')
const load = loader()
const { wardrobeGroups } = load(__dirname + '/../src/wardrobe.ts')
const { inventory } = load(__dirname + '/../src/data.ts')
test('wardrobe groups preserve equip indices and expose existing Back ornaments without the obsolete Backpack slot', () => {
  const all = wardrobeGroups.flatMap(g => g.items)
  assert.equal(new Set(all.map(i => i.slot + ':' + i.index)).size, all.length)
  for (const i of all) {
    assert.equal(inventory.items(i.slot)[i.index].name, i.name)
    assert.ok(i.slot !== 'Backpack')
  }
  for (const slot of ['Top','Bottom','Shoes','Hair','Accessories','Glasses','Hat','Head','Eyes','Face','Effects','Back'])
    assert.equal(all.filter(i => i.slot === slot).length, inventory.items(slot).length)
  assert.ok(wardrobeGroups.find(g => g.name === 'Full body').items.some(i => i.type === 'Jumpsuits'))
  assert.ok(wardrobeGroups.find(g => g.name === 'Full body').items.some(i => i.type === 'Dresses'))
  assert.ok(!wardrobeGroups[0].items.some(i => /dress|dungaree/i.test(i.name)))
})


test('wardrobe reserves camera space and maintains touch target size on small screens', () => {
  for (const [width, height] of [[844, 390], [1280, 720], [1920, 1080]]) {
    const loadUi = loader({ '@dcl/sdk/ecs': { engine: { RootEntity: 0 }, UiCanvasInformation: { getOrNull: () => ({ width, height, interactableArea: { top: 20, bottom: 20, left: 80, right: 80 } }) } } })
    const layout = loadUi(__dirname + '/../src/ui/theme.ts').wardrobeLayout()
    assert.ok(layout.height + 196 <= height - 40)
    assert.ok(layout.rowHeight - 8 >= 44)
    assert.ok(layout.itemHeight >= 76)
    assert.ok(layout.width < width * 0.6)
  }
})
