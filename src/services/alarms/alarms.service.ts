import api from '../../api/instance'
import type { Alarme, FiltrosAlarme, ResumoAlarmes } from '../../types/alarms'

export const ALARMES_URL = '/alertas/alarmes'

// Filtro vazio não vai para a query: o backend recusa parâmetro desconhecido.
function semVazios(filtros: FiltrosAlarme): FiltrosAlarme {
  return Object.fromEntries(
    Object.entries(filtros).filter(([, valor]) => valor !== undefined && valor !== ''),
  ) as FiltrosAlarme
}

export async function listarAlarmes(filtros: FiltrosAlarme = {}): Promise<Alarme[]> {
  const response = await api.get<Alarme[]>(ALARMES_URL, { params: semVazios(filtros) })
  return response.data
}

export async function buscarAlarme(id: string): Promise<Alarme> {
  const response = await api.get<Alarme>(`${ALARMES_URL}/${encodeURIComponent(id)}`)
  return response.data
}

export async function buscarResumoAlarmes(): Promise<ResumoAlarmes> {
  const response = await api.get<ResumoAlarmes>(`${ALARMES_URL}/resumo`)
  const resumo = response.data
  if (!resumo || typeof resumo.abertos !== 'object' || typeof resumo.total !== 'number') {
    throw new Error('Resumo de alarmes fora do formato esperado')
  }
  return resumo
}
