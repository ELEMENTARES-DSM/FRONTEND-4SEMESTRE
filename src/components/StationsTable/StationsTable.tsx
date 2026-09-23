import { useMemo, useState } from "react";
import type { EstacaoStatus } from "../../services/estacoesService";
import { formatRelativeTime } from "../../utils/formatRelativeTime";
import { Input, Select } from '../../shared/components/Field'

interface StationsTableProps {
  estacoes: EstacaoStatus[];
}

export function StationsTable({ estacoes }: StationsTableProps) {
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("Todas");

  const estacoesFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return estacoes.filter((estacao) => {
      const correspondeStatus =
        statusFiltro === "Todas" || estacao.status_operacional === statusFiltro;

      const correspondeBusca =
        estacao.codigo.toLowerCase().includes(termo) ||
        estacao.nome.toLowerCase().includes(termo);

      return correspondeStatus && correspondeBusca;
    });
  }, [estacoes, busca, statusFiltro]);

  function getBadgeClass(status: EstacaoStatus["status_operacional"]) {
    switch (status) {
      case "Ativa":
        return "badge-success";

      case "Com Falha":
        return "badge-error animate-pulse";

      case "Inativa":
        return "badge-neutral";
    }
  }

  function formatUltimoPing(ultimoPing: string | null) {
    if (!ultimoPing) {
      return "Sem comunicação";
    }

    return new Date(ultimoPing).toLocaleString("pt-BR");
  }

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-base-200">
      <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row md:items-end">
        <div className="flex-1">
          <Input
            label="Pesquisar estação"
            placeholder="Código ou nome da estação..."
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />
        </div>

        <div className="w-full md:w-52">
          <Select
            label="Status operacional"
            value={statusFiltro}
            onChange={(event) => setStatusFiltro(event.target.value)}
          >
            <option value="Todas">Todas</option>
            <option value="Ativa">Ativas</option>
            <option value="Com Falha">Com Falha</option>
            <option value="Inativa">Inativas</option>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Último Ping Recebido</th>
              <th>Tempo Decorrido</th>
              <th>Status Operacional</th>
            </tr>
          </thead>

          <tbody>
            {estacoesFiltradas.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-muted">
                  Nenhuma estação encontrada.
                </td>
              </tr>
            ) : (
              estacoesFiltradas.map((estacao) => (
                <tr key={estacao.id}>
                  <td className="font-mono text-sm">{estacao.codigo}</td>

                  <td>{estacao.nome}</td>

                  <td>{formatUltimoPing(estacao.ultimo_ping)}</td>

                  <td>{formatRelativeTime(estacao.minutos_sem_sinal)}</td>

                  <td>
                    <span
                      className={`badge ${getBadgeClass(
                        estacao.status_operacional,
                      )}`}
                    >
                      {estacao.status_operacional}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
