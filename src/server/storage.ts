import { getStorageServerUrl } from '@dcl/sdk/server/storage-url'
import { wrapSignedFetch } from '@dcl/sdk/server/utils'
import { readCheckpoint } from './game'

/** Storage.get conflates transport failure with absence in the pinned SDK.
 * Only a confirmed 404 permits creating a new game; all other failures retry.
 * Keep this adapter reviewed when upgrading the SDK's internal storage helpers.
 */
export async function restoreCheckpoint(key: string) {
  const base = await getStorageServerUrl()
  const [error, data, status] = await wrapSignedFetch<{ value?: unknown }>({
    url: `${base}/values/${encodeURIComponent(key)}`
  })
  if (status === 404) return readCheckpoint(null)
  if (error || status !== 200 || !data || data.value == null)
    throw new Error('Checkpoint read failed; refusing to initialize empty progression')
  return readCheckpoint(data.value)
}
