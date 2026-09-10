export type RankingPeriod = 'day' | 'week' | 'all'
export type RankingStats = { wins: number; votes: number; participations: number }
export type PeriodStats = RankingStats & { key: string }
export type RankingAccount = RankingStats & {
  name?: string
  periods?: { day?: PeriodStats; week?: PeriodStats }
}

// UTC boundaries are identical for every client. Weeks start on Monday.
export function periodKey(period: 'day' | 'week', now: number): string {
  const date = new Date(now)
  date.setUTCHours(0, 0, 0, 0)
  if (period === 'week') date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7)
  return date.toISOString().slice(0, 10)
}

export function recordRanking(account: RankingAccount, name: string, won: boolean, votes: number, now: number) {
  account.name = name
  account.periods ||= {}
  for (const period of ['day', 'week'] as const) {
    const key = periodKey(period, now)
    let stats = account.periods[period]
    if (!stats || stats.key !== key) stats = account.periods[period] = { key, wins: 0, votes: 0, participations: 0 }
    stats.wins += won ? 1 : 0
    stats.votes += votes
    stats.participations++
  }
}

export function ranking(accounts: Record<string, RankingAccount>, period: RankingPeriod, now: number) {
  return Object.entries(accounts).flatMap(([id, account]) => {
    const stats = period === 'all' ? account : account.periods?.[period]
    if (!stats || (period !== 'all' && (stats as PeriodStats).key !== periodKey(period, now)) || !stats.participations) return []
    return [{ id, name: account.name, wins: stats.wins, votes: stats.votes, participations: stats.participations,
      winRate: Math.round(100 * stats.wins / stats.participations) }]
  }).sort((a, b) => b.wins - a.wins || b.votes - a.votes || b.participations - a.participations || a.id.localeCompare(b.id))
}
