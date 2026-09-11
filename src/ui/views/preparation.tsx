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
  if (!s.cast.some(c => c.id === m?.playerId)) return (
    <UiEntity uiTransform={{ positionType: 'absolute', position: { left: 12, bottom: 12 },
      width: wardrobeLayout().width, height: 88, padding: 8 }} uiBackground={{ color: THEME_COLORS.glassBg }}>
      <Label value="Você está na audiência. Vote nos duelos e participe da próxima rodada."
        fontSize={16} uiTransform={{ width: '100%', height: 72 }} />
    </UiEntity>
  )
  const locked = s.remaining <= 1
  const { width, height, rowHeight, itemHeight, pageSize, columns } = wardrobeLayout()
  const group = wardrobeGroups[ctrl.category % wardrobeGroups.length]
  const types = ['Todos', ...Array.from(new Set(group.items.map(i => i.type)))]
  const filter = types.includes(ctrl.wardrobeFilter) ? ctrl.wardrobeFilter : 'Todos'
  const items = group.items.filter(i => filter === 'Todos' || i.type === filter)
  const pages = Math.max(1, Math.ceil(items.length / pageSize))
  const page = Math.min(ctrl.wardrobePage, pages - 1)
  const ownsSparkles = !!s.accounts[m?.playerId || '']?.owned.includes('sparkles')
  const chooseGroup = (i: number) => { ctrl.category = i; ctrl.wardrobePage = 0; ctrl.wardrobeFilter = 'Todos' }
  return <UiEntity uiTransform={{ positionType: 'absolute', position: { left: 12, bottom: 12 },
    width, height: ctrl.wardrobeOpen ? height : rowHeight + 16, padding: 8, flexDirection: 'column' }}
    uiBackground={{ color: THEME_COLORS.glassBg }}>
    {ctrl.wardrobeOpen ? <UiEntity uiTransform={{ width: '100%', height: height - rowHeight - 16, flexDirection: 'column' }}>
      <UiEntity uiTransform={{ width: '100%', height: rowHeight, flexDirection: 'row' }}>
        <ActionButton value="<" width={44} height={rowHeight - 8} action={() => chooseGroup((ctrl.category + wardrobeGroups.length - 1) % wardrobeGroups.length)} />
        <Label value={group.name} fontSize={16} uiTransform={{ width: width - 120, height: rowHeight }} />
        <ActionButton value=">" width={44} height={rowHeight - 8} action={() => chooseGroup((ctrl.category + 1) % wardrobeGroups.length)} />
      </UiEntity>
      <UiEntity uiTransform={{ width: '100%', height: rowHeight, flexDirection: 'row' }}>
        <ActionButton value="<" width={44} height={rowHeight - 8} disabled={types.length < 2}
          action={() => { ctrl.wardrobeFilter = types[(types.indexOf(filter) + types.length - 1) % types.length]; ctrl.wardrobePage = 0 }} />
        <Label value={filter} fontSize={16} uiTransform={{ width: width - 120, height: rowHeight }} />
        <ActionButton value=">" width={44} height={rowHeight - 8} disabled={types.length < 2}
          action={() => { ctrl.wardrobeFilter = types[(types.indexOf(filter) + 1) % types.length]; ctrl.wardrobePage = 0 }} />
      </UiEntity>
      <UiEntity uiTransform={{ width: '100%', height: Math.ceil(pageSize / columns) * (itemHeight + 8), flexDirection: 'row', flexWrap: 'wrap' }}>
        {items.slice(page * pageSize, (page + 1) * pageSize).map(item => {
          const unavailable = item.slot === 'Effects' && item.index === 1 && !ownsSparkles
          return <ActionButton key={item.slot + item.index} value={unavailable ? 'Sparkles — na loja' : item.name}
            width={(width - 16) / columns - 8} height={itemHeight} fontSize={16}
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
        <ActionButton value="Anterior" width="30%" height={rowHeight - 8} fontSize={16} disabled={page === 0}
          action={() => { ctrl.wardrobePage = page - 1 }} />
        <Label value={`${page + 1} / ${pages}`} fontSize={16} uiTransform={{ width: '28%', height: rowHeight }} />
        <ActionButton value="Próxima" width="30%" height={rowHeight - 8} fontSize={16} disabled={page + 1 >= pages}
          action={() => { ctrl.wardrobePage = page + 1 }} />
      </UiEntity>
    </UiEntity> : null}
    <UiEntity uiTransform={{ width: '100%', height: rowHeight, flexDirection: 'row' }}>
      <ActionButton value={ctrl.wardrobeOpen ? 'SALVAR' : 'VESTIR'} width={(width - 16) / 3 - 8} height={rowHeight - 8} fontSize={17}
        disabled={locked} action={() => { if (ctrl.wardrobeOpen && m) ctrl.saveLook(m.outfit); else ctrl.wardrobeOpen = true }} />
      <ActionButton value={m?.ready ? 'PRONTO' : 'Pronto?'} width={(width - 16) / 3 - 8} height={rowHeight - 8} fontSize={17}
        active={!!m?.ready} disabled={locked} action={() => { ctrl.wardrobeOpen = false; n.update({ ready: true, round: s.round }) }} />
      <ActionButton value={'Usar\nsalvo'} width={(width - 16) / 3 - 8} height={rowHeight - 8}
        fontSize={16} disabled={locked || !ctrl.savedLook} action={() => ctrl.restoreLook(n)} />
    </UiEntity>
  </UiEntity>
}
