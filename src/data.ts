import { CATALOG } from './catalog'
export const CONFIG = {
  maxParticipants: 6,
  minimumCast: 6,
  maxStagePlayers: 2,
  botFill: true,
  lobby: 15,
  reveal: 4,
  preparation: 60,
  minimumPreparation: 10,
  duelIntro: 3,
  duelPose: 20,
  duelVoting: 10,
  duelResult: 6,
  results: 15,
  returning: 3,
  participation: 10,
  duelWin: 50,
  winnerBonus: 100,
  rewards: [100, 50, 25]
}

export type ThemeType = 'DIRECT' | 'CONCEPTUAL' | 'HUMOROUS' | 'CHARACTER' | 'SITUATIONAL'

export type Theme = {
  id: string
  title: string
  description: string
  keywords: string[]
  type?: ThemeType
}

export const THEMES: Theme[] = [
  {
    id: 'theme-0',
    title: 'Summer on Saturn',
    description: 'Sol, anéis e cores quentes sob gravidade baixa',
    keywords: ['sun', 'space'],
    type: 'DIRECT'
  },
  {
    id: 'theme-1',
    title: 'Date Night on the Moon',
    description: 'Romance estelar fora de órbita',
    keywords: ['royal', 'space'],
    type: 'SITUATIONAL'
  },
  {
    id: 'theme-2',
    title: 'Zombie Prom',
    description: 'Alta-costura elegante e macabra do outro mundo',
    keywords: ['chaos', 'royal'],
    type: 'HUMOROUS'
  },
  {
    id: 'theme-3',
    title: 'Cyberpunk Apocalypse',
    description: 'Neon, couro e circuitos após o fim do mundo',
    keywords: ['cyber', 'chaos'],
    type: 'CONCEPTUAL'
  },
  {
    id: 'theme-4',
    title: 'Space Cowboy',
    description: 'Oeste interestelar sem gravidade',
    keywords: ['western', 'space'],
    type: 'CHARACTER'
  },
  {
    id: 'theme-5',
    title: 'Alien Celebrity',
    description: 'Tapete vermelho na galáxia vizinha',
    keywords: ['space', 'royal'],
    type: 'CHARACTER'
  },
  {
    id: 'theme-6',
    title: 'First Date in 3026',
    description: 'O futuro hiperconectado do romance',
    keywords: ['cyber', 'royal'],
    type: 'SITUATIONAL'
  },
  {
    id: 'theme-7',
    title: 'Villain at a Wedding',
    description: 'Roube a cena com elegância, não o bolo',
    keywords: ['chaos', 'royal'],
    type: 'HUMOROUS'
  },
  {
    id: 'theme-8',
    title: 'Light & Shadow',
    description: 'Contraste minimalista preto e branco',
    keywords: ['space', 'royal'],
    type: 'CONCEPTUAL'
  },
  {
    id: 'theme-9',
    title: 'Worst Outfit Ever',
    description: 'O ápice da cafonice com muito orgulho',
    keywords: ['chaos', 'sun'],
    type: 'HUMOROUS'
  },
  {
    id: 'theme-10',
    title: 'Rich Degen on Mars',
    description: 'Luxo ostensivo no planeta vermelho',
    keywords: ['royal', 'space'],
    type: 'CHARACTER'
  }
]

export const CATEGORIES = [
  'Head',
  'Hair',
  'Top',
  'Bottom',
  'Shoes',
  'Accessories',
  'Hat',
  'Glasses',
  'Backpack'
] as const

export type Category = (typeof CATEGORIES)[number]

export type Outfit = Record<Category, number> & {
  Face?: number
  Eyes?: number
  Back?: number
  Effects?: number
  customWearables?: string[]
  bodyShape?: string
}

export const STYLES = [
  { name: 'Solar', color: '#FFB958', tag: 'sun' },
  { name: 'Lunar', color: '#B5A4F5', tag: 'space' },
  { name: 'Neon', color: '#70F6CB', tag: 'cyber' },
  { name: 'Royal', color: '#E873AF', tag: 'royal' },
  { name: 'Western', color: '#AD795A', tag: 'western' },
  { name: 'Chaos', color: '#76B9FA', tag: 'chaos' }
]

export const POSES = ['Hero', 'Dance', 'Cool', 'Laugh', 'Flex', 'Victory', 'Point', 'Wave']
const TOP_STYLES = [...STYLES,
  { name: 'Jaqueta', color: '#34343C', tag: 'cyber' },
  { name: 'Pulôver', color: '#A89F8A', tag: 'space' },
  { name: 'Vestido', color: '#AA7953', tag: 'royal' }]

export const SHOP = [
  { id: 'superstar', name: 'Pose Superstar', price: 250 },
  { id: 'royal', name: 'Pose Royal', price: 400 },
  { id: 'sparkles', name: 'Efeito Sparkles', price: 500 },
  { id: 'icon', name: 'Título Fashion Icon', price: 1000 }
]

