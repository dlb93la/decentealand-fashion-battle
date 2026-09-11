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
  const rows = <T,>(values: T[], columns: number): T[][] => Array.from({ length: Math.ceil(values.length / columns) }, (_, i) => values.slice(i * columns, (i + 1) * columns))
  const categoryColumns = width < 440 ? 2 : 4
  const filterColumns = width < 440 ? 2 : 3
  const chooseGroup = (i: number) => { ctrl.category = i; ctrl.wardrobePage = 0; ctrl.wardrobeFilter = 'All' }
  return <UiEntity uiTransform={{ positionType: 'absolute', position: { left: 12, bottom: ctrl.wardrobeOpen ? 80 : 12 },
    width, height: ctrl.wardrobeOpen ? height : rowHeight + 16, padding: 8, flexDirection: 'column' }}
    uiBackground={{ color: THEME_COLORS.glassBg }}>
    {ctrl.wardrobeOpen ? <UiEntity uiTransform={{ width: '100%', height: height - rowHeight - 24, flexDirection: 'column', flexShrink: 0, overflow: 'scroll' }}>
      {rows(wardrobeGroups, categoryColumns).map((row, rowIndex) => <UiEntity key={'groups' + rowIndex}
        uiTransform={{ width: '100%', height: rowHeight, flexDirection: 'row', flexShrink: 0 }}>
        {row.map(g => <UiEntity key={g.name} uiTransform={{ width: `${100 / categoryColumns}%`, height: rowHeight, padding: 4, flexShrink: 0 }}>
          <ActionButton variant="category" value={g.name} width="100%" margin={0}
            height={rowHeight - 8} fontSize={14} active={group === g} action={() => chooseGroup(wardrobeGroups.indexOf(g))} />
        </UiEntity>)}
      </UiEntity>)}
      {rows(types, filterColumns).map((row, rowIndex) => <UiEntity key={'filters' + rowIndex}
        uiTransform={{ width: '100%', height: rowHeight, flexDirection: 'row', flexShrink: 0 }}>
        {row.map(type => <UiEntity key={type} uiTransform={{ width: `${100 / filterColumns}%`, height: rowHeight, padding: 4, flexShrink: 0 }}>
          <ActionButton variant="filter" value={type} width="100%" margin={0}
            height={rowHeight - 8} fontSize={14} active={filter === type}
            action={() => { ctrl.wardrobeFilter = type; ctrl.wardrobePage = 0 }} />
        </UiEntity>)}
      </UiEntity>)}
      {rows(items.slice(page * pageSize, (page + 1) * pageSize), 2).map((row, rowIndex) => <UiEntity key={'items' + rowIndex}
        uiTransform={{ width: '100%', height: itemHeight + 12, flexDirection: 'row', flexShrink: 0 }}>
        {row.map(item => {
          const unavailable = item.slot === 'Effects' && item.index === 1 && !ownsSparkles
          return <UiEntity key={item.slot + item.index} uiTransform={{ width: '50%', height: itemHeight + 12, padding: 6, flexShrink: 0 }}><ActionButton variant="item" value={unavailable ? 'Sparkles — in shop' : item.name}
            width="100%" margin={0} height={itemHeight} fontSize={15}
            thumbnail={wearableThumbnail(item.slot, item.index)}
            borderColor={item.slot === 'Head' ? Color4.fromHexString(item.color) : undefined}
            active={!m?.outfit.customWearables?.length && (m?.outfit[item.slot] ?? 0) === item.index}
            disabled={locked || unavailable} action={() => {
              if (!m || locked || unavailable) return
              const outfit = { ...m.outfit, [item.slot]: item.index }
              if (item.slot !== 'Effects') { n.nativeWardrobe = false; delete outfit.customWearables }
              n.update({ outfit, round: s.round, ready: false })
            }} /></UiEntity>
        })}
      </UiEntity>)}
      <UiEntity uiTransform={{ width: '100%', height: rowHeight, flexDirection: 'row', flexShrink: 0, justifyContent: 'space-between' }}>
        <ActionButton value="Previous" width="30%" height={rowHeight - 8} fontSize={13} disabled={page === 0}
          action={() => { ctrl.wardrobePage = page - 1 }} />
        <Label value={`${page + 1} / ${pages}`} fontSize={14} uiTransform={{ width: '28%', height: rowHeight }} />
        <ActionButton value="Next" width="30%" height={rowHeight - 8} fontSize={13} disabled={page + 1 >= pages}
          action={() => { ctrl.wardrobePage = page + 1 }} />
      </UiEntity>
    </UiEntity> : null}
    <UiEntity uiTransform={{ width: '100%', height: rowHeight, flexDirection: 'row', flexShrink: 0 }}>
      <ActionButton value={ctrl.wardrobeOpen ? 'SAVE' : 'DRESS'} width="46%" height={rowHeight - 8} fontSize={17}
        disabled={locked} action={() => { if (ctrl.wardrobeOpen && m) ctrl.saveLook(m.outfit); else ctrl.openWardrobe(n) }} />
      <ActionButton value="READY" width="46%" height={rowHeight - 8} fontSize={17}
        active={!!m?.ready} disabled={locked} action={() => { ctrl.wardrobeOpen = false; n.update({ ready: true, round: s.round }) }} />
    </UiEntity>
  </UiEntity>
}
