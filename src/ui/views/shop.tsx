import ReactEcs from '@dcl/sdk/react-ecs'
import { UiEntity } from '../primitives'
import { TextLabel, ActionButton } from '../components'
import { THEME_COLORS } from '../theme'
import { UiController } from '../controller'
import { FashionNetwork } from '../../network'
import { SHOP } from '../../data'
import { State, Member } from '../../model'

export function ShopView(props: { state: State; network: FashionNetwork; mine?: Member; controller: UiController }) {
  const { state: s, network: n, mine: m, controller: ctrl } = props
  const account = m ? s.accounts[m.playerId] : undefined
  const owned = account?.owned || []
  const points = account?.points || 0

  return (
    <UiEntity uiTransform={{ width: '100%', height: '100%', flexDirection: 'column' }}>

      <UiEntity uiTransform={{ width: '100%', height: 230, flexDirection: 'column' }}>
        {SHOP.map((item) => {
          const isOwned = owned.includes(item.id)
          const label = isOwned ? `OWNED  •  ${item.name}` : `${item.price} SP  •  ${item.name}`

          return (
            <ActionButton
              key={item.id}
              value={label}
              action={() => {
                if (isOwned) {
                  ctrl.setMessage('Already owned this session')
                  return
                }
                if (points < item.price) {
                  ctrl.setMessage(`Not enough points (requires ${item.price} SP)`)
                  return
                }
                n.update({ purchase: item.id })
                ctrl.setMessage(`Purchase request for "${item.name}" sent!`)
              }}
              width="94%"
              height={48}
              fontSize={14}
              active={isOwned}
            />
          )
        })}
      </UiEntity>

      <TextLabel
        value={ctrl.message || 'Free clothing in DRESS during preparation'}
        height={44}
        fontSize={13}
        color={THEME_COLORS.mint}
      />
    </UiEntity>
  )
}
