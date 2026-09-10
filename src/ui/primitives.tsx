import ReactEcs, { UiEntity as SdkUiEntity, Label as SdkLabel } from '@dcl/sdk/react-ecs'
import { engine, UiCanvasInformation } from '@dcl/sdk/ecs'
import { isMobile } from '@dcl/sdk/platform'

/** Readable canvas-pixel controls, retaining the SDK virtual canvas and safe area. */
function factor() {
  const canvas = UiCanvasInformation.getOrNull(engine.RootEntity)
  if (!canvas || !canvas.width || !canvas.height) return 1
  const scale = Math.min(canvas.width / (isMobile() ? 1600 : 1920), canvas.height / (isMobile() ? 720 : 1080))
  return scale > 0 ? 1 / scale : 1
}
function pixels(value: any, scale: number): any {
  if (typeof value === 'number') return value * scale
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, pixels(v, scale)]))
  return value
}
function transform(value: any) {
  if (!value) return value
  const scale = factor()
  const pixelKeys = [
    'width',
    'height',
    'minWidth',
    'maxWidth',
    'minHeight',
    'maxHeight',
    'position',
    'margin',
    'padding',
    'borderWidth',
    'borderRadius'
  ]
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, pixelKeys.includes(k) ? pixels(v, scale) : v]))
}
export function UiEntity(props: Parameters<typeof SdkUiEntity>[0]) {
  return <SdkUiEntity {...props} uiTransform={transform(props.uiTransform)} />
}
export function Label(props: Parameters<typeof SdkLabel>[0]) {
  return (
    <SdkLabel
      {...props}
      fontSize={typeof props.fontSize === 'number' ? props.fontSize * factor() : props.fontSize}
      uiTransform={transform(props.uiTransform)}
    />
  )
}
