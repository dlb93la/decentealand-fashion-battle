import {
  engine,
  Entity,
  Transform,
  MeshRenderer,
  MeshCollider,
  Material,
  TextShape,
  Billboard,
  AvatarShape,
  AvatarAttach,
  AvatarAnchorPointType,
  LightSource,
  AudioSource,
  EngineInfo,
  AvatarModifierArea,
  AvatarModifierType
} from '@dcl/sdk/ecs'
import { Color3, Color4, Quaternion, Vector3 } from '@dcl/sdk/math'
import { Outfit, THEMES, inventory, CONFIG, hasSparkles } from './data'
import { State, outfitRevealed } from './model'
import { createAvatarConfig, poseEmoteUrn, PRIVACY_ROBE_WEARABLES } from './avatar-factory'

// Luxury Club & Runway Color Palette
const CLUB_BLACK = '#24262A'
const CLUB_FLOOR = '#76716A'
const HOF_FLOOR = '#8B8378'
const CLUB_RUNWAY = '#B0AAA0'
const CLUB_STEEL = '#1C2030'
const GLASS_TINT = '#0F1424'
const NEON_CYAN = '#E7E5DF'
const NEON_MAGENTA = '#D4CABE'
const NEON_PURPLE = '#A7A39B'
const NEON_GOLD = '#C9B894'
const NEON_MINT = '#ECEBE5'
const IVORY = '#F3EFE8'

function paint(
  e: Entity,
  hex: string,
  glow = false,
  roughness = 0.65,
  metallic = 0.1,
  emissiveIntensity = 1.0,
  alpha = 1.0
) {
  const color = Color4.fromHexString(hex)
  color.a = alpha
  Material.setPbrMaterial(e, {
    albedoColor: color,
    ...(alpha < 1 ? { transparencyMode: 2 } : {}), // SDK MTM_ALPHA_BLEND
    roughness,
    metallic,
    ...(glow ? { emissiveColor: Color3.fromHexString(hex), emissiveIntensity: Math.min(emissiveIntensity, 0.04) } : {})
  })
}

function box(
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  color: string,
  parent?: Entity,
  solid = false,
  glow = false,
  roughness = 0.65,
  metallic = 0.1,
  emissiveIntensity = 1.0,
  alpha = 1.0
) {
  const e = engine.addEntity()
  Transform.create(e, { position: { x, y, z }, scale: { x: w, y: h, z: d }, parent })
  MeshRenderer.setBox(e)
  paint(e, color, glow, roughness, metallic, emissiveIntensity, alpha)
  if (solid) MeshCollider.setBox(e)
  return e
}

function barrier(
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  railColor = CLUB_STEEL,
  parent?: Entity
) {
  // Sleek barrier with transparent glass body and metallic top rail
  const glass = engine.addEntity()
  Transform.create(glass, { position: { x, y: y + h / 2, z }, scale: { x: w, y: h, z: d }, parent })
  MeshRenderer.setBox(glass)
  paint(glass, GLASS_TINT, false, 0.6, 0.05, 0, 0.08)
  MeshCollider.setBox(glass) // Blocks player navigation

  return glass
}

function label(text: string, x: number, y: number, z: number, size = 2, color = IVORY) {
  const e = engine.addEntity()
  Transform.create(e, { position: { x, y, z } })
  TextShape.create(e, {
    text,
    fontSize: size,
    textColor: Color4.fromHexString(color),
    outlineColor: Color4.fromHexString(CLUB_BLACK),
    outlineWidth: 0.14
  })
  Billboard.create(e)
  return e
}

export class AvatarFigure {
  root: Entity
  sparkles: Entity[] = []
  backParts: Entity[] = []
  backAnchor?: Entity
  backStyle = 0
  id: string
  name: string
  lastOutfitSig = ''
  lastPose = -1
  lamport = 1
  rotY: number
  private lastPoseTime = -Infinity
  private savedAvatar?: ReturnType<typeof AvatarShape.get>
  private positionKey = ''

  constructor(id: string, name: string, x: number, y: number, z: number, rotY = 180, scale = 1, initialRobed = true) {
    this.id = id
    this.name = name
    this.rotY = rotY
    this.positionKey = `${x}:${y}:${z}`
    this.root = engine.addEntity()

    Transform.create(this.root, {
      position: { x, y, z },
      rotation: Quaternion.fromEulerDegrees(0, rotY, 0),
      scale: { x: scale, y: scale, z: scale }
    })

    const outfitToUse = initialRobed
      ? { ...inventory.initial(), customWearables: [...PRIVACY_ROBE_WEARABLES] }
      : inventory.initial()
    const config = createAvatarConfig(this.id, this.name, outfitToUse, 0, this.lamport)

    AvatarShape.create(this.root, {
      id: this.id,
      name: this.name,
      bodyShape: config.bodyShape,
      wearables: initialRobed ? [...PRIVACY_ROBE_WEARABLES] : config.wearables,
      skinColor: config.skinColor,
      hairColor: config.hairColor,
      eyeColor: config.eyeColor,
      expressionTriggerId: initialRobed ? '' : config.expressionTriggerId,
      expressionTriggerTimestamp: this.lamport,
      talking: false,
      emotes: []
    })

    if (initialRobed) {
      this.lastOutfitSig = 'robed:initial'
    }
  }

