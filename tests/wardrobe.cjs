const test = require('node:test')
const assert = require('node:assert/strict')
const { loader } = require('./loader.cjs')
const load = loader()
const { wardrobeGroups } = load(__dirname + '/../src/wardrobe.ts')
const { inventory } = load(__dirname + '/../src/data.ts')
test('wardrobe groups preserve equip indices and do not expose placeholder backpack items', () => {
  const all = wardrobeGroups.flatMap(g => g.items)
  assert.equal(new Set(all.map(i => i.slot + ':' + i.index)).size, all.length)
  for (const i of all) {
    assert.equal(inventory.items(i.slot)[i.index].name, i.name)
    assert.ok(!['Backpack', 'Back'].includes(i.slot))
  }
  for (const slot of ['Top','Bottom','Shoes','Hair','Accessories','Glasses','Hat','Head','Eyes','Face','Effects'])
    assert.equal(all.filter(i => i.slot === slot).length, inventory.items(slot).length)
  assert.ok(wardrobeGroups.find(g => g.name === 'Corpo todo').items.some(i => i.type === 'Macacões'))
  assert.ok(wardrobeGroups.find(g => g.name === 'Corpo todo').items.some(i => i.type === 'Vestidos'))
  assert.ok(!wardrobeGroups[0].items.some(i => /dress|dungaree/i.test(i.name)))
})
