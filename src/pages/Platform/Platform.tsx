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
import { useEffect, useState } from "react";
import { KpiCards } from "../../components/KpiCards/KpiCards";
import { KpiCardsSkeleton } from "../../components/KpiCards/KpiCardsSkeleton";
import { StationsTable } from "../../components/StationsTable/StationsTable";
import { Button } from "../../shared/components/Button";
import { Icon } from "../../shared/components/Icon";

import {
  getEstacoesStatus,
  type EstacaoStatus,
} from "../../services/estacoesService";

export function Platform() {
  const [estacoes, setEstacoes] = useState<EstacaoStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let ativo = true;

    getEstacoesStatus()
      .then((data) => {
        if (ativo) {
          setEstacoes(data);
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar estações:", error);
      })
      .finally(() => {
        if (ativo) {
          setLoading(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, []);

  async function atualizarEstacoes() {
    try {
      setRefreshing(true);

      const data = await getEstacoesStatus();

      setEstacoes(data);
    } catch (error) {
      console.error("Erro ao atualizar estações:", error);
    } finally {
      setRefreshing(false);
    }
  }

  const total = estacoes.length;

  const ativas = estacoes.filter(
    (estacao) => estacao.status_operacional === "Ativa",
  ).length;

  const comFalha = estacoes.filter(
    (estacao) => estacao.status_operacional === "Com Falha",
  ).length;

  const inativas = estacoes.filter(
    (estacao) => estacao.status_operacional === "Inativa",
  ).length;

  return (
    <main className="min-h-screen bg-[#0B1120] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-base-content">
            Monitoramento de Estações
          </h1>

          <p className="mt-1 text-sm text-muted">
            Acompanhe a disponibilidade e comunicação das estações.
          </p>
        </div>

        <Button variant="outline" busy={refreshing} onClick={atualizarEstacoes}>
          {!refreshing && <Icon name="refresh" size={15} />}
          Atualizar
        </Button>
      </div>

      {loading ? (
        <KpiCardsSkeleton />
      ) : (
        <div className="space-y-6">
          <KpiCards
            total={total}
            ativas={ativas}
            comFalha={comFalha}
            inativas={inativas}
          />

          <StationsTable estacoes={estacoes} />
        </div>
      )}
    </main>
  );
}
