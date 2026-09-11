import ReactEcs from '@dcl/sdk/react-ecs'
import { UiEntity, Label } from '../primitives'
import { THEME_COLORS, panelWidth } from '../theme'
import { State, Member } from '../../model'

export function ResultsView({ state: s, mine: m }: { state: State; mine?: Member }) {
  const myResult = s.results.find((r) => r.id === m?.playerId)
  const width = panelWidth(380)
  const narrow = width < 340
  const rowHeight = 54
  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { bottom: 24, left: '50%' },
        margin: { left: -width / 2 },
        width,
        height: rowHeight * Math.min(3, s.results.length) + 58,
        flexDirection: 'column',
        padding: 10
      }}
      uiBackground={{ color: THEME_COLORS.glassBg }}
    >
      {s.results.slice(0, 3).map((r, i) => (
        <Label
          key={r.id}
          value={`${i + 1}. ${r.name.slice(0, narrow ? 18 : 24)}\n${r.votes} votos / ${r.duelWins ?? 0}V / +${r.points} SP`}
          color={i === 0 ? THEME_COLORS.gold : THEME_COLORS.cream}
          fontSize={16}
          uiTransform={{ width: '100%', height: rowHeight, flexShrink: 0 }}
        />
      ))}
      <Label
        value={'+' + (myResult?.points || 0) + ' SP'}
        color={THEME_COLORS.mint}
        fontSize={20}
        uiTransform={{ width: '100%', height: 30 }}
      />
    </UiEntity>
  )
}
