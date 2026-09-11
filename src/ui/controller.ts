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
  category = 0 // Upper
  lastPhase = ''
  lastRound = -1
  wardrobeOpen = false
  locationsOpen = false
  previewAngle = 0
  wardrobePage = 0
  wardrobeFilter = ''
  lockedRound = -1
  savedLook?: Outfit
  lighting: 'day' | 'night' = 'day'
  watchStage = false
  private openedRound = -1

  openWardrobe(n: FashionNetwork) {
    if (n.state.phase !== 'PREPARATION' || n.state.remaining <= 1 ||
        !n.mine || !n.state.cast.some(c => c.id === n.mine?.playerId)) return
    if (this.openedRound !== n.state.round) {
      this.restoreLook(n)
      this.openedRound = n.state.round
    }
    this.wardrobeOpen = true
  }

  freeCamera() {
    this.watchStage = false
    this.wardrobeOpen = false
  }

  saveLook(outfit: Outfit) {
    this.savedLook = copyLook(outfit)
    this.wardrobeOpen = false
    this.message = 'Look saved for your next round'
  }

  restoreLook(n: FashionNetwork) {
    if (!this.savedLook || n.state.phase !== 'PREPARATION' || n.state.remaining <= 1) return
    // A restored native snapshot must not be overwritten by live Backpack polling.
    n.nativeWardrobe = false
    n.update({ outfit: copyLook(this.savedLook), round: n.state.round, ready: false })
    this.message = 'Saved look restored'
  }

  /** System-driven update: resets transient UI state and publishes preparation readiness once per phase. */
  tick(n: FashionNetwork) {
    const s = n.state
    if (this.lastPhase !== s.phase || this.lastRound !== s.round) {
      this.lastPhase = s.phase
      this.lastRound = s.round
      this.message = ''
      this.tab = 'game'
      this.wardrobeOpen = false
      this.locationsOpen = false
      if (s.phase === 'PREPARATION' && n.mine) n.update({ round: s.round, ready: false, vote: '' })
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
    this.message = 'Pose activated!'
    const emoteName = POSE_TO_EMOTE[i]
    void triggerEmote({
      predefinedEmote: emoteName
    }).catch((err) => {
      console.error('[FashionBattle] triggerEmote failed:', err)
      this.message = 'Pose applied to the stage model'
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
      this.message = 'Camera/teleport unavailable'
    })
  }
}

export const uiController = new UiController()