  // Remove the avatar while unused instead of collapsing its skeleton to scale zero.
  visible(show: boolean) {
    if (!show && AvatarShape.has(this.root)) {
      this.savedAvatar = { ...AvatarShape.get(this.root) }
      AvatarShape.deleteFrom(this.root)
    } else if (show && !AvatarShape.has(this.root) && this.savedAvatar) {
      AvatarShape.create(this.root, this.savedAvatar)
      this.lastPoseTime = -Infinity
    }
  }

  place(x: number, y: number, z: number) {
    const key = `${x}:${y}:${z}`
    if (key === this.positionKey) return
    this.positionKey = key
    // AvatarShape locomotion can latch after a teleport in preview clients.
    // A fresh entity at the destination has no previous position/velocity to interpolate.
    const oldRoot = this.root
    const transform = Transform.get(oldRoot)
    const avatar = AvatarShape.has(oldRoot) ? { ...AvatarShape.get(oldRoot) } : undefined
    this.root = engine.addEntity()
    Transform.create(this.root, { ...transform, position: { x, y, z } })
    for (const sparkle of this.sparkles) Transform.getMutable(sparkle).parent = this.root
    engine.removeEntity(oldRoot)
    if (avatar) AvatarShape.create(this.root, avatar)
  }

  effect(enabled: boolean, time: number) {
    if (enabled && !this.sparkles.length)
      for (let i = 0; i < 6; i++)
        this.sparkles.push(box(0, 0, 0, 0.12, 0.12, 0.12, NEON_GOLD, this.root, false, true, 0.1, 0.9, 1.5))
    this.sparkles.forEach((e, i) => {
      const t = Transform.getMutable(e)
      t.position = {
        x: Math.sin(time * 2 + (i * Math.PI) / 3) * 0.85,
        y: 1.3 + Math.sin(time * 3 + i) * 0.6,
        z: Math.cos(time * 2 + (i * Math.PI) / 3) * 0.85
      }
      t.scale = { x: enabled ? 0.12 : 0, y: enabled ? 0.12 : 0, z: enabled ? 0.12 : 0 }
      t.rotation = Quaternion.fromEulerDegrees(45, time * 80, 45)
    })
  }

  dress(outfit: Outfit, botId?: string, forceRobed = false) {
    this.back(forceRobed ? 0 : (outfit.Back ?? 0))
    const sig = (forceRobed ? 'robed:' : 'normal:') + JSON.stringify(outfit) + (botId || '')
    if (sig === this.lastOutfitSig) return
    this.lastOutfitSig = sig

    if (forceRobed) {
      if (AvatarShape.has(this.root)) {
        const av = AvatarShape.getMutable(this.root)
        av.wearables = [...PRIVACY_ROBE_WEARABLES]
        av.hairColor = { r: 0.2, g: 0.2, b: 0.2 }
        av.skinColor = { r: 230 / 255, g: 199 / 255, b: 166 / 255 }
        av.expressionTriggerId = ''
        av.expressionTriggerTimestamp = ++this.lamport
      }
      return
    }

    const config = createAvatarConfig(
      botId || this.id,
      this.name,
      outfit,
      this.lastPose >= 0 ? this.lastPose : 0,
      this.lamport
    )

    if (AvatarShape.has(this.root)) {
      const av = AvatarShape.getMutable(this.root)
      av.name = this.name
      av.wearables = config.wearables
      av.bodyShape = config.bodyShape
      av.hairColor = config.hairColor
      av.skinColor = config.skinColor
    }
  }

  pose(n: number, time: number) {
    if (!AvatarShape.has(this.root)) return
    // Default emotes play once. Replay at a bounded interval, never every frame.
    if (n === this.lastPose && (n < 0 || time - this.lastPoseTime < 8)) return
    this.lastPoseTime = time
    this.lastPose = n
    this.lamport++

    const emote = n < 0 ? '' : poseEmoteUrn(n)
    if (AvatarShape.has(this.root)) {
      const av = AvatarShape.getMutable(this.root)
      av.expressionTriggerId = emote
      av.expressionTriggerTimestamp = this.lamport
    }
  }

