import { engine, Schemas } from '@dcl/sdk/ecs'
import { registerMessages } from '@dcl/sdk/network'

// Define schemas during module loading, before the engine seals.
export const ServerStatus = engine.defineComponent('fashion::server:v2', {
  epoch: Schemas.String,
  beat: Schemas.Int64,
  status: Schemas.String
})
export const room = registerMessages({
  intent: Schemas.Map({ json: Schemas.String }),
  snapshot: Schemas.Map({ epoch: Schemas.String, revision: Schemas.Int, index: Schemas.Int, count: Schemas.Int, json: Schemas.String })
})
export const SNAPSHOT_CHARS = 1800 // <= 10.8 KB even for six-byte escaped JSON characters
export const MAX_SNAPSHOT_CHUNKS = 64
