import { Color4 } from '@dcl/sdk/math'
import { engine, UiCanvasInformation } from '@dcl/sdk/ecs'

export const THEME_COLORS = {
  ink: Color4.fromHexString('#47203D'),
  cream: Color4.fromHexString('#FFF7EC'),
  pink: Color4.fromHexString('#FF8B9E'),
  mint: Color4.fromHexString('#ACEDB7'),
  activeBg: Color4.fromHexString('#24754C'),
  disabledText: Color4.fromHexString('#D0A6B7'),
  disabledBorder: Color4.fromHexString('#946079'),
  overlayBg: Color4.fromHexString('#47203DF5'),
  pendingYellow: Color4.fromHexString('#FFD166'),
  gold: Color4.fromHexString('#FFD676'),
  cyan: Color4.fromHexString('#B9FFE6'),
  glassBg: Color4.fromHexString('#47203DF2'),
  glassBorder: Color4.fromHexString('#EA8299')
}

/** Match index.ts's interactable inset before choosing physical-pixel widths. */
export function panelWidth(preferred: number) {
  const canvas = UiCanvasInformation.getOrNull(engine.RootEntity)
  const inset = canvas?.interactableArea
  const available = (canvas?.width || 1920) - (inset?.left || 0) - (inset?.right || 0)
  return Math.min(preferred, Math.max(0, available - 24))
}

export const UI_DIMENSIONS = {
  get headerPillWidth() {
    return panelWidth(Math.min(620, Math.max(340, (UiCanvasInformation.getOrNull(engine.RootEntity)?.width || 1920) - 344)))
  },
  headerPillHeight: 44,
  get modalWidth() { return panelWidth(440) },
  get modalHeight() {
    return Math.min(480, Math.max(300, (UiCanvasInformation.getOrNull(engine.RootEntity)?.height || 1080) - 60))
  },
  buttonHeightStandard: 48,
  buttonHeightCompact: 40
}

/** Left-hand fitting panel in physical pixels; right half remains available for the avatar. */
export function wardrobeLayout() {
  const c = UiCanvasInformation.getOrNull(engine.RootEntity)
  const inset = c?.interactableArea
  const w = (c?.width || 1280) - (inset?.left || 0) - (inset?.right || 0)
  const h = (c?.height || 720) - (inset?.top || 0) - (inset?.bottom || 0)
  const width = Math.min(600, Math.max(280, w * 0.49 - 24))
  const available = Math.max(132, h - 196)
  const rowHeight = 52
  const itemHeight = available < 450 ? 76 : 96
  const pageSize = available >= 5 * rowHeight + 2 * (itemHeight + 12) + 24 ? 4 : 2
  const height = Math.min(available, 5 * rowHeight + Math.ceil(pageSize / 2) * (itemHeight + 12) + 24)
  return { width, height, rowHeight, itemHeight, pageSize }
}