  back(style: number) {
    if (this.backStyle === style) return
    this.backStyle = style
    for (const part of this.backParts) Transform.getMutable(part).scale = { x: 0, y: 0, z: 0 }
    if (!style) return
    if (!this.backAnchor) {
      this.backAnchor = engine.addEntity()
      Transform.create(this.backAnchor)
      AvatarAttach.create(this.backAnchor, { avatarId: this.id, anchorPointId: AvatarAnchorPointType.AAPT_SPINE2 })
      for (let i = 0; i < 3; i++) this.backParts.push(box(0, 0, 0, 0, 0, 0, IVORY, this.backAnchor))
    }
    const parts = style === 1
      ? [[0, 0, -0.22, 0.42, 0.5, 0.2], [0, -0.13, -0.35, 0.3, 0.2, 0.08], [0, 0.3, -0.2, 0.18, 0.08, 0.08]]
      : style === 2
        ? [[-0.18, 0, -0.22, 0.17, 0.58, 0.2], [0.18, 0, -0.22, 0.17, 0.58, 0.2], [0, 0, -0.22, 0.28, 0.25, 0.16]]
        : [[-0.42, 0.06, -0.16, 0.65, 0.34, 0.06], [0.42, 0.06, -0.16, 0.65, 0.34, 0.06], [0, 0, -0.16, 0.2, 0.2, 0.08]]
    this.backParts.forEach((part, i) => {
      const [x, y, z, w, h, d] = parts[i]
      const transform = Transform.getMutable(part)
      transform.position = { x, y, z }
      transform.scale = { x: w, y: h, z: d }
      transform.rotation = Quaternion.fromEulerDegrees(0, 0, style === 3 && i < 2 ? (i === 0 ? -25 : 25) : 0)
      paint(part, style === 1 ? '#AD795A' : style === 2 ? '#A7A3B9' : IVORY)
    })
  }
}

export class FashionWorld {
  figures: AvatarFigure[] = []
  previewLeft: AvatarFigure
  previewRight: AvatarFigure
  champion: AvatarFigure
  voteLight: Entity
  voteMarker: Entity
  lastChampion = ''
  private privacyKey = ''
  themeBanner: Entity
  hallSign: Entity
  clockLeft: Entity
  clockRight: Entity
  audioMusic: Entity
  private audioPending?: { clip: string; duration: number; delay: number }
  private audioHold = 0
  private musicVolume = 0
  audioFeedback: Entity
  lastFeedbackPhase = ''
  lastVoteSound = ''
  names: Entity[] = []
  time = 0
  privacyArea: Entity
  lastCountdownPlayed = false

