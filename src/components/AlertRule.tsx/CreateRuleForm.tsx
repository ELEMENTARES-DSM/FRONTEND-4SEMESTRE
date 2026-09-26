import React, { useState } from "react";
import { Input, Select } from "../../shared/components/Field";
import { Button } from "../../shared/components/Button";
import { Icon } from "../../shared/components/Icon";
import type {
  EstacaoOption,
  OperadorRelacional,
  NivelSeveridade,
  RegraAlertaPayload,
} from "../../types/alerts";

interface CreateRuleFormProps {
  estacoes: EstacaoOption[];
  onCancel: () => void;
  onSubmit: (payload: RegraAlertaPayload) => Promise<void>;
}

export function CreateRuleForm({
  estacoes,
  onCancel,
  onSubmit,
}: CreateRuleFormProps) {
  const [nome, setNome] = useState("");
  const [estacaoId, setEstacaoId] = useState("");
  const [sensorId, setSensorId] = useState("");
  const [operador, setOperador] = useState<OperadorRelacional>(">=");
  const [valorLimite, setValorLimite] = useState("");
  const [severidade, setSeveridade] = useState<NivelSeveridade>("ATENCAO");
  const [submitting, setSubmitting] = useState(false);

  const estacaoSelecionada = estacoes.find((e) => e.id === estacaoId);
  const sensorSelecionado = estacaoSelecionada?.sensores.find(
    (s) => s.id === sensorId,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sensorId || !nome || !valorLimite) return;

    try {
      setSubmitting(true);
      await onSubmit({
        sensor_id: sensorId,
        nome,
        operador,
        valor_limite: Number(valorLimite),
        severidade,
        esta_ativo: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <Input
        label="Nome da Regra"
        placeholder="Ex: Risco de Alagamento - Chuva Intensa"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        required
      />

      <Select
        label="Estação"
        value={estacaoId}
        onChange={(e) => {
          setEstacaoId(e.target.value);
          setSensorId("");
        }}
        required
      >
        <option value="" disabled>
          Selecione uma estação...
        </option>
        {estacoes.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nome}
          </option>
        ))}
      </Select>

      <Select
        label="Sensor / Grandeza"
        value={sensorId}
        disabled={!estacaoId}
        onChange={(e) => setSensorId(e.target.value)}
        required
      >
        <option value="" disabled>
          {!estacaoId
            ? "Selecione uma estação primeiro..."
            : "Selecione um sensor..."}
        </option>
        {estacaoSelecionada?.sensores.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nome} {s.unidadeMedida ? `(${s.unidadeMedida})` : ""}
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          label="Operador"
          value={operador}
          onChange={(e) => setOperador(e.target.value as OperadorRelacional)}
        >
          <option value=">=">&ge; maior ou igual a</option>
          <option value=">">&gt; maior que</option>
          <option value="<=">&le; menor ou igual a</option>
          <option value="<">&lt; menor que</option>
          <option value="=">= igual a</option>
        </Select>

        <Input
          label="Valor Limite"
          type="number"
          step="0.01"
          placeholder="Ex: 25"
          value={valorLimite}
          onChange={(e) => setValorLimite(e.target.value)}
          required
        />
      </div>

      {sensorSelecionado && valorLimite && (
        <div className="rounded-lg border border-line bg-base-200/50 p-2.5 text-xs text-muted">
          DISPARA quando{" "}
          <strong className="text-primary font-mono">
            {sensorSelecionado.nome} {operador} {valorLimite}{" "}
            {sensorSelecionado.unidadeMedida}
          </strong>
        </div>
      )}

      <div className="min-w-0">
        <label className="mb-1.5 block text-xs font-semibold tracking-wide text-muted">
          Nível de Severidade
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setSeveridade("ATENCAO")}
            className={`rounded-lg border py-2 text-xs font-semibold transition ${
              severidade === "ATENCAO"
                ? "border-yellow-500/80 bg-yellow-500/10 text-yellow-400 shadow-[0_0_0_1px_rgba(234,179,8,0.3)]"
                : "border-line bg-base-300 text-muted hover:border-line-hover hover:text-base-content"
            }`}
          >
            Atenção
          </button>

          <button
            type="button"
            onClick={() => setSeveridade("ALERTA")}
            className={`rounded-lg border py-2 text-xs font-semibold transition ${
              severidade === "ALERTA"
                ? "border-orange-500/80 bg-orange-500/10 text-orange-400 shadow-[0_0_0_1px_rgba(249,115,22,0.3)]"
                : "border-line bg-base-300 text-muted hover:border-line-hover hover:text-base-content"
            }`}
          >
            Alerta
          </button>

          <button
            type="button"
            onClick={() => setSeveridade("CRITICO")}
            className={`rounded-lg border py-2 text-xs font-semibold transition ${
              severidade === "CRITICO"
                ? "border-red-500/80 bg-red-500/10 text-red-400 shadow-[0_0_0_1px_rgba(239,68,68,0.3)]"
                : "border-line bg-base-300 text-muted hover:border-line-hover hover:text-base-content"
            }`}
          >
            Crítico
          </button>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="secondary" onClick={onCancel} type="button">
          Cancelar
        </Button>
        <Button variant="primary" busy={submitting} type="submit">
          <Icon name="check" size={14} />
          Salvar Regra
        </Button>
      </div>
    </form>
  );
}
