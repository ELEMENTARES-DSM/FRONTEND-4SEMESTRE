import { useEffect, useState } from 'react'
import { KpiCards } from '../../components/KpiCards/KpiCards'
import { KpiCardsSkeleton } from '../../components/KpiCards/KpiCardsSkeleton'
import {
    getEstacoesStatus,
    type EstacaoStatus,
} from '../../services/estacoesService'

export function Platform() {
    const [estacoes, setEstacoes] = useState<EstacaoStatus[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function carregarEstacoes() {
            try {
                const data = await getEstacoesStatus()
                setEstacoes(data)
            } catch (error) {
                console.error('Erro ao carregar estações:', error)
            } finally {
                setLoading(false)
            }
        }

        carregarEstacoes()
    }, [])

    const total = estacoes.length

    const ativas = estacoes.filter(
        (estacao) => estacao.status_operacional === 'Ativa'
    ).length

    const comFalha = estacoes.filter(
        (estacao) => estacao.status_operacional === 'Com Falha'
    ).length

    const inativas = estacoes.filter(
        (estacao) => estacao.status_operacional === 'Inativa'
    ).length

    return (
        <main className="min-h-screen bg-[#0B1120] p-6">
            {loading ? (
                <KpiCardsSkeleton />
            ) : (
                <KpiCards
                    total={total}
                    ativas={ativas}
                    comFalha={comFalha}
                    inativas={inativas}
                />
            )}
        </main>
    )
}