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
      {props.thumbnail ? <UiEntity uiTransform={{ width: 36, height: 40, flexShrink: 0, pointerFilter: 'none' }}
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
  const narrow = UI_DIMENSIONS.headerPillWidth < 360

  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { top: 14, left: '50%' },
        margin: { left: -UI_DIMENSIONS.headerPillWidth / 2 },
        width: UI_DIMENSIONS.headerPillWidth,
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
      <TextLabel value={`${stylePoints} SP`} width={100} height="100%" fontSize={15} color={THEME_COLORS.mint} />
      <ActionButton
        value={activeTab === 'shop' ? 'FECHAR' : 'LOJA'}
        action={() => controller.setTab(activeTab === 'shop' ? 'game' : 'shop')}
        width={74}
        height={32}
        fontSize={13}
        active={activeTab === 'shop'}
      />
      <ActionButton
        value={activeTab === 'rank' ? 'FECHAR' : 'RANK'}
        action={() => controller.setTab(activeTab === 'rank' ? 'game' : 'rank')}
        width={74}
        height={32}
        fontSize={13}
        active={activeTab === 'rank'}
      />
    </UiEntity>
  )
}

export function CameraShortcuts(props: { controller: UiController; bottom?: number }) {
  const { controller: ctrl, bottom = 24 } = props
  const locations = [
    { name: 'PROVADOR OESTE', position: { x: 5.8, y: 0.35, z: 10 }, target: { x: 3.5, y: 1.4, z: 12 } },
    { name: 'PROVADOR LESTE', position: { x: 18.2, y: 0.35, z: 10 }, target: { x: 20.5, y: 1.4, z: 12 } },
    { name: 'PALCO', position: { x: 12, y: 0.35, z: 5.5 }, target: { x: 12, y: 1.4, z: 14 } },
    { name: 'HALL OF FAME', position: { x: 34.5, y: 0.35, z: 15 }, target: { x: 38, y: 1.4, z: 18 } }
  ]
  return (
    <UiEntity uiTransform={{ positionType: 'absolute', position: { left: '50%', bottom },
      margin: { left: -140 }, width: 280, flexDirection: 'column', alignItems: 'center' }}>
      {ctrl.locationsOpen ? <UiEntity uiTransform={{ width: 280, height: 104,
        flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
        {locations.map((location) => <ActionButton key={location.name} value={location.name}
          width={128} height={44} fontSize={12}
          action={() => ctrl.teleport(location.position, location.target, location.name)} />)}
      </UiEntity> : null}
      <ActionButton value={ctrl.locationsOpen ? 'FECHAR LOCAIS' : 'LOCAIS'} width={136} height={44}
        fontSize={13} action={() => { ctrl.locationsOpen = !ctrl.locationsOpen }} />
    </UiEntity>
  )
}
