import { inventory, Category } from './data'

type Slot = Category | 'Back' | 'Eyes' | 'Face' | 'Effects'
export type WardrobeItem = { slot: Slot; index: number; name: string; color: string; type: string }
const groupNames = ['Upper', 'Lower', 'Full body', 'Feet', 'Hair', 'Accessories', 'Appearance', 'Effects']
export const wardrobeGroups = groupNames.map(name => ({ name, items: [] as WardrobeItem[] }))
const slots: Slot[] = ['Top', 'Bottom', 'Shoes', 'Hair', 'Accessories', 'Glasses', 'Hat', 'Head', 'Face', 'Eyes', 'Effects', 'Back']
for (const slot of slots) {
  inventory.items(slot).forEach((item, index) => {
    const name = item.name.toLowerCase()
    let group = 0, type = ''
    if (slot === 'Top') {
      if (/dress|jumpsuit|romper|overall|dungaree|outfit/.test(name)) { group = 2; type = /dress/.test(name) ? 'Dresses' : 'Jumpsuits' }
      else type = /jacket|coat|blazer|hoodie/.test(name) ? 'Jackets' : /top|bikini|bra\b/.test(name) ? 'Tops' : /sweater|pullover|sweatshirt/.test(name) ? 'Sweaters' : 'Shirts'
    } else if (slot === 'Bottom') { group = 1; type = /skirt|kilt/.test(name) ? 'Skirts' : /short|bikini|underwear/.test(name) ? 'Shorts' : 'Pants' }
    else if (slot === 'Shoes') { group = 3; type = /sandal|flip.flop|slipper/.test(name) ? 'Sandals' : /heel|stiletto/.test(name) ? 'Heels' : /boot/.test(name) ? 'Boots' : /sneaker|sport|trainer/.test(name) ? 'Sneakers' : 'Shoes' }
    else if (slot === 'Hair') { group = 4; type = 'Hair' }
    else if (['Accessories', 'Glasses', 'Hat', 'Back'].includes(slot)) { group = 5; type = slot === 'Back' ? 'Back' : slot === 'Glasses' ? 'Glasses' : slot === 'Hat' ? 'Hats' : 'Jewelry' }
    else if (slot === 'Effects') { group = 7; type = 'Effects' }
    else { group = 6; type = slot === 'Head' ? 'Skin' : slot === 'Face' ? 'Face' : 'Eyes' }
    wardrobeGroups[group].items.push({ slot, index, name: item.name, color: item.color, type })
  })
}
