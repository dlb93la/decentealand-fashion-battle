import {
  CONFIG,
  THEMES,
  POSES,
  SHOP,
  Outfit,
  inventory,
  validOutfit,
  botOutfit,
  botLookScore,
  hash
} from './data'

import { recordRanking, RankingAccount } from './rankings'

export type Phase =
  | 'LOBBY'
  | 'THEME_REVEAL'
  | 'PREPARATION'
  | 'RUNWAY'
  | 'VOTING'
  | 'DUEL_RESULT'
  | 'RESULTS'
  | 'RETURN_TO_LOBBY'

export type Member = {
  playerId: string
  name: string
  token: string
  beat: number
  outfit: Outfit
  pose: number
  ready: boolean
  round: number
  vote: string
  voteDuel?: number
  purchase: string
}

export type Candidate = {
  id: string
  name: string
  bot: boolean
  outfit: Outfit
  pose: number
}

export type Result = Candidate & {
  votes: number
  duelWins?: number
  points: number
}

export type RecordWin = {
  winner: string
  name: string
  theme: string
  votes: number
  timestamp: number
  outfit: Outfit
  pose?: number
  cosmetics?: string[]
}

export type Account = RankingAccount & {
  points: number
  wins: number
  votes: number
  participations: number
  owned: string[]
}

export type Duel = {
  index: number
  aId: string
  bId: string
  winnerId: string
  votesA: number
  votesB: number
}

export type State = {
  round: number
  phase: Phase
  remaining: number
  theme: number
  cast: Candidate[]
  voters: string[]
  ballots: Record<string, string>
  results: Result[]
  accounts: Record<string, Account>
  hall: RecordWin[]
  leader: string
  revision: number
  duelIndex: number
  duels: Duel[]
}

export const initial = (): State => ({
  round: 0,
  phase: 'LOBBY',
  remaining: CONFIG.lobby,
  theme: 0,
  cast: [],
  voters: [],
  ballots: {},
  results: [],
  accounts: {},
  hall: [],
  leader: '',
  revision: 0,
  duelIndex: 0,
  duels: []
})

export const account = (): Account => ({
  points: 0,
  wins: 0,
  votes: 0,
  participations: 0,
  owned: []
})

export function currentDuel(s: State): Duel | undefined {
  return s.duels[s.duelIndex]
}

export function pendingVote(s: State, m?: Member): string {
  return m?.vote && m.round === s.round && m.voteDuel === s.duelIndex && !s.ballots[m.playerId] ? m.vote : ''
}

export function outfitRevealed(s: State, id: string): boolean {
  if (!s.cast.some((c) => c.id === id)) return false
  if (s.phase === 'RESULTS') return true
  if (!['RUNWAY', 'VOTING', 'DUEL_RESULT'].includes(s.phase)) return false
  const index = s.duels.findIndex((duel) => duel.aId === id || duel.bId === id)
  if (index < 0 || index > s.duelIndex) return false
  if (index < s.duelIndex) return true
  return s.phase !== 'RUNWAY' || s.remaining <= CONFIG.duelPose
}

export function currentDuelists(s: State): [Candidate | undefined, Candidate | undefined] {
  const duel = currentDuel(s)
  if (!duel) return [undefined, undefined]
  const a = s.cast.find((c) => c.id === duel.aId)
  const b = s.cast.find((c) => c.id === duel.bId)
  return [a, b]
}

export function vote(s: State, voterId: string, candidateId: string, round: number, duelIndex = s.duelIndex): boolean {
  if (
    s.phase !== 'VOTING' ||
    round !== s.round ||
    duelIndex !== s.duelIndex ||
    voterId === candidateId ||
    !s.voters.includes(voterId) ||
    s.ballots[voterId]
  ) {
    return false
  }

  const duel = currentDuel(s)
  // In 1v1 duel voting, candidate must belong to the active duel (or cast if no duel defined)
  if (duel) {
    if (voterId === duel.aId || voterId === duel.bId) return false
    if (candidateId !== duel.aId && candidateId !== duel.bId) return false
  } else {
    if (!s.cast.some((c) => c.id === candidateId)) return false
  }

  s.ballots[voterId] = candidateId
  return true
}

export function buy(s: State, id: string, itemId: string): boolean {
  const item = SHOP.find((x) => x.id === itemId)
  const a = s.accounts[id]
  if (!item || !a || a.owned.includes(itemId) || a.points < item.price) return false
  a.points -= item.price
  a.owned.push(itemId)
  return true
}

