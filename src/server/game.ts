import { initial, State, Member, step, outfitRevealed } from '../model'
import { ranking } from '../rankings'
import { inventory, validOutfit, POSES, SHOP } from '../data'

/** Pure server domain: caller supplies transport-verified identity and current scene presence. */
export class AuthoritativeGame {
  state: State
  members = new Map<string, Member>()
  constructor(state = initial()) { this.state = state }

  receive(sender: string, input: unknown, present: Set<string>): boolean {
    if (!present.has(sender) || !input || typeof input !== 'object') return false
    const request = input as Partial<Member>
    if (!validOutfit(request.outfit) || !Number.isSafeInteger(request.round) ||
      typeof request.ready !== 'boolean' || typeof request.name !== 'string' ||
      !Number.isInteger(request.pose) || request.pose! < 0 || request.pose! >= POSES.length + 2) return false
    if (request.outfit.customWearables?.some(urn => !urn.startsWith('urn:decentraland:'))) return false
    let member = this.members.get(sender)
    if (!member) {
      member = { playerId: sender, token: sender, name: '', beat: 0, outfit: inventory.initial(),
        round: this.state.round, ready: false, pose: 0, vote: '', purchase: '' }
      this.members.set(sender, member)
    }
    member.name = request.name.replace(/[<>\r\n]/g, '').slice(0, 20)
    member.beat++
    // Never accept accounts, points, identity, roster or results from the client.
    member.round = request.round!
    member.ready = request.ready
    member.outfit = { ...request.outfit,
      ...(request.outfit.customWearables ? { customWearables: [...request.outfit.customWearables] } : {}) }
    member.pose = request.pose!
    member.vote = typeof request.vote === 'string' ? request.vote.slice(0, 128) : ''
    member.voteDuel = Number.isInteger(request.voteDuel) ? request.voteDuel : undefined
    member.purchase = SHOP.some(item => item.id === request.purchase) ? request.purchase! : ''
    return true
  }

  tick(present: Set<string>, dt: number, now: number) {
    for (const id of this.members.keys()) if (!present.has(id)) this.members.delete(id)
    step(this.state, [...this.members.values()], dt, now)
    this.state.revision++
  }

  view(viewer: string): { state: State; people: { playerId: string; name: string }[] } {
    const s = this.state
    const rankIds = (['day', 'week', 'all'] as const).flatMap(period =>
      ranking(s.accounts, period, Date.now()).slice(0, 5).map(account => account.id))
    const visibleIds = new Set([viewer, ...s.cast.map(c => c.id), ...rankIds])
    return {
      state: {
        ...s,
        cast: s.cast.map(c => outfitRevealed(s, c.id) ? { ...c } : { ...c, outfit: inventory.initial(), pose: 0 }),
        ballots: s.ballots[viewer] ? { [viewer]: s.ballots[viewer] } : {},
        accounts: Object.fromEntries([...visibleIds].filter(id => s.accounts[id]).map(id => [id, s.accounts[id]])),
        hall: s.hall.slice(0, 3)
      },
      people: [...this.members.values()].map(({ playerId, name }) => ({ playerId, name }))
    }
  }
}

export type Checkpoint = { version: 2; state: State }
export function readCheckpoint(value: unknown): State {
  if (value === null) return initial()
  const saved = typeof value === 'string' ? JSON.parse(value) : value
  const state = (saved as Checkpoint)?.state
  if ((saved as Checkpoint)?.version !== 2 || !state || !Array.isArray(state.cast) ||
    !Array.isArray(state.duels) || !Array.isArray(state.hall) || !Array.isArray(state.results) ||
    !state.accounts || !Number.isSafeInteger(state.round) || !Number.isFinite(state.remaining) ||
    !['LOBBY', 'THEME_REVEAL', 'PREPARATION', 'RUNWAY', 'VOTING', 'DUEL_RESULT', 'RESULTS', 'RETURN_TO_LOBBY'].includes(state.phase)) {
    throw new Error('Invalid saved Fashion Battle state; refusing to overwrite progression')
  }
  for (const value of Object.values(state.accounts)) {
    if (!Number.isFinite(value.points) || value.points < 0 || !Array.isArray(value.owned)) {
      throw new Error('Invalid saved account')
    }
  }
  // No ephemeral client identity or pending intents survives a server restart.
  state.leader = 'authoritative-server'
  return state
}
