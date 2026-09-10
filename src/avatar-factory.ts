import { Outfit, SKIN_TONES } from './data'
import { WEARABLE_THUMBNAILS } from './wearable-thumbnails'
import { CATALOG } from './catalog'

export interface ColorRGB {
  r: number
  g: number
  b: number
}

export interface AvatarConfig {
  id: string
  name: string
  bodyShape: string
  wearables: string[]
  skinColor: ColorRGB
  hairColor: ColorRGB
  eyeColor: ColorRGB
  expressionTriggerId: string
  expressionTriggerTimestamp: number
}

export const BASE_BODY_SHAPES = {
  male: 'urn:decentraland:off-chain:base-avatars:BaseMale',
  female: 'urn:decentraland:off-chain:base-avatars:BaseFemale'
}

export const FACIAL_WEARABLES = [
  'urn:decentraland:off-chain:base-avatars:eyebrows_00',
  'urn:decentraland:off-chain:base-avatars:mouth_00',
  'urn:decentraland:off-chain:base-avatars:eyes_00'
]

// Default privacy robe used during preparation so players cannot copy each other (GDD Section 9)
export const PRIVACY_ROBE_WEARABLES = [
  ...FACIAL_WEARABLES,
  'urn:decentraland:off-chain:base-avatars:poloblacktshirt',
  'urn:decentraland:off-chain:base-avatars:distressed_black_Jeans',
  'urn:decentraland:off-chain:base-avatars:classic_shoes',
  'urn:decentraland:off-chain:base-avatars:short_hair'
]

export const TOP_WEARABLES: readonly string[] = [
  'urn:decentraland:off-chain:base-avatars:red_tshirt', // 0: Solar
  'urn:decentraland:off-chain:base-avatars:striped_shirt_01', // 1: Lunar
  'urn:decentraland:off-chain:base-avatars:blue_tshirt', // 2: Neon
  'urn:decentraland:off-chain:base-avatars:elegant_sweater', // 3: Royal
  'urn:decentraland:off-chain:base-avatars:f_white_shirt', // 4: Western
  'urn:decentraland:off-chain:base-avatars:poloblacktshirt', // 5: Chaos
  'urn:decentraland:off-chain:base-avatars:black_jacket',
  'urn:decentraland:off-chain:base-avatars:baggy_pullover',
  'urn:decentraland:off-chain:base-avatars:brown_sleveless_dress'
]

export const BOTTOM_WEARABLES: readonly string[] = [
  'urn:decentraland:off-chain:base-avatars:swim_short', // 0: Solar
  'urn:decentraland:off-chain:base-avatars:grey_joggers', // 1: Lunar
  'urn:decentraland:off-chain:base-avatars:f_jeans', // 2: Neon
  'urn:decentraland:off-chain:base-avatars:elegant_blue_trousers', // 3: Royal
  'urn:decentraland:off-chain:base-avatars:brown_pants', // 4: Western
  'urn:decentraland:off-chain:base-avatars:safari_pants' // 5: Chaos
]

export const SHOES_WEARABLES: readonly string[] = [
  'urn:decentraland:off-chain:base-avatars:sport_black_shoes', // 0: Solar
  'urn:decentraland:off-chain:base-avatars:sneakers', // 1: Lunar
  'urn:decentraland:off-chain:base-avatars:sneakers', // 2: Neon
  'urn:decentraland:off-chain:base-avatars:classic_shoes', // 3: Royal
  'urn:decentraland:off-chain:base-avatars:classic_shoes', // 4: Western
  'urn:decentraland:off-chain:base-avatars:sport_black_shoes' // 5: Chaos
]

export const HAIR_WEARABLES: readonly string[] = [
  'urn:decentraland:off-chain:base-avatars:short_hair', // 0: Solar
  'urn:decentraland:off-chain:base-avatars:pony_tail', // 1: Lunar
  'urn:decentraland:off-chain:base-avatars:cool_hair', // 2: Neon
  'urn:decentraland:off-chain:base-avatars:tall_front_01', // 3: Royal
  'urn:decentraland:off-chain:base-avatars:short_hair', // 4: Western
  'urn:decentraland:off-chain:base-avatars:curly_hair' // 5: Chaos
]

const urn = (name: string) => 'urn:decentraland:off-chain:base-avatars:' + name
export const EXTRA_WEARABLES = {
  Accessories: [
    'golden_earring',
    'blue_star_earring',
    'punk_piercing',
    'pearls_earring',
    'green_feather_earring',
    'f_skull_earring'
  ],
  Glasses: [
    'aviatorstyle',
    'rounded_sun_glasses',
    'matrix_sunglasses',
    'f_glasses_fashion',
    'black_sun_glasses',
    'heart_glasses'
  ],
  Hat: ['red_bandana', 'blue_bandana', 'green_stone_tiara', 'diamond_colored_tiara', 'laurel_wreath', 'blue_bandana']
} as const

