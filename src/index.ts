import './shared/messages'
import { isServer } from '@dcl/sdk/network'

export async function main() {
  if (isServer()) {
    const { initServer } = await import('./server/server')
    initServer()
  } else {
    const { initClient } = await import('./client/setup')
    initClient()
  }
}
