// Detecção de capacidades no cliente. Sem visual; cada estilo decide o que fazer com o resultado.

export type NivelDoAparelho = 'baixo' | 'normal'

let webgl2EmCache: boolean | null = null

export function temWebGL2(): boolean {
  if (typeof document === 'undefined') return false
  if (webgl2EmCache !== null) return webgl2EmCache
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    webgl2EmCache = gl !== null
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    webgl2EmCache = false
  }
  return webgl2EmCache
}

export function prefereMovimentoReduzido(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function nivelDoAparelho(): NivelDoAparelho {
  if (typeof navigator === 'undefined') return 'baixo'
  const nucleos = navigator.hardwareConcurrency ?? 8
  const memoria = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  if (nucleos <= 4) return 'baixo'
  if (memoria !== undefined && memoria <= 2) return 'baixo'
  if (!temWebGL2()) return 'baixo'
  return 'normal'
}

export function usaToque(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(pointer: coarse)').matches
}