export const SKIN_TONES = ['#E6C7A6', '#F3DAC5', '#CF9D76', '#AD7753', '#805237', '#513426']
const HEAD_ITEMS = SKIN_TONES.map((color, i) => ({ name: 'Tom ' + (i + 1), color, tag: '' }))
const FACE_ITEMS = STYLES.map((style, i) => ({ ...style, name: 'Rosto ' + (i + 1), tag: '' }))
const EFFECT_ITEMS = [
  { name: 'Nenhum', color: '#ECEBE5', tag: '' },
  { name: 'Sparkles', color: '#C9B894', tag: '' }
]
const BACK_ITEMS = [
  { name: 'Nenhum', color: '#ECEBE5', tag: '' },
  { name: 'Explorer', color: '#AD795A', tag: 'western' },
  { name: 'Jetpack', color: '#B5A4F5', tag: 'space' },
  { name: 'Wings', color: '#ECEBE5', tag: 'royal' }
]

export function hasSparkles(outfit: Outfit, owned: readonly string[]): boolean {
  // Missing selection retains the behavior of outfits saved before this selector.
  return outfit.Effects !== 0 && owned.includes('sparkles')
}

export interface InventoryProvider {
  items(category: Category | 'Face' | 'Effects' | 'Back' | 'Eyes'): typeof STYLES
  initial(): Outfit
}

export const inventory: InventoryProvider = {
  items: (category) => category in CATALOG ? CATALOG[category as keyof typeof CATALOG].map(item => ({...item})) : category === 'Head' ? HEAD_ITEMS : category === 'Face' ? FACE_ITEMS : category === 'Effects' ? EFFECT_ITEMS : category === 'Back' ? BACK_ITEMS : STYLES,
  initial: () => ({ ...Object.fromEntries(CATEGORIES.map((c, i) => [c, i % 6])), Face: 0 }) as Outfit
}

export function validOutfit(o: any): o is Outfit {
  return (
    !!o &&
    (o.Eyes === undefined || (Number.isInteger(o.Eyes) && o.Eyes >= 0 && o.Eyes < CATALOG.Eyes.length)) &&
    (o.Back === undefined || (Number.isInteger(o.Back) && o.Back >= 0 && o.Back < BACK_ITEMS.length)) &&
    (o.Effects === undefined || (Number.isInteger(o.Effects) && o.Effects >= 0 && o.Effects < EFFECT_ITEMS.length)) &&
    (o.Face === undefined || (Number.isInteger(o.Face) && o.Face >= 0 && o.Face < FACE_ITEMS.length)) &&
    (o.customWearables === undefined ||
      (Array.isArray(o.customWearables) &&
        o.customWearables.length <= 32 &&
        o.customWearables.every((w: unknown) => typeof w === 'string' && w.length < 256))) &&
    (o.bodyShape === undefined || typeof o.bodyShape === 'string') &&
    CATEGORIES.every((c) => Number.isInteger(o[c]) && o[c] >= 0 && o[c] < inventory.items(c).length)
  )
}

export function hash(s: string) {
  let n = 2166136261
  for (let i = 0; i < s.length; i++) n = Math.imul(n ^ s.charCodeAt(i), 16777619)
  return n >>> 0
}

export function botPreference(id: string): string {
  return id.includes('Fashionista') || id.includes('Stylist')
    ? 'royal'
    : id.includes('Cowboy')
      ? 'western'
      : id.includes('Cyber')
        ? 'cyber'
        : 'chaos'
}

export function botOutfit(id: string, theme: Theme): Outfit {
  const personality = botPreference(id)
  const thematic = STYLES.map((style, index) => ({ style, index })).filter(({ style }) => theme.keywords.includes(style.tag))
  const outfit = Object.fromEntries(
    CATEGORIES.map((c, i) => [
      c,
      i % 3 === 0 ? hash(id + c + theme.id) % 6 : STYLES.findIndex((s) => s.tag === personality)
    ])
  ) as unknown as Outfit
  for (const category of ['Top', 'Bottom', 'Shoes', 'Accessories'] as const) {
    const seed = hash(id + category + theme.id)
    if (thematic.length && (category === 'Top' || seed % 3 !== 0)) {
      outfit[category] = thematic[seed % thematic.length].index
    }
  }
  return outfit
}

export function botLookScore(outfit: Outfit, theme: Theme, voter: string, seed: string): number {
  const jitter = hash(seed) % 3
  // Native wearables lack verified style tags; ignore all stale catalog selections.
  if (outfit.customWearables?.length) return jitter
  const categories = ['Hair', 'Top', 'Bottom', 'Shoes', 'Accessories', 'Glasses', 'Hat'] as const
  const tags = categories.map(category => inventory.items(category)[outfit[category]].tag)
  const preference = botPreference(voter)
  const variety = new Set(tags).size
  const coherence = preference === 'chaos' ? Math.min(3, variety - 1) : Math.min(3, tags.length - variety)
  return tags.filter(tag => theme.keywords.includes(tag)).length * 2
    + Math.min(3, tags.filter(tag => tag === preference).length)
    + coherence + jitter
}
