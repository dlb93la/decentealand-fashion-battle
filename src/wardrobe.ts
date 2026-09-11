import { inventory, Category } from './data'

type Slot = Category | 'Eyes' | 'Face' | 'Effects' | 'Back'
export type WardrobeItem = { slot: Slot; index: number; name: string; color: string; type: string }
const groupNames = ['Superior', 'Inferior', 'Corpo todo', 'Pés', 'Cabelo', 'Acessórios', 'Aparência', 'Efeitos', 'Costas']
export const wardrobeGroups = groupNames.map(name => ({ name, items: [] as WardrobeItem[] }))
const slots: Slot[] = ['Top', 'Bottom', 'Shoes', 'Hair', 'Accessories', 'Glasses', 'Hat', 'Head', 'Face', 'Eyes', 'Effects', 'Back']
for (const slot of slots) {
  inventory.items(slot).forEach((item, index) => {
    const name = item.name.toLowerCase()
    let group = 0, type = ''
    if (slot === 'Top') {
      if (/dress|jumpsuit|romper|overall|dungaree|outfit/.test(name)) { group = 2; type = /dress/.test(name) ? 'Vestidos' : 'Macacões' }
      else type = /jacket|coat|blazer|hoodie/.test(name) ? 'Jaquetas' : /top|bikini|bra\b/.test(name) ? 'Tops' : /sweater|pullover|sweatshirt/.test(name) ? 'Blusas' : 'Camisas'
    } else if (slot === 'Bottom') { group = 1; type = /skirt|kilt/.test(name) ? 'Saias' : /short|bikini|underwear/.test(name) ? 'Shorts' : 'Calças' }
    else if (slot === 'Shoes') { group = 3; type = /sandal|flip.flop|slipper/.test(name) ? 'Sandálias' : /heel|stiletto/.test(name) ? 'Saltos' : /boot/.test(name) ? 'Botas' : /sneaker|sport|trainer/.test(name) ? 'Tênis' : 'Sapatos' }
    else if (slot === 'Hair') { group = 4; type = 'Cabelos' }
    else if (['Accessories', 'Glasses', 'Hat'].includes(slot)) { group = 5; type = slot === 'Glasses' ? 'Óculos' : slot === 'Hat' ? 'Chapéus' : 'Joias' }
    else if (slot === 'Back') { group = 8; type = 'Costas' }
    else if (slot === 'Effects') { group = 7; type = 'Efeitos' }
    else { group = 6; type = slot === 'Head' ? 'Pele' : slot === 'Face' ? 'Rosto' : 'Olhos' }
    wardrobeGroups[group].items.push({ slot, index, name: item.name, color: item.color, type })
  })
}
