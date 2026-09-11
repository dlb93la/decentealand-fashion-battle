import ReactEcs from '@dcl/sdk/react-ecs'
import { UiEntity, Label } from '../primitives'
import { THEME_COLORS, panelWidth } from '../theme'
import { State, Member } from '../../model'

export function ResultsView({ state: s, mine: m }: { state: State; mine?: Member }) {
  const myResult = s.results.find((r) => r.id === m?.playerId)
  const width = panelWidth(380)
  const narrow = width < 340
  const rowHeight = narrow ? 50 : 30
  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { bottom: 88, left: '50%' },
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
          value={i + 1 + '. ' + r.name.slice(0, 24) + (narrow ? '\n' : ' / ') + r.votes + ' votes / ' + r.duelWins + 'V'}
          color={i === 0 ? THEME_COLORS.gold : THEME_COLORS.cream}
          fontSize={narrow ? 14 : 16}
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
