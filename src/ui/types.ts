export type UiTab = 'game' | 'shop' | 'rank'

export const PHASE_NAMES_PT: Record<string, string> = {
  LOBBY: 'SALA DE ESPERA',
  THEME_REVEAL: 'REVELAÇÃO DO TEMA',
  PREPARATION: 'PREPARAÇÃO',
  RUNWAY: 'PASSARELA',
  VOTING: 'VOTAÇÃO',
  DUEL_RESULT: 'DUELO ENCERRADO',
  RESULTS: 'RESULTADOS',
  RETURN_TO_LOBBY: 'RETORNO AO LOBBY'
}

export function localizePhase(phase: string): string {
  return PHASE_NAMES_PT[phase] || phase.replace(/_/g, ' ')
}
