import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { isAxiosError } from "axios";
import { createSensor, getTiposSensor, type Sensor, type TipoSensor } from "../../services/sensoresService";
import { Modal } from "../../shared/components/Modal";
import { Input, Select } from "../../shared/components/Field";
import { Button } from "../../shared/components/Button";

interface Props {
  estacaoId: string;
  onClose: () => void;
  onCreated: (sensor: Sensor) => void;
}

// A API responde 409 (código ou grandeza repetidos) e 400 (grandeza fora do catálogo)
// com uma mensagem própria; "Dados inválidos" é o envelope genérico da validação.
function mensagemDaApi(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined;
  const message: unknown = error.response?.data?.message;
  return typeof message === "string" && message !== "Dados inválidos" ? message : undefined;
}

export function SensorCreateModal({ estacaoId, onClose, onCreated }: Props) {
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [grandezas, setGrandezas] = useState<TipoSensor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCatalogo, setErroCatalogo] = useState(false);
  const [tipo, setTipo] = useState("");
  const [unidadeLeitura, setUnidadeLeitura] = useState("");
  const [fatorConversao, setFatorConversao] = useState("1");
  const [offset, setOffset] = useState("0");
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // Cada "Tentar de novo" soma 1 e dispara a busca de novo.
  const [tentativa, setTentativa] = useState(0);
  const submitting = useRef(false);

  useEffect(() => {
    let ativo = true;
    getTiposSensor()
      .then((lista) => {
        if (!ativo) return;
        setGrandezas(lista);
        // Mantém a escolha anterior se ela ainda existe; senão, a primeira da lista.
        setTipo((atual) => (lista.some((item) => item.nome === atual) ? atual : (lista[0]?.nome ?? "")));
      })
      .catch(() => {
        if (ativo) setErroCatalogo(true);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  function tentarDeNovo() {
    setErroCatalogo(false);
    setCarregando(true);
    setTentativa((atual) => atual + 1);
  }

  const grandeza = grandezas.find((item) => item.nome === tipo);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || !grandeza) return;
    setErro(null);
    if (!codigo.trim() || !nome.trim()) {
      setErro("Preencha o código e o nome do sensor.");
      return;
    }
    if (codigo.trim().length > 30 || nome.trim().length > 100) {
      setErro("Use até 30 caracteres no código e 100 no nome.");
      return;
    }
    if (unidadeLeitura.trim().length > 20) {
      setErro("Use até 20 caracteres na unidade da leitura.");
      return;
    }
    if ([fatorConversao, offset].some((value) => !value.trim() || !Number.isFinite(Number(value)) || Math.abs(Number(value)) > 999999.999999)) {
      setErro("Informe valores válidos para o fator de conversão e o offset, entre -999999,999999 e 999999,999999.");
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      const sensor = await createSensor(estacaoId, {
        codigo: codigo.trim(),
        nome: nome.trim(),
        tipo: grandeza.nome,
        // Só vai quando preenchida: vazio significa que a placa já envia na unidade da grandeza.
        ...(unidadeLeitura.trim() ? { unidade_leitura: unidadeLeitura.trim() } : {}),
        fator_conversao: Number(fatorConversao),
        offset: Number(offset),
      });
      onCreated(sensor);
    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      const daApi = mensagemDaApi(error);
      setErro(status === 409
        ? daApi ?? "Já existe um sensor com este código ou grandeza nesta estação. Confira os dados."
        : status === 400 && daApi
          ? daApi
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
        {erroCatalogo && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-error/40 bg-error/10 p-3.5 text-[13px] text-error">
            <span>Não foi possível carregar as grandezas. Verifique a conexão e tente novamente.</span>
            <Button onClick={tentarDeNovo} disabled={carregando}>Tentar de novo</Button>
          </div>
        )}
        <fieldset disabled={busy} className="space-y-4">
          <Input label="Código" placeholder="TEMP-01" required maxLength={30} value={codigo} onChange={(event) => setCodigo(event.target.value)} />
          <p className="-mt-2 text-xs text-muted">Use o mesmo código que a placa envia. Ele é único na estação.</p>
          <Input label="Nome do sensor" placeholder="Sensor de temperatura do ar" required maxLength={100} value={nome} onChange={(event) => setNome(event.target.value)} />
          <Select label="Grandeza" value={tipo} onChange={(event) => setTipo(event.target.value)} required disabled={carregando || erroCatalogo || grandezas.length === 0}>
            {carregando && <option value="">Carregando grandezas…</option>}
            {!carregando && grandezas.length === 0 && <option value="">Nenhuma grandeza disponível</option>}
            {grandezas.map((item) => <option key={item.id} value={item.nome}>{item.nome}</option>)}
          </Select>
          <Input label="Unidade de medida" value={grandeza?.unidade ?? ""} readOnly />
          <Input label="Unidade da leitura (opcional)" placeholder="K" maxLength={20} value={unidadeLeitura} onChange={(event) => setUnidadeLeitura(event.target.value)} />
          <p className="-mt-2 text-xs text-muted">Deixe vazio se a placa já envia na unidade da grandeza. É só informativa: a conversão é feita pelo fator e pelo offset (ex.: Kelvin para °C, offset -273,15).</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Fator de conversão" type="number" required min="-999999.999999" max="999999.999999" step="0.000001" value={fatorConversao} onChange={(event) => setFatorConversao(event.target.value)} />
            <Input label="Offset" type="number" required min="-999999.999999" max="999999.999999" step="0.000001" value={offset} onChange={(event) => setOffset(event.target.value)} />
          </div>
          <p className="text-xs text-muted">valor = leitura × fator de conversão + offset. Para sensores já calibrados, mantenha fator 1 e offset 0. O sensor será cadastrado como Ativo.</p>
        </fieldset>
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button type="submit" variant="primary" busy={busy} disabled={carregando || !grandeza}>{busy ? "Salvando…" : "Cadastrar sensor"}</Button>
        </div>
      </form>
    </Modal>
  );
}
