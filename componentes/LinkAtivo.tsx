'use client'

import type { ComponentProps } from 'react'
import { useAtivo } from './ativo'

/**
 * Link com efeito para um componente de servidor, como a AssinaturaEncaixe: hover e foco levam ao mesmo
 * `data-ativo` (X2), e só este link hidrata.
 */
export function LinkAtivo(props: ComponentProps<'a'>) {
  const { ativo, props: eventos } = useAtivo()
  return <a {...props} data-efeito="" data-ativo={ativo ? 'true' : 'false'} {...eventos} />
}
