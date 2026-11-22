
import api from '../../api/instance'

export type PeriodoAnalise = '24h' | '7d' | '30d'

export interface PontoSerie {
  timestamp: string
  valor: number
  valida?: boolean
}

export interface SeriesResponse {
  estacaoId: string
  grandeza: string
  periodo: PeriodoAnalise
  dados: PontoSerie[]
}

export interface LeituraRecente {
  grandeza: string
  valorCalibrado: number
  unidade: string
  tempoRelativo: string
}

export interface UltimasLeiturasResponse {
  estacaoId: string
  leituras: LeituraRecente[]
}

export interface IqarResponse {
  estacaoId?: string
  indice?: number | string
  classificacao?: string
  status: string
  cor?: string
  rotuloFaixa: string
  mensagem: string
  municipio?: string
}

export async function getSeriesEstacao(
  estacaoId: string,
  grandeza: string,
  periodo: PeriodoAnalise,
): Promise<SeriesResponse> {
  const response = await api.get<SeriesResponse>(
    `/analise/estacoes/${estacaoId}/series`,
    {
      params: {
        grandeza,
        periodo,
      },
    },
  )

  return response.data
}

export async function getUltimasLeituras(
  estacaoId: string,
): Promise<UltimasLeiturasResponse> {
  const response = await api.get<UltimasLeiturasResponse>(
    `/analise/estacoes/${estacaoId}/ultimas-leituras`,
  )

  return response.data
}

export async function getIqar(estacaoId?: string): Promise<IqarResponse> {
  if (estacaoId) {
    const response = await api.get<IqarResponse>('/analise/iqar', {
      params: { estacaoId },
    })
    return response.data
  }

  const response = await api.get<IqarResponse>('/analise/iqar')

  return response.data
}

export async function getIqarEstacao(estacaoId: string): Promise<IqarResponse> {
  const response = await api.get<IqarResponse>(
    `/analise/estacoes/${estacaoId}/iqar`,
  )

  return response.data
}

