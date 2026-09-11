import { engine } from '@dcl/sdk/ecs'
import { ReactEcsRenderer } from '@dcl/sdk/react-ecs'
import { FashionNetwork } from './network'
import { FashionWorld } from './world'
import { renderUi, uiController } from './ui'
import { Presentation } from './presentation'
import { inventory } from './data'
import { SessionAudit } from './session-audit'

export function main() {
  const network = new FashionNetwork()
  const world = new FashionWorld()
  const presentation = new Presentation()
  const audit = new SessionAudit()

  ReactEcsRenderer.setUiRenderer(() => renderUi(network), {
    virtualWidth: 1920,
    virtualHeight: 1080,
    screenInset: 'interactable'
  })

  engine.addSystem((dt) => {
    network.tick(dt)
    audit.observe(network.state, network.mine?.playerId)
    uiController.tick(network)
    presentation.tick(network, uiController.wardrobeOpen, uiController.watchStage)

    world.update(
      network.state,
      network.mine?.outfit || inventory.initial(),
      network.mine?.pose || 0,
      dt,
      network.state.accounts[network.mine?.playerId || '']?.owned || [],
      network.mine?.playerId || '',
      uiController.previewAngle
    )
  })
}
