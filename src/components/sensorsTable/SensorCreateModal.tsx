import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { isAxiosError } from "axios";
import { createSensor, tiposSensor, type NovoSensor, type Sensor } from "../../services/sensoresService";
import { Modal } from "../../shared/components/Modal";
import { Input, Select } from "../../shared/components/Field";
import { Button } from "../../shared/components/Button";

interface Props {
  estacaoId: string;
  onClose: () => void;
  onCreated: (sensor: Sensor) => void;
}

export function SensorCreateModal({ estacaoId, onClose, onCreated }: Props) {
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<NovoSensor["tipo"]>("Temperatura");
  const [fator, setFator] = useState("1");
  const [ganho, setGanho] = useState("0");
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const submitting = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setErro(null);
    if (!codigo.trim() || !nome.trim()) {
      setErro("Preencha o código e o nome do sensor.");
      return;
    }
    if (codigo.trim().length > 30 || nome.trim().length > 100) {
      setErro("Use até 30 caracteres no código e 100 no nome.");
      return;
    }
    if ([fator, ganho].some((value) => !value.trim() || !Number.isFinite(Number(value)) || Math.abs(Number(value)) > 999999.999999)) {
      setErro("Informe valores válidos para fator e ganho, entre -999999,999999 e 999999,999999.");
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      const sensor = await createSensor(estacaoId, { codigo: codigo.trim(), nome: nome.trim(), tipo, fator: Number(fator), ganho: Number(ganho) });
      onCreated(sensor);
    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      setErro(status === 409
        ? "Já existe um sensor com este código ou tipo nesta estação. Confira os dados."
        : status === 401
          ? "Sua sessão expirou. Entre novamente para cadastrar o sensor."
          : status === 403
            ? "Você não tem permissão para cadastrar sensores nesta estação."
            : "Não foi possível cadastrar o sensor. Confira os dados e tente novamente.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <Modal title="Adicionar sensor" description="Configure o instrumento associado a esta estação." onClose={onClose} busy={busy}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {erro && <div role="alert" className="rounded-lg border border-error/40 bg-error/10 p-3.5 text-[13px] text-error">{erro}</div>}
        <fieldset disabled={busy} className="space-y-4">
          <Input label="Código" placeholder="TEMP-01" required maxLength={30} value={codigo} onChange={(event) => setCodigo(event.target.value)} />
          <Input label="Nome do sensor" placeholder="Sensor de temperatura do ar" required maxLength={100} value={nome} onChange={(event) => setNome(event.target.value)} />
          <Select label="Tipo de sensor" value={tipo} onChange={(event) => setTipo(event.target.value as NovoSensor["tipo"])} required>
            {Object.keys(tiposSensor).map((value) => <option key={value} value={value}>{value}</option>)}
          </Select>
          <Input label="Unidade de medida" value={tiposSensor[tipo]} readOnly />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Fator" type="number" required min="-999999.999999" max="999999.999999" step="0.000001" value={fator} onChange={(event) => setFator(event.target.value)} />
            <Input label="Ganho" type="number" required min="-999999.999999" max="999999.999999" step="0.000001" value={ganho} onChange={(event) => setGanho(event.target.value)} />
          </div>
          <p className="text-xs text-muted">Para sensores já calibrados, mantenha fator 1 e ganho 0. O sensor será cadastrado como Ativo.</p>
        </fieldset>
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button type="submit" variant="primary" busy={busy}>{busy ? "Salvando…" : "Cadastrar sensor"}</Button>
        </div>
      </form>
    </Modal>
  );
}
