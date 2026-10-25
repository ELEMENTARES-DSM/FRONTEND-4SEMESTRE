import { useEffect, useRef } from 'react'

// US-24: lista e indicador de alarmes se atualizam sozinhos a cada 30 segundos.
export const INTERVALO_ATUALIZACAO_MS = 30_000

/** Chama `atualizar` a cada intervalo enquanto `ativo`; para ao desmontar. */
export function useAtualizacaoPeriodica(
  atualizar: () => void,
  intervaloMs = INTERVALO_ATUALIZACAO_MS,
  ativo = true,
) {
  const ultimo = useRef(atualizar)

  useEffect(() => {
    ultimo.current = atualizar
  }, [atualizar])

  useEffect(() => {
    if (!ativo) return undefined
    const timer = setInterval(() => ultimo.current(), intervaloMs)
    return () => clearInterval(timer)
  }, [ativo, intervaloMs])
}