function begin(s: State, members: Member[]) {
  s.round++
  s.theme = hash(`fashion:${s.round}`) % THEMES.length
  s.ballots = {}
  s.results = []
  s.duelIndex = 0
  s.duels = []

  const sorted = members.slice().sort((a, b) => a.playerId.localeCompare(b.playerId))
  const offset = ((s.round - 1) * CONFIG.maxParticipants) % Math.max(1, sorted.length)
  s.cast = sorted
    .map((_, i) => sorted[(i + offset) % sorted.length])
    .slice(0, CONFIG.maxParticipants)
    .map((m) => ({
      id: m.playerId,
      name: m.name,
      bot: false,
      outfit: validOutfit(m.outfit) ? { ...m.outfit } : inventory.initial(),
      pose: 0
    }))

  const names = ['Fashionista', 'Space Cowboy', 'Cyber Queen', 'Chaos', 'Comedian', 'Stylist']
  if (CONFIG.botFill) {
    for (let i = 0; s.cast.length < Math.min(CONFIG.minimumCast, CONFIG.maxParticipants); i++) {
      const id = `bot:${names[i % names.length]}:${i}`
      s.cast.push({
        id,
        name: `Bot: ${names[i % names.length]}`,
        bot: true,
        outfit: botOutfit(id, THEMES[s.theme]),
        pose: hash(id + s.round) % POSES.length
      })
    }
  }

  // Generate 1v1 Duels from the cast
  // An odd cast gets a neutral bot opponent, including when minimum fill is disabled.
  if (s.cast.length % 2) {
    const id = 'bot:Chaos:bye'
    s.cast.push({ id, name: 'Bot: Chaos', bot: true, outfit: botOutfit(id, THEMES[s.theme]), pose: 0 })
  }
  const numDuels = Math.floor(s.cast.length / 2)
  for (let i = 0; i < numDuels; i++) {
    s.duels.push({
      index: i,
      aId: s.cast[i * 2].id,
      bId: s.cast[i * 2 + 1].id,
      winnerId: '',
      votesA: 0,
      votesB: 0
    })
  }

  s.voters = [...members.map((m) => m.playerId), ...s.cast.filter((c) => c.bot).map((c) => c.id)]
  s.phase = 'THEME_REVEAL'
  s.remaining = CONFIG.reveal
}

function settleDuel(s: State) {
  const duel = currentDuel(s)
  if (!duel) return

  let vA = 0
  let vB = 0
  for (const candidateId of Object.values(s.ballots)) {
    if (candidateId === duel.aId) vA++
    if (candidateId === duel.bId) vB++
  }

  duel.votesA = vA
  duel.votesB = vB

  // Winner: higher votes or deterministic hash tie-breaker
  const winnerId =
    vA > vB
      ? duel.aId
      : vB > vA
        ? duel.bId
        : hash(`${s.round}:${duel.aId}`) >= hash(`${s.round}:${duel.bId}`)
          ? duel.aId
          : duel.bId

  duel.winnerId = winnerId

  // Award Duel Win points (+50 SP, GDD Section 19)
  const acc = s.accounts[winnerId] || (s.accounts[winnerId] = account())
  acc.points += CONFIG.duelWin

  s.phase = 'DUEL_RESULT'
  s.remaining = CONFIG.duelResult
}

function settleMatch(s: State, now: number) {
  // Aggregate duel results for all contestants
  s.results = s.cast
    .map((c) => {
      const wins = s.duels.filter((d) => d.winnerId === c.id).length
      let totalVotes = 0
      for (const d of s.duels) {
        if (d.aId === c.id) totalVotes += d.votesA
        if (d.bId === c.id) totalVotes += d.votesB
      }
      return {
        ...c,
        votes: totalVotes,
        duelWins: wins,
        points: 0
      }
    })
    .sort(
      (a, b) =>
        (b.duelWins ?? 0) - (a.duelWins ?? 0) ||
        b.votes - a.votes ||
        hash(`${s.round}:${a.id}`) - hash(`${s.round}:${b.id}`)
    )

  s.results.forEach((r, i) => {
    // 1st place: winnerBonus (100) + participation (10); others: rewards or participation
    const bonus = i === 0 ? CONFIG.winnerBonus : 0
    const finalAward = bonus + CONFIG.participation
    r.points = finalAward + (r.duelWins ?? 0) * CONFIG.duelWin
    const a = s.accounts[r.id] || (s.accounts[r.id] = account())
    a.points += finalAward
    a.participations++
    a.votes += r.votes
    if (i === 0) a.wins++
    recordRanking(a, r.name, i === 0, r.votes, now)
  })

  const w = s.results[0]
  if (w) {
    s.hall.unshift({
      winner: w.id,
      name: w.name,
      theme: THEMES[s.theme].title,
      votes: w.votes,
      timestamp: now,
      outfit: { ...w.outfit, ...(w.outfit.customWearables ? { customWearables: [...w.outfit.customWearables] } : {}) },
      pose: w.pose,
      cosmetics: [...(s.accounts[w.id]?.owned || [])]
    })
  }

  s.hall = s.hall.slice(0, 20)
  s.phase = 'RESULTS'
  s.remaining = CONFIG.results
}

