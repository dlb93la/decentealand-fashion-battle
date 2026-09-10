// Extracted from src/shared/table/model.ts in root project for standalone independence
// Fashion Battle uses this LeaseObserver to track presence heartbeat without trusting remote wall clocks.

export interface SeatClaim {
  playerId: string
  name: string
  token: string
  beat: number
}

export const LEASE_SECONDS = 30

/** Local elapsed-time observations avoid trusting remote wall clocks. */
export class LeaseObserver {
  private records = new Map<string, { fingerprint: string; seenAt: number }>()

  active(key: string, claim: Readonly<SeatClaim>, now: number): boolean {
    if (!claim.playerId || !claim.token || !Number.isSafeInteger(claim.beat) || claim.beat < 0) return false
    const fingerprint = JSON.stringify([claim.playerId, claim.token, claim.beat])
    let record = this.records.get(key)
    if (!record || record.fingerprint !== fingerprint) {
      record = { fingerprint, seenAt: now }
      this.records.set(key, record)
    }
    return now - record.seenAt < LEASE_SECONDS
  }
}
