import ReactEcs from '@dcl/sdk/react-ecs'
import { UiEntity, Label } from '../primitives'
import { ActionButton } from '../components'
import { THEME_COLORS, panelWidth } from '../theme'
import { UiController } from '../controller'
import { FashionNetwork, openBackpack } from '../../network'
import { State, Member } from '../../model'
import { inventory } from '../../data'
import { Color4 } from '@dcl/sdk/math'
import { wearableThumbnail } from '../../avatar-factory'

// Only offer categories represented by the shared avatar catalog.
const categories = ['Hair', 'Top', 'Bottom', 'Shoes', 'Accessories', 'Glasses', 'Hat', 'Head', 'Face', 'Eyes', 'Back', 'Effects'] as const
export function PreparationView({
  state: s,
  network: n,
  mine: m,
  controller: ctrl
}: {
  state: State
  network: FashionNetwork
  mine?: Member
  controller: UiController
}) {
  const locked = s.remaining <= 1
  const width = panelWidth(360)
  const columns = width < 300 ? 2 : 3
  const itemWidth = (width - 16) / columns - 8
  const actionCount = ctrl.savedLook ? 4 : 3
  const actionColumns = width < 300 ? 2 : actionCount
  const actionWidth = (width - 16) / actionColumns - 8
  const actionHeight = Math.ceil(actionCount / actionColumns) * 52
  const category = categories[ctrl.category % categories.length]
  const items = inventory.items(category)
  const filters = ['', ...Array.from(new Set(items.map(item => item.tag).filter(Boolean)))]
  const filter = filters.includes(ctrl.wardrobeFilter) ? ctrl.wardrobeFilter : ''
  const filteredItems = items.map((item, index) => ({ item, index })).filter(({ item }) => !filter || item.tag === filter)
  const pages = Math.max(1, Math.ceil(filteredItems.length / 6))
  const page = ctrl.wardrobePage % pages
  const visibleItems = filteredItems.slice(page * 6, page * 6 + 6)
  const gridHeight = Math.ceil(visibleItems.length / columns) * 52
  const ownsSparkles = !!s.accounts[m?.playerId || '']?.owned.includes('sparkles')
  const selected = category === 'Effects' ? (m?.outfit.Effects ?? (ownsSparkles ? 1 : 0)) : (m?.outfit[category] ?? 0)
  if (!s.cast.some((c) => c.id === m?.playerId)) return <UiEntity />
  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { bottom: 24, left: '50%' },
        margin: { left: -width / 2 },
        width,
        height: (ctrl.wardrobeOpen ? 104 + gridHeight : 0) + actionHeight + (ctrl.message && !ctrl.wardrobeOpen ? 42 : 16),
        flexDirection: 'column',
        alignItems: 'center',
        padding: 8
      }}
      uiBackground={{ color: THEME_COLORS.glassBg }}
    >
      {ctrl.wardrobeOpen ? (
        <UiEntity uiTransform={{ width: '100%', height: 104 + gridHeight, flexDirection: 'column' }}>
          <ActionButton value={filter ? 'Estilo: ' + filter : 'Estilo: TODOS'} width="94%" height={44} fontSize={13}
            action={() => { ctrl.wardrobeFilter = filters[(filters.indexOf(filter) + 1) % filters.length]; ctrl.wardrobePage = 0 }} />
          <UiEntity uiTransform={{ width: '100%', height: 50, flexDirection: 'row', justifyContent: 'center' }}>
            <ActionButton
              value="<"
              width={44}
              action={() => {
                ctrl.category = (ctrl.category + categories.length - 1) % categories.length
              }}
            />
            <ActionButton
              value={category + (pages > 1 ? ` ${page + 1}/${pages} >` : '')}
              width={width - 128}
              fontSize={13}
              action={() => {
                if (pages > 1) ctrl.wardrobePage = (page + 1) % pages
                else ctrl.category = (ctrl.category + 1) % categories.length
              }}
            />
            <ActionButton
              value=">"
              width={44}
              action={() => {
                ctrl.category = (ctrl.category + 1) % categories.length
              }}
            />
          </UiEntity>
          <UiEntity
            uiTransform={{
              width: '100%',
              height: gridHeight,
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}
          >
            {visibleItems.map(({ item, index: i }) => { return (
              <ActionButton
                key={i}
                value={category === 'Effects' && i === 1 && !ownsSparkles ? 'Na loja' : item.name}
                width={itemWidth}
                fontSize={12}
                thumbnail={wearableThumbnail(category, i)}
                height={44}
                active={(category === 'Effects' || category === 'Back' || (!n.nativeWardrobe && !m?.outfit.customWearables?.length)) && selected === i}
                borderColor={category === 'Head' ? Color4.fromHexString(item.color) : undefined}
                disabled={locked || (category === 'Effects' && i === 1 && !ownsSparkles)}
                action={() => {
                  if (!m || locked) return
                  if (category === 'Effects' && i === 1 && !ownsSparkles) return
                  if (category !== 'Effects' && category !== 'Back') n.nativeWardrobe = false
                  const outfit = { ...m.outfit, [category]: i }
                  if (category !== 'Effects' && category !== 'Back') delete outfit.customWearables
                  n.update({ outfit, round: s.round, ready: false })
                }}
              />
            ) })}
          </UiEntity>
        </UiEntity>
      ) : null}
      <UiEntity uiTransform={{ width: '100%', height: actionHeight, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
        <ActionButton
          value={ctrl.wardrobeOpen ? 'SALVAR' : 'VESTIR'}
          width={actionWidth}
          fontSize={12}
          disabled={locked}
          action={() => {
            if (ctrl.wardrobeOpen && m) ctrl.saveLook(m.outfit)
            else ctrl.wardrobeOpen = true
          }}
        />
        <ActionButton
          value={m?.ready ? 'PRONTO' : 'READY'}
          width={actionWidth}
          fontSize={12}
          disabled={locked}
          action={() => {
            ctrl.wardrobeOpen = false
            n.update({ ready: true, round: s.round })
          }}
        />
        <ActionButton
          value="MOCHILA"
          width={actionWidth}
          fontSize={12}
          disabled={locked}
          action={() => {
            void openBackpack().then((ok) => {
              if (ok) {
                n.nativeWardrobe = true
                ctrl.wardrobeOpen = false
              }
              ctrl.setMessage(ok ? 'Mochila nativa: aplique e feche manualmente.' : 'Mochila indisponível. Use ROUPAS.')
            })
          }}
        />
        {ctrl.savedLook ? <ActionButton value="USAR LOOK" width={actionWidth} fontSize={12} disabled={locked}
          action={() => ctrl.restoreLook(n)} /> : null}
      </UiEntity>
      {ctrl.message && !ctrl.wardrobeOpen ? <Label value={ctrl.message} fontSize={12} uiTransform={{ width: '100%', height: 26 }} /> : null}
    </UiEntity>
  )
}

