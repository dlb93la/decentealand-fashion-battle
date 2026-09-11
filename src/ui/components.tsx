import ReactEcs from '@dcl/sdk/react-ecs'
import { UiEntity, Label } from './primitives'
import { Color4 } from '@dcl/sdk/math'
import { THEME_COLORS, UI_DIMENSIONS } from './theme'
import { UiController } from './controller'
import { localizePhase } from './types'
import { THEMES } from '../data'
import { State } from '../model'

export function TextLabel(props: {
  key?: string | number
  value: string
  height?: number | string
  fontSize?: number
  color?: Color4
  width?: number | string
  textAlign?: 'middle-center' | 'middle-left' | 'middle-right'
}) {
  const {
    value,
    height = 28,
    fontSize = 18,
    color = THEME_COLORS.cream,
    width = '100%',
    textAlign = 'middle-center'
  } = props
  return (
    <Label
      value={value}
      fontSize={fontSize}
      color={color}
      textAlign={textAlign}
      uiTransform={{
        width: width as any,
        height: height as any,
        flexShrink: 0,
        pointerFilter: 'none'
      }}
    />
  )
}

export function ActionButton(props: {
  key?: string | number
  value: string
  action: () => void
  width?: number | string
  height?: number
  fontSize?: number
  active?: boolean
  disabled?: boolean
  borderColor?: Color4
  textColor?: Color4
  thumbnail?: string
}) {
  const {
    value,
    action,
    width = '100%',
    height = UI_DIMENSIONS.buttonHeightStandard,
    fontSize = 17,
    active = false,
    disabled = false,
    borderColor,
    textColor
  } = props

  const border =
    borderColor || (disabled ? THEME_COLORS.disabledBorder : active ? THEME_COLORS.mint : THEME_COLORS.pink)
  const bg = active ? THEME_COLORS.activeBg : THEME_COLORS.glassBg
  const fontColor = textColor || (disabled ? THEME_COLORS.disabledText : THEME_COLORS.cream)

  return (
    <UiEntity
      uiTransform={{
        width: width as any,
        height: height as any,
        margin: 4,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        flexShrink: 0,
        borderWidth: 1,
        borderColor: border,
        pointerFilter: disabled ? 'none' : undefined
      }}
      uiBackground={{ color: bg }}
      onMouseDown={() => {
        if (!disabled) action()
      }}
    >
      {props.thumbnail ? <UiEntity uiTransform={{ width: Math.min(64, height - 8), height: Math.min(72, height - 8), flexShrink: 0, pointerFilter: 'none' }}
        uiBackground={{ textureMode: 'stretch', texture: { src: props.thumbnail } }} /> : null}
      <Label
        value={value}
        fontSize={fontSize}
        color={fontColor}
        textAlign="middle-center"
        uiTransform={{ width: props.thumbnail ? '60%' : '100%', height: '100%', pointerFilter: 'none' }}
      />
    </UiEntity>
  )
}

/** Sleek, minimalist top pill displaying Theme, Phase and Countdown Timer */
export function HeaderPill(props: { state: State; memberCount: number }) {
  const { state: s } = props
  const remainingSec = Math.max(0, Math.ceil(s.remaining))
  const minutes = Math.floor(remainingSec / 60)
    .toString()
    .padStart(2, '0')
  const seconds = (remainingSec % 60).toString().padStart(2, '0')
  const timer = `${minutes}:${seconds}`

  const themeTitle = s.phase === 'LOBBY' ? 'FASHION BATTLE' : THEMES[s.theme].title.toUpperCase()
  const localizedPhase = localizePhase(s.phase)
  const dressing = s.phase === 'PREPARATION'
  const pillWidth = dressing ? Math.min(330, UI_DIMENSIONS.headerPillWidth * 0.7) : UI_DIMENSIONS.headerPillWidth
  const narrow = dressing || pillWidth < 360

  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: dressing ? { top: 14, right: 12 } : { top: 14, left: '50%' },
        margin: dressing ? {} : { left: -pillWidth / 2 },
        width: pillWidth,
        height: narrow ? 78 : UI_DIMENSIONS.headerPillHeight,
        flexDirection: narrow ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: { left: 16, right: 16 },
        borderWidth: 1,
        borderColor: THEME_COLORS.glassBorder,
        pointerFilter: 'none'
      }}
      uiBackground={{ color: THEME_COLORS.glassBg }}
    >
      <TextLabel
        value={themeTitle}
        width={narrow ? '100%' : '45%'}
        height={narrow ? 40 : '100%'}
        fontSize={narrow ? 14 : 16}
        color={THEME_COLORS.gold}
        textAlign="middle-left"
      />
      <TextLabel
        value={narrow ? `${localizedPhase.toUpperCase()}  ${timer}` : localizedPhase.toUpperCase()}
        width={narrow ? '100%' : '30%'}
        height={narrow ? 28 : '100%'}
        fontSize={narrow ? 12 : 15}
        color={THEME_COLORS.cream}
        textAlign="middle-center"
      />
      {!narrow ? <TextLabel
        value={timer}
        width="25%"
        height="100%"
        fontSize={17}
        color={THEME_COLORS.cyan}
        textAlign="middle-right"
      /> : null}
    </UiEntity>
  )
}

/** Minimal top-right SP balance badge & quick action toggles */
export function TopRightBadge(props: { stylePoints: number; activeTab: string; controller: UiController }) {
  const { stylePoints, activeTab, controller } = props

  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { top: UI_DIMENSIONS.headerPillWidth < 360 ? 104 : 72, right: 18 },
        height: UI_DIMENSIONS.headerPillHeight,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: THEME_COLORS.glassBorder,
        padding: { left: 12, right: 6 }
      }}
      uiBackground={{ color: THEME_COLORS.glassBg }}
    >
      {/* Balance overlay hidden during the world-information playtest. */}
      <ActionButton
        value={activeTab === 'shop' ? 'CLOSE' : 'SHOP'}
        action={() => controller.setTab(activeTab === 'shop' ? 'game' : 'shop')}
        width={74}
        height={32}
        fontSize={13}
        active={activeTab === 'shop'}
      />
      <ActionButton
        value={activeTab === 'rank' ? 'CLOSE' : 'RANK'}
        action={() => controller.setTab(activeTab === 'rank' ? 'game' : 'rank')}
        width={74}
        height={32}
        fontSize={13}
        active={activeTab === 'rank'}
      />
    </UiEntity>
  )
}
