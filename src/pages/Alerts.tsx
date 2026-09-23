import React, { useEffect, useState, useMemo } from "react";
import { Table, type TableColumn } from "../shared/components/Table";
import { SearchInput } from "../shared/components/SearchInput";
import { Filter } from "../shared/components/Filter";
import { Toggle } from "../shared/components/Toggle";
import { Modal } from "../shared/components/Modal";
import { Icon } from "../shared/components/Icon";
import { alertsService } from "../services/alertsService";

export type NivelSeveridade = "Informativo" | "Alerta" | "Critico" | "Atençao";

export interface RegraAlerta {
  id: string;
  nomeRegra?: string;
  estacao: string;
  sensor_id: string;
  sensorNome: string;
  unidadeMedida?: string;
  operador: ">" | "<" | ">=" | "<=" | "=";
  valor_limite: number;
  nivel_severidade: NivelSeveridade;
  canal_notificacao?: "Painel" | "Email" | "SMS";
  esta_ativa: boolean;
  criado_em?: string;
}

export function Alerts() {
  const [regras, setRegras] = useState<RegraAlerta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeveridade, setSelectedSeveridade] = useState<string>("");

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      const data = await alertsService.getRegras();
      if (isMounted) {
        setRegras(data);
        setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleStatus = async (id: string, statusAtual: boolean) => {
    const novoStatus = !statusAtual;

    setBusyIds((prev) => ({ ...prev, [id]: true }));

    setRegras((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, esta_ativa: novoStatus } : item,
      ),
    );

    try {
      await alertsService.updateStatus(id, novoStatus);
    } catch (error) {
      console.error("Erro na operação:", error);
      setRegras((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, esta_ativa: statusAtual } : item,
        ),
      );
    } finally {
      setBusyIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  const renderBadgeSeveridade = (severidade: NivelSeveridade) => {
    const sev = severidade?.toLowerCase();

    if (sev === "critico" || sev === "crítico") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950/50 text-red-400 border border-red-800/60">
          <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
          Crítico
        </span>
      );
    }
    if (sev === "alerta") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-950/50 text-orange-400 border border-orange-800/60">
          <span className="size-1.5 rounded-full bg-orange-500" />
          Alerta
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-950/50 text-yellow-400 border border-yellow-800/60">
        <span className="size-1.5 rounded-full bg-yellow-500" />
        Atenção
      </span>
    );
  };

  const columns: TableColumn<RegraAlerta>[] = [
    {
      key: "nomeRegra",
      header: "Nome da Regra",
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-semibold text-base-content">
            {item.nomeRegra || `${item.sensorNome} Limite`}
          </div>
          <div className="text-xs text-primary font-mono tracking-wide">
            {item.id.substring(0, 8)}
          </div>
        </div>
      ),
    },
    {
      key: "estacao",
      header: "Estação",
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs text-muted">
          {item.estacao || "EST-SJC-001"}
        </span>
      ),
    },
    {
      key: "sensorNome",
      header: "Sensor / Grandeza",
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-medium text-base-content">
            {item.sensorNome}
          </span>{" "}
          {item.unidadeMedida && (
            <span className="text-xs text-muted">({item.unidadeMedida})</span>
          )}
        </div>
      ),
    },
    {
      key: "valor_limite",
      header: "Condição",
      render: (item) => (
        <span className="inline-block font-mono bg-base-300 border border-line text-primary px-2.5 py-1 rounded text-xs font-semibold">
          {item.operador} {item.valor_limite} {item.unidadeMedida || ""}
        </span>
      ),
    },
    {
      key: "nivel_severidade",
      header: "Severidade",
      sortable: true,
      render: (item) => renderBadgeSeveridade(item.nivel_severidade),
    },
    {
      key: "esta_ativa",
      header: "Status",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <Toggle
            checked={item.esta_ativa}
            busy={!!busyIds[item.id]}
            label={`Alternar status da regra ${item.nomeRegra}`}
            onChange={() => handleToggleStatus(item.id, item.esta_ativa)}
          />
          <span
            className={`text-xs font-medium ${
              item.esta_ativa ? "text-emerald-400" : "text-muted"
            }`}
          >
            {item.esta_ativa ? "Ativa" : "Inativa"}
          </span>
        </div>
      ),
    },
  ];

  const filteredData = useMemo(() => {
    return regras.filter((item) => {
      const matchSearch =
        searchTerm === "" ||
        item.nomeRegra?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.estacao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sensorNome?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchSeveridade =
        selectedSeveridade === "" ||
        item.nivel_severidade.toLowerCase() ===
          selectedSeveridade.toLowerCase();

      return matchSearch && matchSeveridade;
    });
  }, [regras, searchTerm, selectedSeveridade]);

  const regrasAtivasCount = useMemo(
    () => regras.filter((r) => r.esta_ativa).length,
    [regras],
  );

  return (
    <div className="min-h-screen bg-[#0B1120] text-base-content p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Regras de Alerta
          </h1>
          <p className="text-xs text-muted mt-1">
            {regras.length} regras cadastradas · {regrasAtivasCount} ativas
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary bg-primary hover:bg-primary/90 text-primary-content border-none font-medium normal-case gap-2 shadow-lg shadow-primary/20 rounded-lg px-4"
        >
          <Icon name="plus" size={18} />
          Nova Regra de Alerta
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="max-w-md w-full">
          <SearchInput
            placeholder="Buscar por nome, estação ou sensor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm("")}
            size="md"
          />
        </div>

        <Filter
          type="radio"
          value={selectedSeveridade}
          onChange={(val) => setSelectedSeveridade(val as string)}
          options={[
            { label: "Todas", value: "" },
            { label: "Críticas", value: "Critico" },
            { label: "Alerta", value: "Alerta" },
            { label: "Atenção", value: "Atencao" },
          ]}
          showReset={false}
          size="sm"
        />
      </div>

      <Table<RegraAlerta>
        columns={columns}
        data={filteredData}
        loading={loading}
        keyExtractor={(item) => item.id}
        emptyMessage="Nenhuma regra de alerta encontrada"
      />

      {isModalOpen && (
        <Modal
          title="Nova Regra de Alerta"
          description="Cadastre um novo limiar numérico associado a um sensor."
          onClose={() => setIsModalOpen(false)}
        >
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted">
              Formulário de cadastro em desenvolvimento...
            </p>
            <div className="flex justify-end gap-2 pt-4 border-t border-line">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-sm btn-ghost text-muted hover:text-base-content"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-sm btn-primary"
              >
                Salvar Regra
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
