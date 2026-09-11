import { Color4 } from '@dcl/sdk/math'
import { engine, UiCanvasInformation } from '@dcl/sdk/ecs'

export const THEME_COLORS = {
  ink: Color4.fromHexString('#202336'),
  cream: Color4.fromHexString('#F3EFE8'),
  pink: Color4.fromHexString('#C6BCA9'),
  mint: Color4.fromHexString('#B4CCB9'),
  activeBg: Color4.fromHexString('#365D56'),
  disabledText: Color4.fromHexString('#85858C'),
  disabledBorder: Color4.fromHexString('#2D3246'),
  overlayBg: Color4.fromHexString('#0D101CEE'),
  pendingYellow: Color4.fromHexString('#FFD166'),
  gold: Color4.fromHexString('#D9D0BF'),
  cyan: Color4.fromHexString('#E4E8E6'),
  glassBg: Color4.fromHexString('#0B0D1AEE'),
  glassBorder: Color4.fromHexString('#262D45')
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

/** Compact selectors reserve touch-sized controls before choosing the item grid. */
export function wardrobeLayout() {
  const c = UiCanvasInformation.getOrNull(engine.RootEntity)
  const inset = c?.interactableArea
  const w = (c?.width || 1280) - (inset?.left || 0) - (inset?.right || 0)
  const h = (c?.height || 720) - (inset?.top || 0) - (inset?.bottom || 0)
  const width = Math.min(Math.max(0, w - 24), 600, Math.max(280, w * 0.49 - 24))
  const available = h - 24
  const rowHeight = available < 390 ? 44 : 52
  const itemHeight = available < 390 ? 62 : 86
  const columns = width < 400 ? 1 : 2
  const rows = available >= 4 * rowHeight + 2 * (itemHeight + 8) + 16 ? 2 : 1
  const pageSize = rows * columns
  const height = 4 * rowHeight + rows * (itemHeight + 8) + 16
  return { width, height, rowHeight, itemHeight, pageSize, columns }
}
