import api from '../api/instance'

// Catálogo de grandezas (US-39): GET para todos os perfis; POST, PUT e DELETE só
// para o ADMINISTRADOR. Contrato em services/gestao-estacoes (tipo-sensor.validation.ts).

export const AGREGACOES = [
  { value: 'media', label: 'Média' },
  { value: 'soma', label: 'Soma' },
  { value: 'media_circular', label: 'Média circular (ângulos, ex.: direção do vento)' },
] as const

export type Agregacao = (typeof AGREGACOES)[number]['value']

// NUMERIC chega do banco como texto, com 2 casas.
export interface Grandeza {
  id: string
  nome: string
  unidade: string
  faixa_min: string
  faixa_max: string
  agregacao: Agregacao
}

export interface NovaGrandeza {
  nome: string
  unidade: string
  faixa_min: number
  faixa_max: number
  agregacao: Agregacao
}

// O nome não é alterável pela API.
export type AlteracaoGrandeza = Partial<Omit<NovaGrandeza, 'nome'>>

export async function listarGrandezas(): Promise<Grandeza[]> {
  const response = await api.get<Grandeza[]>('/estacoes/tipos-sensor')
  return response.data
}

export async function criarGrandeza(dados: NovaGrandeza): Promise<Grandeza> {
  const response = await api.post<Grandeza>('/estacoes/tipos-sensor', dados)
  return response.data
}

export async function atualizarGrandeza(id: string, dados: AlteracaoGrandeza): Promise<Grandeza> {
  const response = await api.put<Grandeza>(`/estacoes/tipos-sensor/${id}`, dados)
  return response.data
}

export async function excluirGrandeza(id: string): Promise<void> {
  await api.delete(`/estacoes/tipos-sensor/${id}`)
}
