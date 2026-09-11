import ReactEcs from '@dcl/sdk/react-ecs'
import { UiEntity, Label } from '../primitives'
import { THEME_COLORS, panelWidth } from '../theme'
import { State } from '../../model'
import { THEMES } from '../../data'

export function LobbyView(props: { state: State; isConnecting: boolean }) {
  const { state: s, isConnecting } = props

  if (isConnecting) {
    return (
      <UiEntity
        uiTransform={{
          positionType: 'absolute',
          position: { bottom: 32, left: '50%' },
          margin: { left: -160 },
          width: 320,
          height: 44,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: THEME_COLORS.glassBorder
        }}
        uiBackground={{ color: THEME_COLORS.glassBg }}
      >
        <Label
          value="Connecting to the show..."
          fontSize={15}
          color={THEME_COLORS.cream}
          textAlign="middle-center"
          uiTransform={{ width: '100%', height: '100%', pointerFilter: 'none' }}
        />
      </UiEntity>
    )
  }

  return null
}
