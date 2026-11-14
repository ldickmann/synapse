// Detecção de capacidades no cliente. Sem visual; a página decide o que fazer com o resultado.

export function prefereMovimentoReduzido(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