export const POSE_TO_EMOTE: readonly string[] = [
  'raiseHand', // 0: Hero
  'disco', // 1: Dance
  'dab', // 2: Cool
  'headexplode', // 3: Laugh
  'fistpump', // 4: Flex
  'clap', // 5: Victory
  'raiseHand', // 6: Point
  'wave', // 7: Wave
  'robot', // 8: Superstar
  'money' // 9: Royal
]

export function poseEmoteUrn(pose: number): string {
  return 'urn:decentraland:off-chain:base-emotes:' + (POSE_TO_EMOTE[pose % POSE_TO_EMOTE.length] || 'wave').toLowerCase()
}

export function wearableThumbnail(category: string, index: number): string | undefined {
  if (category in CATALOG) return CATALOG[category as keyof typeof CATALOG][index]?.thumbnail
  const choices: Record<string, readonly string[]> = {
    Top: TOP_WEARABLES, Bottom: BOTTOM_WEARABLES, Shoes: SHOES_WEARABLES, Hair: HAIR_WEARABLES,
    ...EXTRA_WEARABLES
  }
  const item = choices[category]?.[index]
  return item ? WEARABLE_THUMBNAILS[item.split(':').pop()!] : undefined
}

export const STYLE_COLORS_RGB: readonly ColorRGB[] = [
  { r: 1.0, g: 0.725, b: 0.345 }, // Solar #FFB958
  { r: 0.71, g: 0.643, b: 0.961 }, // Lunar #B5A4F5
  { r: 0.439, g: 0.965, b: 0.796 }, // Neon #70F6CB
  { r: 0.91, g: 0.451, b: 0.686 }, // Royal #E873AF
  { r: 0.678, g: 0.475, b: 0.353 }, // Western #AD795A
  { r: 0.463, g: 0.725, b: 0.98 } // Chaos #76B9FA
]

export function createAvatarConfig(
  id: string,
  name: string,
  outfit: Outfit,
  pose = 0,
  timestamp = 1,
  privacy = false
): AvatarConfig {
  const isFemale = id.includes('Fashionista') || id.includes('Cyber') || outfit.bodyShape === BASE_BODY_SHAPES.female
  const bodyShape = isFemale ? BASE_BODY_SHAPES.female : BASE_BODY_SHAPES.male

  const topIdx = (outfit.Top ?? 0) % TOP_WEARABLES.length
  const bottomIdx = (outfit.Bottom ?? 0) % BOTTOM_WEARABLES.length
  const shoesIdx = (outfit.Shoes ?? 0) % SHOES_WEARABLES.length
  const hairIdx = (outfit.Hair ?? 0) % HAIR_WEARABLES.length

  const hairColor = STYLE_COLORS_RGB[hairIdx] || { r: 0.2, g: 0.15, b: 0.1 }
  const skinHex = SKIN_TONES[privacy ? 0 : outfit.Head] || SKIN_TONES[0]
  const skinColor = {
    r: parseInt(skinHex.slice(1, 3), 16) / 255,
    g: parseInt(skinHex.slice(3, 5), 16) / 255,
    b: parseInt(skinHex.slice(5, 7), 16) / 255
  }

  let wearables: string[]
  if (privacy) {
    // Outfit privacy: neutral robe during preparation to preserve reveal suspense (GDD Sec 9)
    wearables = [...PRIVACY_ROBE_WEARABLES]
  } else if (outfit.customWearables && outfit.customWearables.length > 0) {
    // Wearables equipped from native Decentraland Backpack/Inventory
    const hasFacial = FACIAL_WEARABLES.some((f) => outfit.customWearables!.some((w) => w.includes(f.split(':').pop()!)))
    wearables = hasFacial ? [...outfit.customWearables] : [...FACIAL_WEARABLES, ...outfit.customWearables]
  } else {
    // Curated catalog styles
    wearables = [
      ...['eyebrows', 'mouth'].map((category) => urn(category + '_0' + (outfit.Face ?? 0))),
      outfit.Eyes === undefined ? urn('eyes_0' + (outfit.Face ?? 0)) : CATALOG.Eyes[outfit.Eyes].urn,
      ...(['Top', 'Bottom', 'Shoes', 'Hair', 'Accessories', 'Glasses', 'Hat'] as const).map(k => CATALOG[k][outfit[k]].urn)
    ]
  }

  const emote = poseEmoteUrn(pose)

  return {
    id,
    name,
    bodyShape,
    wearables,
    skinColor,
    hairColor,
    eyeColor: { r: 0.2, g: 0.4, b: 0.7 },
    expressionTriggerId: emote,
    expressionTriggerTimestamp: timestamp
  }
}
