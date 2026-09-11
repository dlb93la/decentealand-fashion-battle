/** Checkpoint writes are serialized. Failure retains the exact pending checkpoint for retry. */
export class CheckpointWriter {
  pending = ''
  busy = false
  failed = false
  constructor(private write: (value: string) => Promise<boolean>) {}
  queue(value: string) { this.pending = value }
  async flush(): Promise<boolean> {
    if (this.busy || !this.pending) return false
    this.busy = true
    const value = this.pending
    try {
      const ok = await this.write(value)
      this.failed = !ok
      if (ok && this.pending === value) this.pending = ''
      return ok
    } catch { this.failed = true; return false }
    finally { this.busy = false }
  }
}