export function step(s: State, members: Member[], dt: number, now: number) {
  // Audience follows live presence; the contestant roster stays fixed until the next round.
  // Accepted ballots remain in place even if their voter leaves.
  if (s.phase !== 'LOBBY' && s.phase !== 'RETURN_TO_LOBBY') {
    s.voters = [...new Set([...members.map((m) => m.playerId), ...s.cast.filter((c) => c.bot).map((c) => c.id)])]
  }
  for (const m of members) {
    if (m.purchase) buy(s, m.playerId, m.purchase)
    if (m.round !== s.round) continue
    const c = s.cast.find((c) => c.id === m.playerId)
    if (c && s.phase === 'PREPARATION' && s.remaining > 1 && validOutfit(m.outfit)) {
      c.outfit = { ...m.outfit }
    }
    if (
      c &&
      Number.isInteger(m.pose) &&
      m.pose >= 0 &&
      (m.pose < POSES.length ||
        (m.pose === 8 && s.accounts[m.playerId]?.owned.includes('superstar')) ||
        (m.pose === 9 && s.accounts[m.playerId]?.owned.includes('royal')))
    ) {
      c.pose = m.pose
    }
    if (m.vote && m.voteDuel !== undefined) vote(s, m.playerId, m.vote, m.round, m.voteDuel)
  }

  s.remaining = Math.max(0, s.remaining - Math.max(0, Math.min(dt, 1)))

  // Ready shortens the wait only after everyone currently competing had time to dress.
  // Keep the final second so clients close their wardrobe before the reveal.
  if (s.phase === 'PREPARATION' && s.remaining <= CONFIG.preparation - CONFIG.minimumPreparation) {
    const contestants = members.filter((m) => s.cast.some((c) => !c.bot && c.id === m.playerId))
    if (contestants.length && contestants.every((m) => m.round === s.round && m.ready)) {
      s.remaining = Math.min(s.remaining, 1)
    }
  }

  // Bot voting during 1v1 duel voting
  if (s.phase === 'VOTING') {
    const duel = currentDuel(s)
    if (duel) {
      for (const bot of s.cast.filter((c) => c.bot && c.id !== duel.aId && c.id !== duel.bId)) {
        if (s.ballots[bot.id]) continue
        const candA = s.cast.find((c) => c.id === duel.aId)!
        const candB = s.cast.find((c) => c.id === duel.bId)!

        const scoreA = botLookScore(candA.outfit, THEMES[s.theme], bot.id, `${s.round}:${bot.id}:${candA.id}`)
        const scoreB = botLookScore(candB.outfit, THEMES[s.theme], bot.id, `${s.round}:${bot.id}:${candB.id}`)

        const chosen = scoreA >= scoreB ? candA.id : candB.id
        vote(s, bot.id, chosen, s.round)
      }
    } else {
      for (const bot of s.cast.filter((c) => c.bot)) {
        const choices = s.cast
          .filter((c) => c.id !== bot.id)
          .map((c) => ({
            id: c.id,
            score: botLookScore(c.outfit, THEMES[s.theme], bot.id, `${s.round}:${bot.id}:${c.id}`)
          }))
          .sort((a, b) => b.score - a.score)
        if (choices[0]) vote(s, bot.id, choices[0].id, s.round)
      }
    }

    // If all eligible voters voted, end duel voting early
    const eligible = s.voters.filter((id) => id !== duel?.aId && id !== duel?.bId)
    if (eligible.length && eligible.every((id) => !!s.ballots[id])) s.remaining = 0
  }

  if (s.remaining > 0) return

  switch (s.phase) {
    case 'LOBBY':
      if (members.length) begin(s, members)
      else s.remaining = CONFIG.lobby
      break

    case 'THEME_REVEAL':
      s.phase = 'PREPARATION'
      s.remaining = CONFIG.preparation
      break

    case 'PREPARATION':
      s.duelIndex = 0
      s.ballots = {}
      s.phase = 'RUNWAY'
      s.remaining = CONFIG.duelIntro + CONFIG.duelPose
      break

    case 'RUNWAY':
      s.phase = 'VOTING'
      s.remaining = CONFIG.duelVoting
      break

    case 'VOTING':
      settleDuel(s)
      break

    case 'DUEL_RESULT':
      if (s.duelIndex + 1 < s.duels.length) {
        // Next 1v1 duel
        s.duelIndex++
        s.ballots = {}
        s.phase = 'RUNWAY'
        s.remaining = CONFIG.duelIntro + CONFIG.duelPose
      } else {
        // All duels completed -> Final results
        settleMatch(s, now)
      }
      break

    case 'RESULTS':
      s.phase = 'RETURN_TO_LOBBY'
      s.remaining = CONFIG.returning
      break

    case 'RETURN_TO_LOBBY':
      s.phase = 'LOBBY'
      s.remaining = CONFIG.lobby
      break
  }
}

export function runwayIndex(s: State): number {
  const duel = currentDuel(s)
  if (!duel) return 0
  return duel.index * 2
}