  constructor() {
    // ==========================================
    // 1. GRAND NIGHTCLUB ARCHITECTURE (32x32m, 10m HIGH CEILING)
    // ==========================================
    // Main Runway Hall Reflective Floor (24m wide x 32m deep)
    box(12.0, 0.05, 16.0, 24.0, 0.1, 32.0, CLUB_FLOOR, undefined, true, false, 0.2, 0.8)

    // Isolated Hall of Fame Annex Floor (8m wide x 32m deep)
    box(36.0, 0.05, 16.0, 24.0, 0.1, 32.0, HOF_FLOOR, undefined, true, false, 0.18, 0.82)

    // High Industrial Ceiling (10m high covering 32x32m)
    box(24.0, 10.0, 16.0, 48.0, 0.2, 32.0, CLUB_BLACK, undefined, true)

    // Outer Perimeter Enclosure Walls (10m high)
    // Back perimeter wall
    box(24.0, 5.0, 31.9, 48.0, 10.0, 0.2, CLUB_BLACK, undefined, true)
    // Left perimeter wall
    box(0.1, 5.0, 16.0, 0.2, 10.0, 32.0, CLUB_BLACK, undefined, true)
    // Right perimeter wall
    box(47.9, 5.0, 16.0, 0.2, 10.0, 32.0, CLUB_BLACK, undefined, true)
    // Front entrance wall with club entry portal at X=12
    box(5.0, 5.0, 0.1, 10.0, 10.0, 0.2, CLUB_BLACK, undefined, true)
    box(31.0, 5.0, 0.1, 34.0, 10.0, 0.2, CLUB_BLACK, undefined, true)
    box(12.0, 7.5, 0.1, 4.2, 5.0, 0.2, CLUB_BLACK, undefined, true)

    // Club Entrance Portal Frame
    box(10.0, 2.5, 0.15, 0.1, 5.0, 0.1, NEON_GOLD, undefined, false, true, 0.1, 0.1, 1.2)
    box(14.0, 2.5, 0.15, 0.1, 5.0, 0.1, NEON_GOLD, undefined, false, true, 0.1, 0.1, 1.2)
    box(12.0, 5.0, 0.15, 4.2, 0.1, 0.1, NEON_GOLD, undefined, false, true, 0.1, 0.1, 1.2)
    label('FASHION BATTLE', 12.0, 5.4, 0.3, 1.8, NEON_GOLD)

    // ==========================================
    // 2. ISOLATED HALL OF FAME ANNEX (DIVIDING WALL & VIP PORTAL)
    // ==========================================
    // Acoustic dividing wall along X = 24.0 (isolating Hall of Fame)
    // South wall section
    box(24.0, 5.0, 6.0, 0.25, 10.0, 12.0, CLUB_BLACK, undefined, true)
    // North wall section
    box(24.0, 5.0, 24.5, 0.25, 10.0, 15.0, CLUB_BLACK, undefined, true)
    // VIP Archway header above entrance opening (opening from Z=12 to Z=17)
    box(24.0, 7.5, 14.5, 0.25, 5.0, 5.0, CLUB_BLACK, undefined, true)

    // VIP Entrance Archway Columns & Signage
    box(24.0, 2.5, 12.0, 0.3, 5.0, 0.3, NEON_GOLD, undefined, false, true, 0.1, 0.8, 1.2)
    box(24.0, 2.5, 17.0, 0.3, 5.0, 0.3, NEON_GOLD, undefined, false, true, 0.1, 0.8, 1.2)
    box(24.0, 5.0, 14.5, 0.3, 0.2, 5.3, NEON_GOLD, undefined, false, true, 0.1, 0.8, 1.2)
    label('HALL OF FAME', 23.8, 5.35, 14.5, 1.4, NEON_GOLD)

    // ==========================================
    // 3. INDUSTRIAL CEILING TRUSSES & AMBIENT LEDS
    // ==========================================
    const trussZ = [5.0, 12.0, 19.0, 26.0]
    trussZ.forEach((z) => {
      box(12.0, 9.2, z, 23.6, 0.3, 0.3, CLUB_STEEL)
    })
    box(6.0, 9.3, 15.5, 0.25, 0.25, 22.0, CLUB_STEEL)
    box(18.0, 9.3, 15.5, 0.25, 0.25, 22.0, CLUB_STEEL)

    // Subtle perimeter wall vertical LED strips (soft accent)
    const stripZ = [4.0, 9.0, 14.0, 19.0, 24.0]
    stripZ.forEach((z, idx) => {
      const c = idx % 2 === 0 ? NEON_CYAN : NEON_MAGENTA
      box(0.22, 5.0, z, 0.04, 7.5, 0.12, c, undefined, false, true, 0.1, 0.1, 1.0)
    })

    // ==========================================
    // 4. ELEVATED RUNWAY CATWALK & PHYSICAL BARRIERS
    // ==========================================
    // Central runway catwalk (width 3.6m, depth 14.0m, height 0.38m from Z=7 to Z=21)
    box(12.0, 0.19, 14.0, 6.0, 0.38, 14.0, CLUB_RUNWAY, undefined, true, false, 0.15, 0.85)

    // Runway illuminated track edges
    box(9.02, 0.39, 14.0, 0.06, 0.04, 14.0, NEON_GOLD, undefined, false, true, 0.1, 0.1, 1.2)
    box(14.98, 0.39, 14.0, 0.06, 0.04, 14.0, NEON_GOLD, undefined, false, true, 0.1, 0.1, 1.2)
    box(12.0, 0.39, 7.02, 6.0, 0.04, 0.06, NEON_GOLD, undefined, false, true, 0.1, 0.1, 1.2)

    // PHYSICAL BARRIERS / GLASS RAILING (Players cannot jump or climb onto runway)
    // Left barrier (solid collider, height 2.2m)
    barrier(8.95, 0.38, 14.0, 0.08, 9.62, 14.0, NEON_CYAN)
    // Right barrier (solid collider, height 2.2m)
    barrier(15.05, 0.38, 14.0, 0.08, 9.62, 14.0, NEON_MAGENTA)
    // Front catwalk tip barrier (solid collider, height 2.2m)
    barrier(12.0, 0.38, 6.95, 6.2, 9.62, 0.08, NEON_GOLD)

    // Duelist Stage Markers (Slot A & Slot B) on Catwalk Floor
    box(10.9, 0.39, 14.0, 1.2, 0.01, 1.2, NEON_CYAN, undefined, false, true, 0.1, 0.1, 1.2)
    box(13.1, 0.39, 14.0, 1.2, 0.01, 1.2, NEON_MAGENTA, undefined, false, true, 0.1, 0.1, 1.2)
    label('SLOT A', 10.9, 0.52, 13.2, 0.8, NEON_CYAN)
    label('SLOT B', 13.1, 0.52, 13.2, 0.8, NEON_MAGENTA)

    // ==========================================
    // 5. VIP BACKSTAGE & CONTESTANT WAITING AREA
    // ==========================================
    // Elevated backstage platform (height 0.5m, Z=21 to 31)
    box(12.0, 0.25, 26.0, 23.6, 0.5, 10.0, CLUB_FLOOR, undefined, true)

    // Backstage spectator separation barrier (solid collider along Z=21.0)
    barrier(5.5, 0.5, 21.0, 8.8, 1.6, 0.08, CLUB_STEEL)
    barrier(18.5, 0.5, 21.0, 8.8, 1.6, 0.08, CLUB_STEEL)

    // DJ Booth Console
    box(12.0, 1.1, 29.5, 3.4, 1.2, 1.2, '#151124', undefined, true)
    box(12.0, 1.1, 28.88, 3.0, 0.6, 0.04, NEON_PURPLE, undefined, false, true, 0.1, 0.1, 1.2)
    label('DJ BOOTH', 12.0, 1.85, 28.9, 0.8, NEON_PURPLE)

    // Billboard & Grand Theme Signage on Backstage Wall
    box(12.0, 7.2, 31.75, 12.0, 2.4, 0.1, '#0C0E1A')
    box(12.0, 7.2, 31.7, 12.2, 2.6, 0.04, NEON_GOLD, undefined, false, true, 0.1, 0.1, 1.2)
    label('DECENTEALAND', 12.0, 7.8, 31.6, 2.2, NEON_GOLD)
    label('F A S H I O N   B A T T L E', 12.0, 7.1, 31.6, 1.4, IVORY)
    this.themeBanner = label('THEME: INITIALIZING...', 12.0, 6.4, 31.6, 1.5, NEON_CYAN)

    // ==========================================
    // 6. DUAL WARDROBE PROVADORES (WEST & EAST)
    // ==========================================
    // --- PROVADOR OESTE (Left / West Wall: X=3.5, Z=12.0) ---
    box(3.5, 0.18, 12.0, 3.2, 0.24, 3.2, CLUB_FLOOR, undefined, true)
    box(3.5, 0.31, 12.0, 2.8, 0.02, 2.8, NEON_MINT, undefined, false, true, 0.1, 0.1, 1.2)
    // Protective glass railing around fitting pedestal
    barrier(1.8, 0.24, 12.0, 0.06, 1.5, 3.2, NEON_MINT)
    barrier(3.5, 0.24, 13.6, 3.2, 1.5, 0.06, NEON_MINT)
    barrier(3.5, 0.24, 10.4, 3.2, 1.5, 0.06, NEON_MINT)

    label('MEU LOOK', 3.5, 2.6, 12.0, 0.9, NEON_MINT)
    this.clockLeft = label('TEMPO: --', 3.5, 3.4, 12.0, 1.2, NEON_GOLD)
    this.previewLeft = new AvatarFigure('preview-left', 'MEU LOOK', 3.5, 0.33, 12.0, 135, 1.0, false)

    // --- PROVADOR LESTE (Right / East Wall of Main Hall: X=20.5, Z=12.0) ---
    box(20.5, 0.18, 12.0, 3.2, 0.24, 3.2, CLUB_FLOOR, undefined, true)
    box(20.5, 0.31, 12.0, 2.8, 0.02, 2.8, NEON_MINT, undefined, false, true, 0.1, 0.1, 1.2)
    // Protective glass railing around fitting pedestal
    barrier(22.2, 0.24, 12.0, 0.06, 1.5, 3.2, NEON_MINT)
    barrier(20.5, 0.24, 13.6, 3.2, 1.5, 0.06, NEON_MINT)
    barrier(20.5, 0.24, 10.4, 3.2, 1.5, 0.06, NEON_MINT)

    label('MEU LOOK', 20.5, 2.6, 12.0, 0.9, NEON_MINT)
    this.clockRight = label('TEMPO: --', 20.5, 3.4, 12.0, 1.2, NEON_GOLD)
    this.previewRight = new AvatarFigure('preview-right', 'MEU LOOK', 20.5, 0.33, 12.0, 225, 1.0, false)

    // ==========================================
    // 7. ISOLATED VIP HALL OF FAME ROOM (X=38.0, Z=18.0)
    // ==========================================
    // Champion Podium with golden accents
    box(38.0, 0.35, 18.0, 3.4, 0.55, 3.4, '#1C1708', undefined, true)
    box(38.0, 0.63, 18.0, 3.0, 0.04, 3.0, NEON_GOLD, undefined, false, true, 0.1, 0.1, 1.4)
    // Barrier around podium
    barrier(36.2, 0.55, 18.0, 0.06, 1.4, 3.4, NEON_GOLD)
    barrier(39.8, 0.55, 18.0, 0.06, 1.4, 3.4, NEON_GOLD)
    barrier(38.0, 0.55, 16.2, 3.4, 1.4, 0.06, NEON_GOLD)

    this.champion = new AvatarFigure('champion-hof', 'CAMPEÃO', 38.0, 0.66, 18.0, 225, 1.0, false)
    this.hallSign = label('HALL OF FAME\nSeu look pode ficar aqui', 38.0, 3.2, 18.0, 0.95, NEON_GOLD)

    // ==========================================
    // 8. STUDIO RUNWAY LIGHTS (NATURAL WHITE & HIGH FIDELITY)
    // ==========================================
    // Pure Studio White Spotlights on Duelist Slots (Accurate Garment Colors)
    // Slot A Studio Spot
    const spotA = engine.addEntity()
    Transform.create(spotA, {
      position: Vector3.create(10.9, 8.8, 12.8),
      rotation: Quaternion.fromEulerDegrees(68, 0, 0)
    })
    LightSource.create(spotA, {
      type: LightSource.Type.Spot({ innerAngle: 32, outerAngle: 58 }),
      color: Color3.create(1.0, 0.98, 0.95), // Pure neutral warm white studio light
      intensity: 3500,
      shadow: false
    })
    box(10.9, 8.9, 12.8, 0.4, 0.4, 0.5, CLUB_STEEL)

    // Slot B Studio Spot
    const spotB = engine.addEntity()
    Transform.create(spotB, {
      position: Vector3.create(13.1, 8.8, 12.8),
      rotation: Quaternion.fromEulerDegrees(68, 0, 0)
    })
    LightSource.create(spotB, {
      type: LightSource.Type.Spot({ innerAngle: 32, outerAngle: 58 }),
      color: Color3.create(1.0, 0.98, 0.95), // Pure neutral warm white studio light
      intensity: 3500,
      shadow: false
    })
    box(13.1, 8.9, 12.8, 0.4, 0.4, 0.5, CLUB_STEEL)

    // Runway Center Walkway Spotlight (Daylight White)
    const spotRunway = engine.addEntity()
    Transform.create(spotRunway, {
      position: Vector3.create(12.0, 8.8, 9.0),
      rotation: Quaternion.fromEulerDegrees(65, 0, 0)
    })
    LightSource.create(spotRunway, {
      type: LightSource.Type.Spot({ innerAngle: 35, outerAngle: 65 }),
      color: Color3.create(1.0, 0.98, 0.95),
      intensity: 2500,
      shadow: false
    })

    // Ambient Fill Lights (Broad, Soft, Balanced illumination for clothes & textures)
    // Main Hall Front Fill Light
    const fillMain1 = engine.addEntity()
    Transform.create(fillMain1, { position: Vector3.create(12.0, 6.5, 9.0) })
    LightSource.create(fillMain1, {
      type: LightSource.Type.Point({}),
      color: Color3.create(0.96, 0.95, 0.94),
      intensity: 4000,
      range: 16
    })

    // Main Hall Backstage Fill Light
    const fillMain2 = engine.addEntity()
    Transform.create(fillMain2, { position: Vector3.create(12.0, 6.5, 22.0) })
    LightSource.create(fillMain2, {
      type: LightSource.Type.Point({}),
      color: Color3.create(0.96, 0.95, 0.94),
      intensity: 4000,
      range: 16
    })

    // Provador Oeste Studio Light
    const lightProvO = engine.addEntity()
    Transform.create(lightProvO, { position: Vector3.create(3.5, 4.2, 12.0) })
    LightSource.create(lightProvO, {
      type: LightSource.Type.Point({}),
      color: Color3.create(1.0, 1.0, 1.0),
      intensity: 1200,
      range: 8
    })

    // Provador Leste Studio Light
    const lightProvL = engine.addEntity()
    Transform.create(lightProvL, { position: Vector3.create(20.5, 4.2, 12.0) })
    LightSource.create(lightProvL, {
      type: LightSource.Type.Point({}),
      color: Color3.create(1.0, 1.0, 1.0),
      intensity: 1200,
      range: 8
    })

    // Hall of Fame VIP Warm Gold Spotlight
    const spotHof = engine.addEntity()
    Transform.create(spotHof, {
      position: Vector3.create(38.0, 7.5, 17.0),
      rotation: Quaternion.fromEulerDegrees(70, 0, 0)
    })
    LightSource.create(spotHof, {
      type: LightSource.Type.Spot({ innerAngle: 30, outerAngle: 55 }),
      color: Color3.create(1.0, 0.98, 0.95),
      intensity: 2500,
      shadow: false
    })

    // Full-height collision volumes close every approach, including double jumps.
    const block = (x: number, z: number, w: number, d: number) => {
      const e = engine.addEntity()
      Transform.create(e, { position: { x, y: 5, z }, scale: { x: w, y: 10, z: d } })
      MeshCollider.setBox(e)
    }
    block(12, 14, 6.2, 14.4)
    block(12, 26.4, 23.6, 10.8)
    block(3.5, 12, 3.4, 3.4)
    block(20.5, 12, 3.4, 3.4)
    block(38, 18, 3.8, 3.8)

    // Gallery seating, wall panels and planters: detail without particles or neon.
    for (const z of [5, 24, 28]) {
      box(43, 0.5, z, 5, 0.8, 1.2, '#C2B8AA', undefined, true)
      box(46.8, 4, z, 0.18, 3, 2.6, '#B3A48C')
    }
    for (const z of [5, 18]) {
      for (const x of [2, 22]) {
        box(x, 0.45, z, 0.8, 0.8, 0.8, '#B8AEA0', undefined, true)
        box(x, 1.15, z, 1, 0.8, 1, '#61705C')
      }
    }
    const galleryFill = engine.addEntity()
    Transform.create(galleryFill, { position: { x: 39, y: 6, z: 15 } })
    LightSource.create(galleryFill, {
      type: LightSource.Type.Point({}),
      color: Color3.create(1, 0.98, 0.95),
      intensity: 4500,
      range: 20
    })

    this.privacyArea = engine.addEntity()
    // Keep NPC fitting rooms, backstage and gallery outside the player privacy volume.
    // Some mobile versions do not match arbitrary AvatarShape IDs in excludeIds.
    Transform.create(this.privacyArea, { position: { x: 12, y: 5, z: 12 } })

    // Local-only feedback: never sync these entities or expose another player's ballot.
    this.voteLight = engine.addEntity()
    Transform.create(this.voteLight, {
      position: { x: 12, y: 5, z: 14 },
      rotation: Quaternion.fromEulerDegrees(-90, 0, 0)
    })
    LightSource.create(this.voteLight, {
      type: LightSource.Type.Spot({ innerAngle: 18, outerAngle: 30 }),
      color: Color3.create(1, 1, 1),
      intensity: 0,
      range: 7,
      shadow: false
    })
    this.voteMarker = box(12, 0.42, 14, 0, 0, 0, IVORY)

    // ==========================================
    // 9. CONTESTANT FIGURES & FLOATING LABELS (BACKSTAGE ROW)
    // ==========================================
    for (let i = 0; i < 6; i++) {
      const x = 5.0 + i * 2.8
      // Initialize with privacy robe (neutral look)
      this.figures.push(new AvatarFigure(`contestant-${i}`, `Participante ${i + 1}`, x, 0.52, 26.5, 180, 1.0, true))
      this.names.push(label('', x, 3.2, 26.5, 0.7))
    }

    // ==========================================
    // 10. AUDIO SYSTEM (GLOBAL COUNTDOWN & CHIMES)
    // ==========================================
    this.audioMusic = engine.addEntity()
    AudioSource.create(this.audioMusic, {
      audioClipUrl: 'assets/Audio/lounge.wav', playing: true, loop: true, global: true, volume: 0
    })
    this.audioFeedback = engine.addEntity()
    AudioSource.create(this.audioFeedback, {
      audioClipUrl: 'assets/Audio/theme.wav', playing: false, loop: false, global: true, volume: 0.5
    })
  }

