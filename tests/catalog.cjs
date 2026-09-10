const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const load=require('./loader.cjs').loader();
const {CATALOG}=load(__dirname+'/../src/catalog.ts');
const {inventory,validOutfit}=load(__dirname+'/../src/data.ts');
const {createAvatarConfig}=load(__dirname+'/../src/avatar-factory.ts');
test('200 distinct catalog IDs have bundled thumbnails and equip through shared inventory',()=>{
 const ids=new Set();
 for(const [category,items] of Object.entries(CATALOG)) for(const [index,item] of items.entries()){
  ids.add(item.urn); assert.ok(fs.existsSync(__dirname+'/../'+item.thumbnail));
  const outfit={...inventory.initial(),[category]:index}; assert.ok(validOutfit(outfit));
  assert.ok(createAvatarConfig('test','Test',outfit).wearables.includes(item.urn));
 }
 assert.equal(ids.size,200);
});
