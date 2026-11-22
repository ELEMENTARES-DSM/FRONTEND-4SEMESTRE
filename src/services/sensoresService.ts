import api from "../api/instance";

export interface Sensor {
  id: string;
  estacao_id: string;
  codigo?: string;
  nome?: string;
  grandeza: string;
  unidade: string;
  // Unidade em que a placa envia (ex.: K). Só informa: quem converte são o fator e o offset.
  unidade_leitura?: string | null;
  // valor = leitura × fator_conversao + offset
  fator_conversao: number;
  offset: number;
  status: "Ativo" | "Inativo";
}

export async function getSensoresByEstacao(
  estacaoId: string,
): Promise<Sensor[]> {
  const response = await api.get<SensorResponse[]>(`/estacoes/estacoes/${estacaoId}/sensores`);

  return response.data.map(toSensor);
}

export async function updateSensorStatus(
  sensorId: string,
  status: "Ativo" | "Inativo",
): Promise<void> {
  await api.patch(`/estacoes/sensores/${sensorId}/status`, {
    status,
  });
}

/** Grandeza do catálogo (GET /estacoes/tipos-sensor), mantido pelo Administrador. */
export interface TipoSensor {
  id: string;
  nome: string;
  unidade: string;
  // NUMERIC chega como texto.
  faixa_min: string;
  faixa_max: string;
  agregacao: "media" | "soma" | "media_circular";
}

export async function getTiposSensor(): Promise<TipoSensor[]> {
  const response = await api.get<TipoSensor[]>("/estacoes/tipos-sensor");
  return response.data;
}

/** Código que a estação enviou e que ainda não tem sensor cadastrado nela. */
export interface SensorDetectado {
  codigo: string;
  // Leituras desse código nos últimos 7 dias.
  total: number;
  ultimo_valor: number | null;
  // ISO 8601 (UTC).
  ultima_leitura_em: string;
}

/**
 * Códigos que a estação mandou e ainda não viraram sensor. O Administrador escolhe
 * um deles no cadastro em vez de digitar, e o código cadastrado é cópia do que a
 * placa envia. Não cria nada.
 */
export async function getSensoresDetectados(estacaoId: string): Promise<SensorDetectado[]> {
  const response = await api.get<SensorDetectado[]>(`/estacoes/estacoes/${estacaoId}/sensores/detectados`);
  return response.data;
}

export interface NovoSensor {
  codigo: string;
  nome: string;
  // Nome de uma grandeza do catálogo.
  tipo: string;
  // Só vai no corpo quando preenchida.
  unidade_leitura?: string;
  fator_conversao: number;
  offset: number;
}

interface SensorResponse {
  id: string;
  estacao_id: string;
  tipo: string;
  unidade_medida: string;
  unidade_leitura?: string | null;
  fator_conversao: string | number;
  offset: string | number;
  status: Sensor["status"];
  codigo?: string;
  nome?: string;
}

function toSensor(sensor: SensorResponse): Sensor {
  return {
    id: sensor.id, estacao_id: sensor.estacao_id,
    codigo: sensor.codigo, nome: sensor.nome,
    grandeza: sensor.tipo, unidade: sensor.unidade_medida,
    unidade_leitura: sensor.unidade_leitura ?? null,
    fator_conversao: Number(sensor.fator_conversao), offset: Number(sensor.offset), status: sensor.status,
  };
}

export async function createSensor(estacaoId: string, dados: NovoSensor): Promise<Sensor> {
  const response = await api.post<SensorResponse>(`/estacoes/estacoes/${estacaoId}/sensores`, dados);
  return toSensor(response.data);
}
