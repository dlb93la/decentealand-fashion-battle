import { State } from './model'

/** Sparse local QA evidence. Never logs wallet addresses, presence tokens or outfits. */
export class SessionAudit {
  private voteKey = ''
  private resultRound = -1
  constructor(private write: (message: string) => void = console.log) {}

  observe(state: State, playerId?: string) {
    const candidateId = playerId && state.ballots[playerId]
    const key = `${state.round}:${state.duelIndex}`
    if (candidateId && key !== this.voteKey) {
      this.voteKey = key
      this.write('[FashionAudit] ' + JSON.stringify({
        event: 'vote-accepted', round: state.round, duel: state.duelIndex,
        candidateSlot: state.cast.findIndex((c) => c.id === candidateId)
      }))
    }
    if (state.phase === 'RESULTS' && state.round !== this.resultRound) {
      this.resultRound = state.round
      this.write('[FashionAudit] ' + JSON.stringify({
        event: 'results-received', round: state.round, theme: state.theme,
        results: state.results.map((r) => ({
          slot: state.cast.findIndex((c) => c.id === r.id),
          votes: r.votes, duelWins: r.duelWins, points: r.points
        })),
        localSlot: state.cast.findIndex((c) => c.id === playerId),
        localPoints: playerId ? state.accounts[playerId]?.points : undefined
      }))
    }
  }
}
