import { movePlayerTo } from '~system/RestrictedActions'
import { FashionNetwork } from './network'
import { engine, Transform, VirtualCamera, MainCamera } from '@dcl/sdk/ecs'

/** Transitions never freeze locomotion; failed teleport leaves touch navigation available. */
export class Presentation {
  private previous = ''
  private dressing = false
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

  tick(n: FashionNetwork, wardrobeOpen = false) {
    const s = n.state,
      m = n.mine
    if (!m) return
    const dressing = wardrobeOpen && s.phase === 'PREPARATION' && s.remaining > 1
    if (dressing !== this.dressing) {
      this.dressing = dressing
      if (dressing) {
        Transform.getMutable(this.camera).position = { x: 5.8, y: 1.7, z: 9.7 }
        Transform.getMutable(this.target).position = { x: 2.5, y: 1.35, z: 11 }
        MainCamera.createOrReplace(engine.CameraEntity, { virtualCameraEntity: this.camera })
      } else {
        if (MainCamera.has(engine.CameraEntity))
          MainCamera.getMutable(engine.CameraEntity).virtualCameraEntity = undefined
      }
    }
    if (dressing) return
    const key = `${s.round}:${s.phase}:${s.duelIndex}`
    if (key === this.previous) return
    this.previous = key
    const show = ['RUNWAY', 'VOTING', 'DUEL_RESULT', 'RESULTS'].includes(s.phase)
    if (show) {
      const final = s.phase === 'RESULTS'
      Transform.getMutable(this.camera).position = { x: 12, y: 2.2, z: final ? 6 : 8.5 }
      Transform.getMutable(this.target).position = { x: 12, y: 1.5, z: final ? 12 : 14 }
      MainCamera.createOrReplace(engine.CameraEntity, { virtualCameraEntity: this.camera })
    } else if (MainCamera.has(engine.CameraEntity)) {
      MainCamera.getMutable(engine.CameraEntity).virtualCameraEntity = undefined
    }

    if (s.phase === 'PREPARATION') {
      n.update({ round: s.round, ready: false, vote: '' })
      // Position player in the lounge near the dressing provadores
      void movePlayerTo({
        newRelativePosition: { x: 5.8, y: 0.35, z: 10.0 },
        cameraTarget: { x: 3.5, y: 1.4, z: 12.0 }
      }).catch((err) => {
        console.error('[FashionBattle] movePlayerTo failed during PREPARATION:', err)
      })
    }

    if (s.phase === 'RUNWAY' || s.phase === 'VOTING') {
      // Frame both duelists on the central catwalk under the studio spotlights
      void movePlayerTo({
        newRelativePosition: { x: 12.0, y: 0.35, z: 5.5 },
        cameraTarget: { x: 12.0, y: 1.4, z: 14.0 }
      }).catch((err) => {
        console.error('[FashionBattle] movePlayerTo failed during RUNWAY/VOTING:', err)
      })
    }

    if (s.phase === 'RESULTS') {
      // Frame the runway winner on the central podium
      void movePlayerTo({
        newRelativePosition: { x: 12.0, y: 0.35, z: 5.5 },
        cameraTarget: { x: 12.0, y: 1.4, z: 12.0 }
      }).catch((err) => {
        console.error('[FashionBattle] movePlayerTo failed during RESULTS:', err)
      })
    }

    if (s.phase === 'RETURN_TO_LOBBY' || s.phase === 'LOBBY') {
      void movePlayerTo({
        newRelativePosition: { x: 12.0, y: 0.35, z: 4.0 },
        cameraTarget: { x: 12.0, y: 1.8, z: 14.0 }
      }).catch((err) => {
        console.error('[FashionBattle] movePlayerTo failed during LOBBY:', err)
      })
    }
  }
}
