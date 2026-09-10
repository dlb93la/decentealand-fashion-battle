import ReactEcs from '@dcl/sdk/react-ecs'
import { UiEntity, Label } from '../primitives'
import { ActionButton } from '../components'
import { THEME_COLORS, panelWidth } from '../theme'
import { UiController } from '../controller'
import { FashionNetwork } from '../../network'
import { State, Member, pendingVote as getPendingVote } from '../../model'

export function VotingView(props: { state: State; network: FashionNetwork; mine?: Member; controller: UiController }) {
  const { state: s, network: n, mine: m, controller: ctrl } = props
  const myId = m?.playerId || ''
  const width = panelWidth(340)
  const duel = s.duels && s.duels[s.duelIndex]
  const candA = s.cast.find((c) => c.id === duel?.aId)
  const candB = s.cast.find((c) => c.id === duel?.bId)

  const confirmedVote = s.ballots[myId]
  const pendingVote = getPendingVote(s, m)
  const isVoter = s.voters.includes(myId)
  const isMeInThisDuel = myId === duel?.aId || myId === duel?.bId

  let statusText = ''
  if (isMeInThisDuel) {
    statusText = 'Sua vez no palco'
  } else if (confirmedVote) {
    const candidateName = s.cast.find((c) => c.id === confirmedVote)?.name || confirmedVote
    statusText = `✓ Voto registrado: ${candidateName}`
  } else if (pendingVote) {
    statusText = `⏳ Confirmando voto...`
  }

  const hasVotedAny = !!confirmedVote || !!pendingVote
  const canVoteA = !isMeInThisDuel && !hasVotedAny && isVoter && !!candA
  const canVoteB = !isMeInThisDuel && !hasVotedAny && isVoter && !!candB

  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { bottom: 32, left: '50%' },
        margin: { left: -width / 2 },
        width,
        height: 110,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        borderWidth: 1,
        borderColor: THEME_COLORS.glassBorder
      }}
      uiBackground={{ color: THEME_COLORS.glassBg }}
    >
      <Label
        value={statusText}
        fontSize={14}
        color={isMeInThisDuel ? THEME_COLORS.pendingYellow : THEME_COLORS.cream}
        textAlign="middle-center"
        uiTransform={{ width: '100%', height: 22, pointerFilter: 'none' }}
      />

      <UiEntity
        uiTransform={{
          width: '100%',
          height: 58,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {candA && !hasVotedAny && !isMeInThisDuel ? (
          <ActionButton
            value="VOTAR A"
            action={() => {
              if (canVoteA) {
                n.update({ vote: candA.id, round: s.round, voteDuel: s.duelIndex })
                ctrl.setMessage(`Voto em [A] ${candA.name} enviado!`)
              }
            }}
            width={(width - 36) / 2}
            height={46}
            fontSize={16}
            active={confirmedVote === candA.id}
            disabled={!canVoteA && confirmedVote !== candA.id}
            borderColor={confirmedVote === candA.id ? THEME_COLORS.mint : THEME_COLORS.cyan}
          />
        ) : null}

        {candB && !hasVotedAny && !isMeInThisDuel ? (
          <ActionButton
            value="VOTAR B"
            action={() => {
              if (canVoteB) {
                n.update({ vote: candB.id, round: s.round, voteDuel: s.duelIndex })
                ctrl.setMessage(`Voto em [B] ${candB.name} enviado!`)
              }
            }}
            width={(width - 36) / 2}
            height={46}
            fontSize={16}
            active={confirmedVote === candB.id}
            disabled={!canVoteB && confirmedVote !== candB.id}
            borderColor={confirmedVote === candB.id ? THEME_COLORS.mint : THEME_COLORS.pink}
          />
        ) : null}
      </UiEntity>
    </UiEntity>
  )
}
