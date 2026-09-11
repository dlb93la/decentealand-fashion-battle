export type UiTab = 'game' | 'shop' | 'rank'

export const PHASE_NAMES_EN: Record<string, string> = {
  LOBBY: 'LOBBY',
  THEME_REVEAL: 'THEME REVEAL',
  PREPARATION: 'PREPARATION',
  RUNWAY: 'RUNWAY',
  VOTING: 'VOTING',
  DUEL_RESULT: 'DUEL RESULT',
  RESULTS: 'RESULTS',
  RETURN_TO_LOBBY: 'BACK TO LOBBY'
}

export function localizePhase(phase: string): string {
  return PHASE_NAMES_EN[phase] || phase.replace(/_/g, ' ')
}
