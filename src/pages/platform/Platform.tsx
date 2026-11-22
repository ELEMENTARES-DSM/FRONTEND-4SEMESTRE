import { isAxiosError } from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthorization } from "../../auth/useAuthorization";
import { KpiCards } from "../../components/kpiCards/KpiCards";
import { KpiCardsSkeleton } from "../../components/kpiCards/KpiCardsSkeleton";
import { StationsTable } from "../../components/stationsTable/StationsTable";
import {
  getVisaoGeralEstacoes,
  type EstacaoStatus,
  type ResumoEstacoes,
} from "../../services/estacoesService";
import { Button } from "../../shared/components/Button";

const POLLING_MS = 5 * 60 * 1000;

export function Platform() {
  const { papel, canCreateStation, canToggleStation } = useAuthorization();

  const [estacoes, setEstacoes] = useState<EstacaoStatus[]>([]);
  const [resumo, setResumo] = useState<ResumoEstacoes | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);

  const firstLoad = useRef(true);
  const navigate = useNavigate();

  const isAdmin = papel === "ADMINISTRADOR";

  const carregarEstacoes = useCallback(async () => {
    if (firstLoad.current) {
      setLoading(true);
    }

    setErro(null);

    try {
      if (!navigator.onLine) {
        setErro(
          "Sem conexão com a rede. Verifique sua internet e tente novamente.",
        );
        return;
      }

      const data = await getVisaoGeralEstacoes({
        incluirMunicipio: isAdmin,
        incluirIqar: true,
      });

      setEstacoes(data.estacoes);
      setResumo(data.resumo);
    } catch (error) {
      if (
        isAxiosError(error) &&
        (error.response?.status === 403 || error.response?.status === 401)
      ) {
        setErro("Você não possui permissão para visualizar estas estações.");
      } else if (isAxiosError(error) && !error.response) {
        setErro(
          "Sem conexão com a rede. Verifique sua internet e tente novamente.",
        );
      } else {
        setErro(
          "Erro no servidor ao carregar as estações. Tente novamente em instantes.",
        );
      }
    } finally {
      setLoading(false);
      firstLoad.current = false;
    }
  }, [isAdmin]);

  // Carregamento inicial e atualização automática a cada cinco minutos.
  // O setTimeout evita chamar a função que atualiza estados diretamente no efeito.
  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void carregarEstacoes();
    }, 0);

    const timer = window.setInterval(() => {
      void carregarEstacoes();
    }, POLLING_MS);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
    };
  }, [carregarEstacoes, reload]);

  const ativas =
    resumo?.ativas ??
    estacoes.filter((e) => e.status_operacional === "Ativa").length;

  const comFalha =
    resumo?.com_falha ??
    estacoes.filter((e) => e.status_operacional === "Com Falha").length;

  const inativas =
    resumo?.inativas ??
    estacoes.filter((e) => e.status_operacional === "Inativa").length;

  const soma = ativas + comFalha + inativas;
  const total = resumo?.total === soma ? resumo.total : soma;

  return (
    <main className="min-h-screen bg-[#0B1120] p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Visão Geral</h1>

        {canCreateStation && (
          <Button
            onClick={() =>
              navigate("/platform/territory", {
                state: { openNewStationModal: true },
              })
            }
          >
            Nova Estação
          </Button>
        )}
      </header>

      {loading ? (
        <KpiCardsSkeleton />
      ) : erro ? (
        <div
          role="alert"
          className="rounded-lg border border-error/40 bg-error/10 p-4 text-error"
        >
          <p className="mb-3">{erro}</p>

          <Button onClick={() => setReload((prev) => prev + 1)}>
            Tentar novamente
          </Button>
        </div>
      ) : estacoes.length === 0 ? (
        <div className="rounded-lg border border-line bg-base-200 p-6 text-center text-sm text-muted">
          Nenhuma estação encontrada.
        </div>
      ) : (
        <>
          <KpiCards
            total={total}
            ativas={ativas}
            comFalha={comFalha}
            inativas={inativas}
          />

          <div className="mt-6">
            <StationsTable
              estacoes={estacoes}
              isAdmin={isAdmin}
              podeCriar={canCreateStation}
              podeAlterarStatus={canToggleStation}
              onStatusAlterado={carregarEstacoes}
            />
          </div>
        </>
      )}
    </main>
  );
}