  private cue(clip: string, duration: number) {
    this.audioPending = { clip, duration, delay: 0.25 }
  }

  private tickAudio(dt: number) {
    this.audioHold = Math.max(0, this.audioHold - dt)
    const hidden = EngineInfo?.getOrNull(engine.RootEntity)?.sceneHidden ?? false
    const target = hidden || this.audioPending || this.audioHold > 0 ? 0 : 0.22
    const step = dt * (target === 0 ? 0.88 : 0.18)
    this.musicVolume += Math.sign(target - this.musicVolume) * Math.min(step, Math.abs(target - this.musicVolume))
    const music = AudioSource.get(this.audioMusic)
    if (Math.abs((music.volume || 0) - this.musicVolume) > 0.0001)
      AudioSource.getMutable(this.audioMusic).volume = this.musicVolume
    if (this.audioPending) {
      this.audioPending.delay -= dt
      if (this.audioPending.delay <= 0) {
        AudioSource.playSound(this.audioFeedback, this.audioPending.clip)
        this.audioHold = this.audioPending.duration
        this.audioPending = undefined
      }
    }
  }


  update(s: State, outfit: Outfit, pose: number, dt: number, owned: string[] = [], myPlayerId = '', previewAngle = 0) {
    this.time += dt
    const phaseKey = `${s.round}:${s.phase}:${s.duelIndex}`
    if (phaseKey !== this.lastFeedbackPhase) {
      this.lastFeedbackPhase = phaseKey
      if (s.phase !== 'LOBBY') this.cue('assets/Audio/transition.wav', 3)
    }
    const voteDuel = s.duels[s.duelIndex]
    const confirmedChoice = s.ballots[myPlayerId]
    const voteKey = `${s.round}:${s.duelIndex}:${myPlayerId}`
    if (s.phase === 'VOTING' && voteDuel && myPlayerId !== voteDuel.aId && myPlayerId !== voteDuel.bId &&
      (confirmedChoice === voteDuel.aId || confirmedChoice === voteDuel.bId) && this.lastVoteSound !== voteKey) {
      this.lastVoteSound = voteKey
      this.cue('assets/Audio/vote.wav', 0.4)
    }

    const privacy = ['THEME_REVEAL', 'PREPARATION'].includes(s.phase)
    const privacyKey = privacy ? 'on:' + myPlayerId : 'off'
    if (privacy && this.privacyKey !== privacyKey) {
      AvatarModifierArea.createOrReplace(this.privacyArea, {
        area: { x: 10, y: 10, z: 24 },
        modifiers: [AvatarModifierType.AMT_HIDE_AVATARS],
        excludeIds: [myPlayerId, 'preview-left', 'preview-right', 'champion-hof', ...this.figures.map((f) => f.id)]
      })
    } else if (!privacy && AvatarModifierArea.has(this.privacyArea)) AvatarModifierArea.deleteFrom(this.privacyArea)
    this.privacyKey = privacyKey

    // Dual fitting room mannequins mirror the local player's outfit
    this.previewLeft.dress(outfit)
    for (const preview of [this.previewLeft, this.previewRight]) {
      const desired = (preview.id === 'preview-left' ? 135 : 225) + previewAngle
      if (preview.rotY !== desired) {
        preview.rotY = desired
        Transform.getMutable(preview.root).rotation = Quaternion.fromEulerDegrees(0, desired, 0)
      }
    }
    this.previewLeft.effect(hasSparkles(outfit, owned), this.time)
    this.previewLeft.pose(pose, this.time)

    this.previewRight.dress(outfit)
    this.previewRight.effect(hasSparkles(outfit, owned), this.time)
    this.previewRight.pose(pose, this.time)

    // Update 3D in-world digital countdown timers
    const remainingSec = Math.max(0, Math.ceil(s.remaining))
    const clockString = `TEMPO: ${remainingSec}s`
    TextShape.getMutable(this.clockLeft).text = clockString
    TextShape.getMutable(this.clockRight).text = clockString

    this.tickAudio(dt)

    // Theme banner text on backstage wall
    TextShape.getMutable(this.themeBanner).text =
      s.phase === 'LOBBY' ? 'PREPARE SEU MELHOR LOOK' : THEMES[s.theme].title.toUpperCase()

    const duel = s.duels && s.duels[s.duelIndex]
    const isDuelActive = (s.phase === 'RUNWAY' || s.phase === 'VOTING' || s.phase === 'DUEL_RESULT') && !!duel
    const choice = s.ballots[myPlayerId]
    const showVote =
      !!duel &&
      (s.phase === 'VOTING' || s.phase === 'DUEL_RESULT') &&
      (choice === duel.aId || choice === duel.bId) &&
      myPlayerId !== duel.aId &&
      myPlayerId !== duel.bId
    const voteX = choice === duel?.aId ? 10.9 : 13.1
    LightSource.getMutable(this.voteLight).intensity = showVote ? 900 : 0
    Transform.getMutable(this.voteLight).position.x = voteX
    const marker = Transform.getMutable(this.voteMarker)
    marker.position.x = voteX
    marker.scale = showVote ? { x: 1.35, y: 0.025, z: 1.35 } : { x: 0, y: 0, z: 0 }

    this.figures.forEach((f, i) => {
      const c = s.cast[i]
      f.visible(!!c)

      if (!c) {
        f.back(0)
        TextShape.getMutable(this.names[i]).text = ''
        return
      }

      f.name = c.name

      // NEUTRALITY RULE:
      // Before duels (LOBBY, THEME_REVEAL, PREPARATION), ALL models are in neutral privacy robe.
      // Each pair reveals after its intro; future pairs remain neutral backstage.
      // In RESULTS, the podium winners are revealed.
      const shouldRobe = !outfitRevealed(s, c.id)

      f.dress(c.outfit, c.id, shouldRobe)
      f.effect(!shouldRobe && hasSparkles(c.outfit, s.accounts[c.id]?.owned || []), this.time)
      const onStage = isDuelActive && (c.id === duel?.aId || c.id === duel?.bId)
      const turn = onStage && s.phase === 'RUNWAY' && s.remaining <= CONFIG.duelPose
        ? 180 + (CONFIG.duelPose - s.remaining) / CONFIG.duelPose * 360 : 180
      if (f.rotY !== turn) {
        f.rotY = turn
        Transform.getMutable(f.root).rotation = Quaternion.fromEulerDegrees(0, turn, 0)
      }
      f.pose(!shouldRobe && onStage && s.phase !== 'DUEL_RESULT' ? c.pose : -1, this.time)

      // Positioning: 1v1 duel stage placement vs backstage VIP waiting row
      let posX = 5.0 + i * 2.8
      let posY = 0.52
      let posZ = 26.5
      let labelText = `${i + 1}. ${c.name}`

      if (isDuelActive && duel) {
        if (c.id === duel.aId) {
          posX = 10.9
          posY = 0.39
          posZ = 14.0
          labelText = `[A] ${c.name}`
        } else if (c.id === duel.bId) {
          posX = 13.1
          posY = 0.39
          posZ = 14.0
          labelText = `[B] ${c.name}`
        }
      } else if (s.phase === 'RESULTS' && s.results.length > 0) {
        if (s.results[0]?.id === c.id) {
          posX = 12.0
          posY = 0.39
          posZ = 11.0
          labelText = `👑 1º ${c.name}`
        } else if (s.results[1]?.id === c.id) {
          posX = 10.2
          posY = 0.39
          posZ = 14.0
          labelText = `2º ${c.name}`
        } else if (s.results[2]?.id === c.id) {
          posX = 13.8
          posY = 0.39
          posZ = 14.0
          labelText = `3º ${c.name}`
        }
      }

      if (s.accounts[c.id]?.owned.includes('icon')) {
        labelText += ' ★'
      }

      TextShape.getMutable(this.names[i]).text = labelText
      Transform.getMutable(this.names[i]).position = { x: posX, y: posY + 2.7, z: posZ }
      f.place(posX, posY, posZ)
    })

    const w = s.hall[0]
    if (!w) this.champion.back(0)
    this.champion.visible(!!w)
    if (w) {
      const championKey = `${w.timestamp}:${w.winner}:${w.theme}`
      if (championKey !== this.lastChampion) {
        this.lastChampion = championKey
        this.champion.lastPose = -1
      }
      this.champion.name = w.name
      this.champion.dress(w.outfit, w.winner, false)
      this.champion.pose(w.pose ?? 5, this.time)
      this.champion.effect(hasSparkles(w.outfit, w.cosmetics || []), this.time)
      TextShape.getMutable(this.hallSign).text = `HALL OF FAME\n${w.name}\n${w.theme}\n${w.votes} votos`
    }
  }
}
