import ReactEcs from '@dcl/sdk/react-ecs'
import { UiEntity } from '../primitives'
import { TextLabel, ActionButton } from '../components'
import { THEME_COLORS, UI_DIMENSIONS } from '../theme'
import { State } from '../../model'
import { ranking } from '../../rankings'
import { UiController } from '../controller'

export function RankView(props: { state: State; controller: UiController }) {
  const { state: s, controller } = props
  const ranked = ranking(s.accounts, controller.rankingPeriod, Date.now()).slice(0, 5)

  return (
    <UiEntity uiTransform={{ width: '100%', height: '100%', flexDirection: 'column' }}>
      <UiEntity uiTransform={{ width: '100%', height: 52, flexDirection: 'row', justifyContent: 'center' }}>
        {(['day', 'week', 'all'] as const).map((period, i) => (
          <ActionButton key={period} value={['HOJE', 'SEMANA', 'SESSÃO'][i]} width={Math.min(100, (UI_DIMENSIONS.modalWidth - 50) / 3)}
            fontSize={12}
            active={controller.rankingPeriod === period} action={() => { controller.rankingPeriod = period }} />
        ))}
      </UiEntity>
      <UiEntity uiTransform={{ width: '100%', height: 220, flexDirection: 'column' }}>
        {ranked.length === 0 ? (
          <TextLabel
            value="Nenhuma pontuação registrada ainda."
            height={60}
            fontSize={18}
            color={THEME_COLORS.disabledText}
          />
        ) : (
          ranked.map((acc, i) => {
            const id = acc.id
            const displayName =
              acc.name || s.cast.find((c) => c.id === id)?.name ||
              s.hall.find((w) => w.winner === id)?.name ||
              (id.startsWith('bot:') ? id.replace('bot:', 'Bot ') : id.slice(0, 10))

            return (
              <TextLabel
                key={id}
                value={`${i + 1}. ${displayName}\n${acc.wins}V · ${acc.votes} votos · ${acc.participations} jogos · ${acc.winRate}%`}
                height={42}
                fontSize={14}
                color={i === 0 ? THEME_COLORS.gold : THEME_COLORS.cream}
              />
            )
          })
        )}
      </UiEntity>

    </UiEntity>
  )
}
