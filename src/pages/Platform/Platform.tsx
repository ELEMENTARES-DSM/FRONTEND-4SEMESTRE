import { isAxiosError } from "axios";
import { Button } from "../../shared/components/Button";
import { StationsTable } from "../../components/StationsTable/StationsTable";
import { useEffect, useState } from "react";

import { KpiCards } from "../../components/KpiCards/KpiCards";
import { KpiCardsSkeleton } from "../../components/KpiCards/KpiCardsSkeleton";
import {
  getEstacoesStatus,
  type EstacaoStatus,
} from "../../services/estacoesService";

export function Platform() {
  const [estacoes, setEstacoes] = useState<EstacaoStatus[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function carregarEstacoes() {
      try {
        setLoading(true);
        setErro(null);
        const data = await getEstacoesStatus();

        if (ativo) {
          setEstacoes(data);
        }
      } catch (error) {
        console.error("Erro ao carregar estações:", error);
        if (ativo) setErro(isAxiosError(error) && error.response?.status === 401
          ? "Autenticação necessária. Entre novamente para carregar as estações."
          : "Não foi possível carregar as estações. Verifique a conexão com a API e tente novamente.");
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    }

    carregarEstacoes();

    return () => {
      ativo = false;
    };
  }, [reload]);

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
      {loading ? (
        <KpiCardsSkeleton />
      ) : erro ? (
        <div role="alert" className="rounded-lg border border-error/40 bg-error/10 p-4 text-error">
          <p className="mb-3">{erro}</p>
          <Button onClick={() => setReload((value) => value + 1)}>Tentar novamente</Button>
        </div>
      ) : (
        <>
        <KpiCards
          total={total}
          ativas={ativas}
          comFalha={comFalha}
          inativas={inativas}
        />
        <div className="mt-6"><StationsTable estacoes={estacoes} /></div>
        </>
      )}
    </main>
  );
}
