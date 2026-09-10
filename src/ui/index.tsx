import ReactEcs from '@dcl/sdk/react-ecs'
import { UiEntity, Label } from './primitives'
import { FashionNetwork } from '../network'
import { THEME_COLORS, UI_DIMENSIONS, panelWidth } from './theme'
import { UiController, uiController } from './controller'
import { HeaderPill, TopRightBadge, ActionButton } from './components'
import { LobbyView } from './views/lobby'
import { PreparationView } from './views/preparation'
import { RunwayView } from './views/runway'
import { VotingView } from './views/voting'
import { ResultsView } from './views/results'
import { ShopView } from './views/shop'
import { RankView } from './views/rank'

export { uiController, UiController }

function ModalContainer(props: { title: string; onClose: () => void; children?: any }) {
  const { title, onClose, children } = props
  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { top: '50%', left: '50%' },
        margin: { top: -UI_DIMENSIONS.modalHeight / 2, left: -UI_DIMENSIONS.modalWidth / 2 },
        width: UI_DIMENSIONS.modalWidth,
        height: UI_DIMENSIONS.modalHeight,
        flexDirection: 'column',
        padding: 12,
        borderWidth: 1,
        borderColor: THEME_COLORS.glassBorder
      }}
      uiBackground={{ color: THEME_COLORS.overlayBg }}
    >
      {/* Modal Header */}
      <UiEntity
        uiTransform={{
          width: '100%',
          height: 38,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: { bottom: 8 }
        }}
      >
        <Label
          value={title}
          fontSize={18}
          color={THEME_COLORS.gold}
          textAlign="middle-left"
          uiTransform={{ width: UI_DIMENSIONS.modalWidth - 88, height: 44, pointerFilter: 'none' }}
        />
        <ActionButton
          value="X"
          action={onClose}
          width={44}
          height={44}
          fontSize={16}
          borderColor={THEME_COLORS.disabledBorder}
        />
      </UiEntity>

      {/* Modal Content */}
      <UiEntity
        uiTransform={{
          width: '100%',
          height: UI_DIMENSIONS.modalHeight - 64,
          flexDirection: 'column'
        }}
      >
        {children}
      </UiEntity>
    </UiEntity>
  )
}

export function renderUi(n: FashionNetwork, controller: UiController = uiController) {
  const s = n.state
  const m = n.mine
  const account = m ? s.accounts[m.playerId] : undefined
  const stylePoints = account?.points || 0
  const activeTab = controller.tab

  return (
    <UiEntity
      uiTransform={{
        width: '100%',
        height: '100%',
        pointerFilter: 'none'
      }}
    >
      {/* 1. Minimalist Top Center Pill Bar */}
      <HeaderPill state={s} memberCount={n.members.length} />
      {s.phase === 'PREPARATION' && activeTab === 'game' ?
        <UiEntity uiTransform={{ positionType: 'absolute', position: { top: 120, right: 4 } }}>
          <ActionButton value="GIRAR LOOK" width={100} height={44} fontSize={12}
            action={() => { controller.previewAngle = (controller.previewAngle + 45) % 360 }} />
        </UiEntity> : null}

      {/* 2. Minimalist Top Right Balance Badge & Quick Menu */}
      {['LOBBY', 'RESULTS', 'RETURN_TO_LOBBY'].includes(s.phase) ? (
        <TopRightBadge stylePoints={stylePoints} activeTab={activeTab} controller={controller} />
      ) : null}

      {/* 4. Active Contextual Action Views or Modals */}
      {activeTab === 'shop' ? (
        <ModalContainer title="LOJA DE ESTILO" onClose={() => controller.setTab('game')}>
          <ShopView state={s} network={n} mine={m} controller={controller} />
        </ModalContainer>
      ) : activeTab === 'rank' ? (
        <ModalContainer title="RANKING DA SESSÃO" onClose={() => controller.setTab('game')}>
          <RankView state={s} controller={controller} />
        </ModalContainer>
      ) : s.phase === 'PREPARATION' ? (
        <PreparationView state={s} network={n} mine={m} controller={controller} />
      ) : s.phase === 'RUNWAY' ? (
        <RunwayView state={s} network={n} mine={m} controller={controller} />
      ) : s.phase === 'VOTING' ? (
        <VotingView state={s} network={n} mine={m} controller={controller} />
      ) : s.phase === 'DUEL_RESULT' ? (
        <UiEntity
          uiTransform={{
            positionType: 'absolute',
            position: { bottom: 32, left: '50%' },
            margin: { left: -panelWidth(360) / 2 },
            width: panelWidth(360),
            height: 64
          }}
          uiBackground={{ color: THEME_COLORS.glassBg }}
        >
          <Label
            value={
              (s.cast.find((c) => c.id === s.duels[s.duelIndex]?.winnerId)?.name || '') +
              ' venceu  /  ' +
              s.duels[s.duelIndex]?.votesA +
              ' : ' +
              s.duels[s.duelIndex]?.votesB
            }
            fontSize={panelWidth(360) < 300 ? 14 : 18}
            uiTransform={{ width: '100%', height: 64 }}
          />
        </UiEntity>
      ) : s.phase === 'RESULTS' ? (
        <ResultsView state={s} mine={m} />
      ) : (
        <LobbyView state={s} isConnecting={!n.ready} />
      )}
    </UiEntity>
  )
}
