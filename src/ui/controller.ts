import { movePlayerTo, triggerEmote } from '~system/RestrictedActions'
import { FashionNetwork } from '../network'
import { UiTab } from './types'
import { POSE_TO_EMOTE } from '../avatar-factory'
import { Outfit } from '../data'

const copyLook = (outfit: Outfit): Outfit => ({ ...outfit,
  ...(outfit.customWearables ? { customWearables: [...outfit.customWearables] } : {}) })

export class UiController {
  tab: UiTab = 'game'
  rankingPeriod: import('../rankings').RankingPeriod = 'all'
  message = ''
  category = 0 // Superior
  lastPhase = ''
  lastRound = -1
  wardrobeOpen = false
  locationsOpen = false
  previewAngle = 0
  wardrobePage = 0
  wardrobeFilter = ''
  lockedRound = -1
  savedLook?: Outfit

  saveLook(outfit: Outfit) {
    this.savedLook = copyLook(outfit)
    this.wardrobeOpen = false
    this.message = 'Look salvo'
  }

  restoreLook(n: FashionNetwork) {
    if (!this.savedLook || n.state.phase !== 'PREPARATION' || n.state.remaining <= 1) return
    // A restored native snapshot must not be overwritten by live Backpack polling.
    n.nativeWardrobe = false
    n.update({ outfit: copyLook(this.savedLook), round: n.state.round, ready: false })
    this.message = 'Look restaurado'
  }

  /** System-driven update: resets transient phase state without triggering network actions or UI renders. */
  tick(n: FashionNetwork) {
    const s = n.state
    if (this.lastPhase !== s.phase || this.lastRound !== s.round) {
      this.lastPhase = s.phase
      this.lastRound = s.round
      this.message = ''
      this.tab = 'game'
      this.wardrobeOpen = false
      this.locationsOpen = false
    }
    if (s.phase === 'PREPARATION' && s.remaining <= 1 && this.lockedRound !== s.round) {
      this.lockedRound = s.round
      this.wardrobeOpen = false
      n.update({ ready: true, round: s.round })
    }
  }

  setTab(tab: UiTab) {
    this.tab = tab
  }

  setMessage(msg: string) {
    this.message = msg
  }

  prevCategory() {
    this.category = (this.category + 8) % 9
  }

  nextCategory() {
    this.category = (this.category + 1) % 9
  }

  setPose(i: number, n: FashionNetwork) {
    if (!Number.isInteger(i) || i < 0 || i >= POSE_TO_EMOTE.length) return
    n.update({ pose: i, round: n.state.round })
    this.message = 'Pose ativada!'
    const emoteName = POSE_TO_EMOTE[i]
    void triggerEmote({
      predefinedEmote: emoteName
    }).catch((err) => {
      console.error('[FashionBattle] triggerEmote failed:', err)
      this.message = 'Pose aplicada ao modelo do palco'
    })
  }

  teleport(
    newRelativePosition: { x: number; y: number; z: number },
    cameraTarget: { x: number; y: number; z: number },
    label: string
  ) {
    this.locationsOpen = false
    void movePlayerTo({
      newRelativePosition,
      cameraTarget
    }).catch((err) => {
      console.error(`[FashionBattle] movePlayerTo (${label}) failed:`, err)
      this.message = 'Câmera/teleporte indisponível'
    })
  }
}

export const uiController = new UiController()
