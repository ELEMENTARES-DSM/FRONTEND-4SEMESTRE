import api from '../api/instance'

export interface EstacaoStatus {
    id: string
    codigo: string
    nome: string
    municipio: string
    status_operacional: 'Ativa' | 'Com Falha' | 'Inativa'
    ultimo_ping: string | null
    minutos_sem_sinal: number | null
}

export async function getEstacoesStatus(): Promise<EstacaoStatus[]> {
    const response = await api.get<EstacaoStatus[]>('/estacoes/status')

    return response.data
}