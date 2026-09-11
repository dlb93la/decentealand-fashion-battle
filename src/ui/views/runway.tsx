import ReactEcs from '@dcl/sdk/react-ecs'
import { UiEntity, Label } from '../primitives'
import { ActionButton } from '../components'
import { THEME_COLORS, panelWidth } from '../theme'
import { UiController } from '../controller'
import { FashionNetwork } from '../../network'
import { POSES, CONFIG } from '../../data'
import { State, Member } from '../../model'

export function RunwayView(props: { state: State; network: FashionNetwork; mine?: Member; controller: UiController }) {
  const { state: s, network: n, mine: m, controller: ctrl } = props
  const duel = s.duels && s.duels[s.duelIndex]
  const candA = s.cast.find((c) => c.id === duel?.aId)
  const candB = s.cast.find((c) => c.id === duel?.bId)
  const isMeInDuel = m && (m.playerId === duel?.aId || m.playerId === duel?.bId)
  const intro = s.remaining > CONFIG.duelPose
  const poseOptions = [
    ...POSES.map((name, id) => ({ name, id })),
    ...(s.accounts[m?.playerId || '']?.owned.includes('superstar') ? [{ name: 'Superstar', id: 8 }] : []),
    ...(s.accounts[m?.playerId || '']?.owned.includes('royal') ? [{ name: 'Royal', id: 9 }] : [])
  ]
  const currentPose = m?.pose || 0
  const width = panelWidth(360)
  const columns = width < 300 ? 2 : 3
  const poseGridHeight = Math.ceil(poseOptions.length / columns) * 52

  if (intro)
    return (
      <UiEntity
        uiTransform={{
          positionType: 'absolute',
          position: { bottom: 100, left: '50%' },
          margin: { left: -60 },
          width: 120,
          height: 70
        }}
      >
        <Label
          value={String(Math.ceil(s.remaining - CONFIG.duelPose))}
          fontSize={40}
          uiTransform={{ width: 120, height: 70 }}
        />
      </UiEntity>
    )
  // World labels identify both contestants for spectators.
  if (!isMeInDuel) return <UiEntity />

  // Active duelist view: floating pose selector
  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { bottom: 88, left: '50%' },
        margin: { left: -width / 2 },
        width,
        height: poseGridHeight + 38,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 6,
        borderWidth: 1,
        borderColor: THEME_COLORS.glassBorder
      }}
      uiBackground={{ color: THEME_COLORS.glassBg }}
    >
      <Label
        value="POSE"
        fontSize={13}
        color={THEME_COLORS.mint}
        textAlign="middle-center"
        uiTransform={{ width: '100%', height: 20, pointerFilter: 'none' }}
      />
      <UiEntity
        uiTransform={{
          width: '100%',
          height: poseGridHeight,
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {poseOptions.map(({ name, id }) => (
          <ActionButton
            key={id}
            value={name}
            action={() => {
              ctrl.setPose(id, n)
              ctrl.setMessage(`Pose: ${name}`)
            }}
            width={(width - 14) / columns - 8}
            height={44}
            fontSize={12}
            active={currentPose === id}
          />
        ))}
      </UiEntity>
    </UiEntity>
  )
}
