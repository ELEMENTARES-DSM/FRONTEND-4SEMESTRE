// Aceita o MAC com ou sem separador (":" ou "-"), em maiúsculas ou minúsculas.
const MAC_SEM_SEPARADOR = /^[0-9a-fA-F]{12}$/
const MAC_COM_SEPARADOR = /^[0-9a-fA-F]{2}([:-])(?:[0-9a-fA-F]{2}\1){4}[0-9a-fA-F]{2}$/

/**
 * Devolve o MAC no formato do cadastro (12 hex minúsculos, sem separador),
 * ou null se o valor não for um MAC. É o mesmo formato do tópico MQTT.
 */
export function normalizarMac(valor: string): string | null {
  const limpo = valor.trim()
  if (!MAC_SEM_SEPARADOR.test(limpo) && !MAC_COM_SEPARADOR.test(limpo)) {
    return null
  }
  return limpo.replace(/[:-]/g, '').toLowerCase()
}
