'use client'

import { useState, type FocusEvent, type PointerEvent } from 'react'

/** Hover e foco visível levam ao mesmo estado (X2): `ativo` vira `data-ativo`. */
export function useAtivo() {
  const [passando, setPassando] = useState(false)
  const [focado, setFocado] = useState(false)
  return {
    ativo: passando || focado,
    props: {
      onPointerEnter: (e: PointerEvent) => {
        if (e.pointerType === 'mouse') setPassando(true)
      },
      onPointerLeave: () => setPassando(false),
      onFocus: (e: FocusEvent<HTMLElement>) => setFocado(e.currentTarget.matches(':focus-visible')),
      onBlur: () => setFocado(false),
    },
  }
}
