import type { Sensor } from "../../services/sensoresService";
import { Button } from "../../shared/components/Button";
import { Table, type TableColumn } from "../../shared/components/Table";

interface SensorsTableProps {
  sensores: Sensor[];
  updatingIds: string[];
  onToggleStatus: (sensor: Sensor) => void;
  loading?: boolean;
}

export function SensorsTable({ sensores, onToggleStatus, updatingIds, loading = false }: SensorsTableProps) {
  const columns: TableColumn<Sensor>[] = [
    { key: "codigo", header: "Código", className: "font-mono", render: (sensor) => sensor.codigo ?? "—" },
    { key: "nome", header: "Nome", render: (sensor) => sensor.nome ?? "—" },
    { key: "grandeza", header: "Grandeza" },
    { key: "unidade", header: "Unidade de Medida" },
    {
      key: "status",
      header: "Status",
      render: (sensor) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            sensor.status === "Ativo"
              ? "bg-success/15 text-success border border-success/30"
              : "bg-muted/15 text-muted border border-muted/30"
          }`}
        >
          <span
            aria-hidden="true"
            className={`size-1.5 rounded-full ${sensor.status === "Ativo" ? "bg-success" : "bg-muted"}`}
          />
          {sensor.status}
        </span>
      ),
    },
    {
      key: "acao",
      header: "Ação",
      align: "right",
      render: (sensor) => (
        <Button
          variant={sensor.status === "Ativo" ? "danger" : "outline"}
          busy={updatingIds.includes(sensor.id)}
          aria-label={`${sensor.status === "Ativo" ? "Inativar" : "Ativar"} sensor ${sensor.codigo ?? sensor.grandeza}`}
          onClick={() => onToggleStatus(sensor)}
        >
          {updatingIds.includes(sensor.id) ? "Salvando…" : sensor.status === "Ativo" ? "Inativar" : "Ativar"}
        </Button>
      ),
    },
  ];

  return (
    <Table
      aria-label="Sensores associados à estação"
      aria-busy={loading}
      columns={columns}
      data={sensores}
      keyExtractor={(sensor) => sensor.id}
      loading={loading}
      emptyMessage="Nenhum sensor cadastrado nesta estação."
    />
  );
}
