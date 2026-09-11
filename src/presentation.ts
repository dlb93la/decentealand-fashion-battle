import { FashionNetwork } from './network'
import { engine, Transform, VirtualCamera, MainCamera } from '@dcl/sdk/ecs'

/** Local, opt-in framing only. Never moves the player or disables locomotion. */
export class Presentation {
  private previous = ''
  private camera = engine.addEntity()
  private target = engine.addEntity()

  constructor() {
    Transform.create(this.target, { position: { x: 12, y: 1.5, z: 14 } })
    Transform.create(this.camera, { position: { x: 12, y: 2.2, z: 8.5 } })
    VirtualCamera.create(this.camera, {
      lookAtEntity: this.target,
      fov: 48,
      defaultTransition: { transitionMode: VirtualCamera.Transition.Time(0.6) }
    })
  }

  tick(n: FashionNetwork, wardrobeOpen = false, watchStage = false) {
    const s = n.state
    const dressing = !!n.mine && wardrobeOpen && s.phase === 'PREPARATION' && s.remaining > 1
    const stage = !!n.mine && watchStage && ['RUNWAY', 'VOTING', 'DUEL_RESULT', 'RESULTS'].includes(s.phase)
    const mode = dressing ? 'dressing' : stage ? (s.phase === 'RESULTS' ? 'results' : 'stage') : 'free'
    if (mode === this.previous) return
    this.previous = mode
    if (mode === 'free') {
      if (MainCamera.has(engine.CameraEntity) &&
          MainCamera.getMutable(engine.CameraEntity).virtualCameraEntity === this.camera)
        MainCamera.getMutable(engine.CameraEntity).virtualCameraEntity = undefined
      return
    }
    Transform.getMutable(this.camera).position = dressing
      ? { x: 5.8, y: 1.7, z: 9.7 } : { x: 12, y: 2.2, z: mode === 'results' ? 6 : 8.5 }
    Transform.getMutable(this.target).position = dressing
      ? { x: 2.5, y: 1.35, z: 11 } : { x: 12, y: 1.5, z: mode === 'results' ? 12 : 14 }
    MainCamera.createOrReplace(engine.CameraEntity, { virtualCameraEntity: this.camera })
  }
}
