import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { EstacaoStatus } from "../../services/estacoesService";
import { Button } from "../../shared/components/Button";
import { Input, Select } from "../../shared/components/Field";
import { formatRelativeTime } from "../../utils/formatRelativeTime";
import { stationsService } from "../../services/stations/stations.service";
import { StationForbiddenError } from "../../services/stations/stations.errors";
import { getIqarBand, IQAR_BANDS } from "../../utils/iqarBands";

interface StationsTableProps {
  estacoes: EstacaoStatus[];
  isAdmin?: boolean;
  podeCriar?: boolean;
  podeAlterarStatus?: boolean;
  onStatusAlterado?: () => Promise<void> | void;
}

export function StationsTable({
  estacoes,
  isAdmin = false,
  podeCriar = false,
  podeAlterarStatus = false,
  onStatusAlterado,
}: StationsTableProps) {
  const navigate = useNavigate();

  const [busca, setBusca] = useState("");
  const [municipioFiltro, setMunicipioFiltro] = useState("Todos");
  const [inativandoId, setInativandoId] = useState<string | null>(null);
  const [erroStatus, setErroStatus] = useState<string | null>(null);

  const temAcoes = podeAlterarStatus;

  const municipiosDisponiveis = useMemo(() => {
    const unicos = new Set(
      estacoes
        .map((e) => e.municipio)
        .filter((m): m is string => Boolean(m && m.trim())),
    );

    return Array.from(unicos).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [estacoes]);

  const estacoesFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return estacoes.filter((estacao) => {
      const correspondeMunicipio =
        !isAdmin ||
        municipioFiltro === "Todos" ||
        estacao.municipio === municipioFiltro;

      const correspondeBusca =
        !termo ||
        estacao.codigo.toLowerCase().includes(termo) ||
        estacao.nome.toLowerCase().includes(termo);

      return correspondeMunicipio && correspondeBusca;
    });
  }, [estacoes, busca, municipioFiltro, isAdmin]);

  function getBadgeClass(status: EstacaoStatus["status_operacional"]) {
    switch (status) {
      case "Ativa":
        return "bg-success/15 text-success border border-success/30";
      case "Com Falha":
        return "bg-error/15 text-error border border-error/30";
      case "Inativa":
        return "bg-muted/15 text-muted border border-muted/30";
    }
  }

  async function handleAlterarStatus(estacao: EstacaoStatus) {
    if (
      !podeAlterarStatus ||
      (estacao.status_operacional === "Inativa" && inativandoId !== null) ||
      inativandoId !== null
    ) {
      return;
    }

    const ativar = estacao.status_operacional === "Inativa";

    setInativandoId(estacao.id);
    setErroStatus(null);

    try {
      await stationsService.updateStationStatus(
        estacao.id,
        ativar,
        ativar ? "Ativa" : "Inativa",
      );

      await onStatusAlterado?.();
    } catch (error) {
      if (error instanceof StationForbiddenError) {
        setErroStatus(error.message);
      } else {
        setErroStatus(
          `Não foi possível ${ativar ? "ativar" : "inativar"} a estação ${estacao.codigo}.`,
        );
      }

      console.error("Erro ao alterar status da estação:", error);
    } finally {
      setInativandoId(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-[#111C38]">
      <div className="flex flex-col gap-4 border-b border-line p-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-100">
              Estações monitoradas
            </h2>

            <span className="rounded-full bg-teal-500/15 px-2.5 py-0.5 text-xs font-semibold text-teal-400">
              {estacoesFiltradas.length} estações
            </span>
          </div>

          <p className="mt-1 text-xs text-muted">
            Atualização automática a cada 5 minutos
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full sm:w-60">
            <Input
              label="Buscar estação"
              placeholder="Nome ou ID"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
            />
          </div>

          {isAdmin && (
            <div className="w-full sm:w-52">
              <Select
                label="Município"
                value={municipioFiltro}
                onChange={(event) => setMunicipioFiltro(event.target.value)}
              >
                <option value="Todos">Todos os municípios</option>

                {municipiosDisponiveis.map((municipio) => (
                  <option key={municipio} value={municipio}>
                    {municipio}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {podeCriar && (
            <Button
              onClick={() =>
                navigate("/platform/territory", {
                  state: { abrirNovaEstacao: true },
                })
              }
            >
              + Nova Estação
            </Button>
          )}
        </div>
      </div>

      {erroStatus && (
        <div
          role="alert"
          className="border-b border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
        >
          {erroStatus}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Estação</th>
              {isAdmin && <th>Município</th>}
              <th>Status</th>
              <th>Último Sinal</th>
              <th>IQAr atual</th>
              {temAcoes && <th className="text-right">Ações</th>}
            </tr>
          </thead>

          <tbody>
            {estacoesFiltradas.length === 0 ? (
              <tr>
                <td
                  colSpan={(isAdmin ? 5 : 4) + (temAcoes ? 1 : 0)}
                  className="py-10 text-center text-muted"
                >
                  Nenhuma estação encontrada.
                </td>
              </tr>
            ) : (
              estacoesFiltradas.map((estacao) => {
                const faixaIqar =
                  typeof estacao.iqar === "number"
                    ? getIqarBand(estacao.iqar)
                    : null;

                return (
                  <tr key={estacao.id} className="hover:bg-white/[0.02]">
                    <td>
                      <Link
                        to={`/platform/dashboard/${estacao.id}`}
                        className="group inline-flex items-center gap-3"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-teal-500/20 bg-teal-500/10 text-teal-400">
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 15 15"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.25"
                            strokeLinecap="round"
                          >
                            <circle cx="7.5" cy="6" r="1.5" />
                            <path d="M4.5 3a4.5 4.5 0 0 0 0 6M10.5 3a4.5 4.5 0 0 1 0 6M7.5 7.5V13M5.5 13h4" />
                          </svg>
                        </span>

                        <span>
                          <span className="block font-medium text-slate-100 group-hover:text-teal-400 group-hover:underline">
                            {estacao.nome}
                          </span>

                          <span className="block font-mono text-[11px] text-muted">
                            {estacao.codigo}
                          </span>
                        </span>
                      </Link>
                    </td>

                    {isAdmin && (
                      <td className="text-slate-300">
                        {estacao.municipio ?? "—"}
                      </td>
                    )}

                    <td>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${getBadgeClass(
                          estacao.status_operacional,
                        )}`}
                      >
                        <span
                          aria-hidden="true"
                          className={`size-1.5 rounded-full ${
                            estacao.status_operacional === "Ativa"
                              ? "bg-success"
                              : estacao.status_operacional === "Com Falha"
                                ? "bg-error"
                                : "bg-muted"
                          }`}
                        />

                        {estacao.status_operacional}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          (estacao.minutos_sem_sinal ?? 0) > 30
                            ? "text-error"
                            : "text-slate-300"
                        }
                      >
                        {formatRelativeTime(estacao.minutos_sem_sinal)}
                      </span>
                    </td>

                    <td>
                      {faixaIqar && typeof estacao.iqar === "number" ? (
                        <div className="inline-flex items-center gap-2">
                          <span
                            className="font-mono text-sm font-semibold"
                            style={{ color: faixaIqar.color }}
                          >
                            {estacao.iqar}
                          </span>

                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                            style={{
                              color: faixaIqar.color,
                              backgroundColor: faixaIqar.bg,
                              border: `1px solid ${faixaIqar.color}44`,
                            }}
                          >
                            <span
                              className="size-1.5 rounded-full"
                              style={{ backgroundColor: faixaIqar.color }}
                            />

                            {faixaIqar.label}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted">Sem leitura</span>
                      )}
                    </td>

                    {temAcoes && (
                      <td className="text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleAlterarStatus(estacao)}
                            disabled={inativandoId !== null}
                            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              estacao.status_operacional === "Inativa"
                                ? "border-success/30 bg-success/10 text-success hover:bg-success/20"
                                : "border-error/30 bg-error/10 text-error hover:bg-error/20"
                            }`}
                          >
                            {inativandoId === estacao.id
                              ? "Atualizando..."
                              : estacao.status_operacional === "Inativa"
                                ? "Ativar"
                                : "Inativar"}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-line px-5 py-3 text-[11px] text-muted">
        <span className="text-[10px] font-semibold uppercase tracking-wider">
          Faixas IQAr:
        </span>

        {IQAR_BANDS.map((band) => (
          <span key={band.key} className="inline-flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: band.color }}
            />
            {band.label} ({band.range})
          </span>
        ))}
      </div>
    </section>
  );
}
