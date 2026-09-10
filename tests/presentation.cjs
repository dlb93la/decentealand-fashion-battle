const test = require('node:test')
const assert = require('node:assert/strict')
const { loader } = require('./loader.cjs')
test('runway camera frames the stage and releases normal camera outside competition', () => {
  const component = () => {
    const data = new Map()
    return { create: (e, v) => data.set(e, v), createOrReplace: (e, v) => data.set(e, v),
      getMutable: e => data.get(e), has: e => data.has(e) }
  }
  let entity = 10
  const ecs = { engine: { CameraEntity: 2, addEntity: () => ++entity }, Transform: component(),
    VirtualCamera: { ...component(), Transition: { Time: value => value } }, MainCamera: component() }
  const { Presentation } = loader({ '@dcl/sdk/ecs': ecs })(__dirname + '/../src/presentation.ts')
  const p = new Presentation()
  const n = { mine: {}, state: { round: 1, phase: 'RUNWAY', duelIndex: 0 }, update() {} }
  for (const phase of ['RUNWAY', 'VOTING', 'DUEL_RESULT', 'RESULTS']) {
    n.state.phase = phase
    p.tick(n)
    const camera = ecs.MainCamera.getMutable(2).virtualCameraEntity
    assert.ok(camera)
    assert.ok(ecs.Transform.getMutable(camera).position.z > 5.5)
    assert.equal(ecs.VirtualCamera.getMutable(camera).fov, 48)
  }
  for (const phase of ['RETURN_TO_LOBBY', 'LOBBY', 'PREPARATION']) {
    n.state.phase = phase
    p.tick(n)
    assert.equal(ecs.MainCamera.getMutable(2).virtualCameraEntity, undefined)
  }
})
