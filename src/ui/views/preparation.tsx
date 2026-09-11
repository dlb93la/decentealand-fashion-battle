import ReactEcs from '@dcl/sdk/react-ecs'
import { UiEntity, Label } from '../primitives'
import { ActionButton } from '../components'
import { THEME_COLORS, wardrobeLayout } from '../theme'
import { UiController } from '../controller'
import { FashionNetwork } from '../../network'
import { State, Member } from '../../model'
import { wearableThumbnail } from '../../avatar-factory'
import { wardrobeGroups } from '../../wardrobe'
import { Color4 } from '@dcl/sdk/math'

export function PreparationView({ state: s, network: n, mine: m, controller: ctrl }: {
  state: State; network: FashionNetwork; mine?: Member; controller: UiController
}) {
  if (!s.cast.some(c => c.id === m?.playerId)) return <UiEntity />
  const locked = s.remaining <= 1
  const { width, height, rowHeight, itemHeight, pageSize } = wardrobeLayout()
  const group = wardrobeGroups[ctrl.category % wardrobeGroups.length]
  const types = ['All', ...Array.from(new Set(group.items.map(i => i.type)))]
  const filter = types.includes(ctrl.wardrobeFilter) ? ctrl.wardrobeFilter : 'All'
  const items = group.items.filter(i => filter === 'All' || i.type === filter)
  const pages = Math.max(1, Math.ceil(items.length / pageSize))
  const page = Math.min(ctrl.wardrobePage, pages - 1)
  const ownsSparkles = !!s.accounts[m?.playerId || '']?.owned.includes('sparkles')
  const chooseGroup = (i: number) => { ctrl.category = i; ctrl.wardrobePage = 0; ctrl.wardrobeFilter = 'All' }
  return <UiEntity uiTransform={{ positionType: 'absolute', position: { left: 12, bottom: 12 },
    width, height: ctrl.wardrobeOpen ? height : rowHeight + 16, padding: 8, flexDirection: 'column' }}
    uiBackground={{ color: THEME_COLORS.glassBg }}>
    {ctrl.wardrobeOpen ? <UiEntity uiTransform={{ width: '100%', height: height - rowHeight - 24, flexDirection: 'column' }}>
      <UiEntity uiTransform={{ width: '100%', height: rowHeight * 2, flexDirection: 'row', flexWrap: 'wrap' }}>
        {wardrobeGroups.map((g, i) => <ActionButton key={g.name} value={g.name} width={(width - 16) / 4 - 8}
          height={rowHeight - 8} fontSize={13} active={group === g} action={() => chooseGroup(i)} />)}
      </UiEntity>
      <UiEntity uiTransform={{ width: '100%', height: rowHeight, flexDirection: 'row' }}>
        {types.map(type => <ActionButton key={type} value={type} width={(width - 16) / types.length - 8}
          height={rowHeight - 8} fontSize={12} active={filter === type}
          action={() => { ctrl.wardrobeFilter = type; ctrl.wardrobePage = 0 }} />)}
      </UiEntity>
      <UiEntity uiTransform={{ width: '100%', height: Math.ceil(pageSize / 2) * (itemHeight + 8), flexDirection: 'row', flexWrap: 'wrap' }}>
        {items.slice(page * pageSize, (page + 1) * pageSize).map(item => {
          const unavailable = item.slot === 'Effects' && item.index === 1 && !ownsSparkles
          return <ActionButton key={item.slot + item.index} value={unavailable ? 'Sparkles — in shop' : item.name}
            width={(width - 16) / 2 - 8} height={itemHeight} fontSize={13}
            thumbnail={wearableThumbnail(item.slot, item.index)}
            borderColor={item.slot === 'Head' ? Color4.fromHexString(item.color) : undefined}
            active={!m?.outfit.customWearables?.length && (m?.outfit[item.slot] ?? 0) === item.index}
            disabled={locked || unavailable} action={() => {
              if (!m || locked || unavailable) return
              const outfit = { ...m.outfit, [item.slot]: item.index }
              if (item.slot !== 'Effects') { n.nativeWardrobe = false; delete outfit.customWearables }
              n.update({ outfit, round: s.round, ready: false })
            }} />
        })}
      </UiEntity>
      <UiEntity uiTransform={{ width: '100%', height: rowHeight, flexDirection: 'row', justifyContent: 'space-between' }}>
        <ActionButton value="Previous" width="30%" height={rowHeight - 8} fontSize={13} disabled={page === 0}
          action={() => { ctrl.wardrobePage = page - 1 }} />
        <Label value={`${page + 1} / ${pages}`} fontSize={14} uiTransform={{ width: '28%', height: rowHeight }} />
        <ActionButton value="Next" width="30%" height={rowHeight - 8} fontSize={13} disabled={page + 1 >= pages}
          action={() => { ctrl.wardrobePage = page + 1 }} />
      </UiEntity>
    </UiEntity> : null}
    <UiEntity uiTransform={{ width: '100%', height: rowHeight, flexDirection: 'row' }}>
      <ActionButton value={ctrl.wardrobeOpen ? 'SAVE' : 'DRESS'} width="48%" height={rowHeight - 8} fontSize={17}
        disabled={locked} action={() => { if (ctrl.wardrobeOpen && m) ctrl.saveLook(m.outfit); else ctrl.openWardrobe(n) }} />
      <ActionButton value="READY" width="48%" height={rowHeight - 8} fontSize={17}
        active={!!m?.ready} disabled={locked} action={() => { ctrl.wardrobeOpen = false; n.update({ ready: true, round: s.round }) }} />
    </UiEntity>
  </UiEntity>
}
