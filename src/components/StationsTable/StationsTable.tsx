import { useEffect, useMemo, useState } from "react";
import type { EstacaoStatus } from "../../services/estacoesService";
import { formatRelativeTime } from "../../utils/formatRelativeTime";
import { Input, Select } from '../../shared/components/Field'
import { Pagination } from '../../shared/components/Pagination'
import { Table, type TableColumn } from '../../shared/components/Table'

interface StationsTableProps {
  estacoes: EstacaoStatus[];
}

export function StationsTable({ estacoes }: StationsTableProps) {
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("Todas");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(6);

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, statusFiltro]);

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

  const totalPaginas = Math.max(1, Math.ceil(estacoesFiltradas.length / itensPorPagina));

  const estacoesPaginadas = useMemo(() => {
    const indiceInicial = (paginaAtual - 1) * itensPorPagina;
    return estacoesFiltradas.slice(indiceInicial, indiceInicial + itensPorPagina);
  }, [estacoesFiltradas, paginaAtual, itensPorPagina]);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  function getBadgeStyles(status: EstacaoStatus["status_operacional"]) {
    switch (status) {
      case "Ativa":
        return {
          container: "bg-success/10 text-success border border-success/30",
          dot: "bg-success",
          label: "Ativa",
        };

      case "Com Falha":
        return {
          container: "bg-error/10 text-error border border-error/30",
          dot: "bg-error animate-pulse",
          label: "Com Falha",
        };

      case "Inativa":
        return {
          container: "bg-neutral/10 text-muted border border-line",
          dot: "bg-neutral",
          label: "Inativa",
        };
    }
  }

  function formatUltimoPing(ultimoPing: string | null) {
    if (!ultimoPing) {
      return "Sem comunicação";
    }

    return new Date(ultimoPing).toLocaleString("pt-BR");
  }

  const columns: TableColumn<EstacaoStatus>[] = [
    {
      key: "codigo",
      header: "Código",
      render: (item) => <span className="font-mono text-sm text-base-content">{item.codigo}</span>,
    },
    {
      key: "nome",
      header: "Nome",
      render: (item) => <span className="text-base-content">{item.nome}</span>,
    },
    {
      key: "ultimo_ping",
      header: "Último Ping Recebido",
      render: (item) => <span className="text-base-content">{formatUltimoPing(item.ultimo_ping)}</span>,
    },
    {
      key: "minutos_sem_sinal",
      header: "Tempo Decorrido",
      render: (item) => <span className="text-base-content">{formatRelativeTime(item.minutos_sem_sinal)}</span>,
    },
    {
      key: "status_operacional",
      header: "Status Operacional",
      render: (item) => {
        const badge = getBadgeStyles(item.status_operacional);

        return (
          <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.container}`}>
            <span className={`size-1.5 rounded-full ${badge.dot}`} />
            {badge.label}
          </span>
        );
      },
    },
  ];

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

      <Table
        columns={columns}
        data={estacoesPaginadas}
        emptyMessage="Nenhuma estação encontrada."
        containerClassName="border-0 rounded-none bg-transparent"
        className="table-zebra"
      />

      <Pagination
        page={paginaAtual}
        pageSize={itensPorPagina}
        total={estacoesFiltradas.length}
        itemLabel="sensores"
        pageSizes={[3, 6, 10]}
        onPage={(page) => setPaginaAtual(page)}
        onPageSize={(size) => {
          setItensPorPagina(size)
          setPaginaAtual(1)
        }}
      />
    </section>
  );
}
