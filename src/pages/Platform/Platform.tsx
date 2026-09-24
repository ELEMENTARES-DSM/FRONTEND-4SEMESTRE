import { useEffect, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { Button } from "../../shared/components/Button";

import { KpiCards } from "../../components/KpiCards/KpiCards";
import { KpiCardsSkeleton } from "../../components/KpiCards/KpiCardsSkeleton";
import {
  getEstacoesStatus,
  type EstacaoStatus,
} from "../../services/estacoesService";

export function Platform() {
  const { usuario, logout } = useAuth();
  const [estacoes, setEstacoes] = useState<EstacaoStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarEstacoes() {
      try {
        const data = await getEstacoesStatus();

        if (ativo) {
          setEstacoes(data);
        }
      } catch (error) {
        console.error("Erro ao carregar estações:", error);
        if (ativo) setErro(true);
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
  }, []);

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
      <header className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Plataforma</h1>
        {usuario && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">{usuario.nome}</span>
            <Button onClick={() => void logout()}>Sair</Button>
          </div>
        )}
      </header>
      {erro && <p role="alert" className="mb-4 text-sm text-error">
        Não foi possível carregar as estações. Confira a conexão com a API.
      </p>}
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
  );
}
