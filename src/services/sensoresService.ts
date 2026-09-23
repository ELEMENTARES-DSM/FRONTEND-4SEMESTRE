import api from "../api/instance";

export interface Sensor {
  id: string;
  estacao_id: string;
  codigo?: string;
  nome?: string;
  grandeza: string;
  unidade: string;
  fator: number;
  ganho: number;
  status: "Ativo" | "Inativo";
}

export async function getSensoresByEstacao(
  estacaoId: string,
): Promise<Sensor[]> {
  const response = await api.get<SensorResponse[]>(`/estacoes/${estacaoId}/sensores`);

  return response.data.map(toSensor);
}

export async function updateSensorStatus(
  sensorId: string,
  status: "Ativo" | "Inativo",
): Promise<void> {
  await api.patch(`/sensores/${sensorId}/status`, {
    status,
  });
}

export const tiposSensor = {
  Temperatura: "°C",
  "Umidade Relativa": "%",
  "PM2.5": "µg/m³",
  PM10: "µg/m³",
  "Velocidade do Vento": "km/h",
} as const;

export interface NovoSensor {
  codigo: string;
  nome: string;
  tipo: keyof typeof tiposSensor;
  fator: number;
  ganho: number;
}

interface SensorResponse {
  id: string;
  estacao_id: string;
  tipo: string;
  unidade_medida: string;
  fator: string | number;
  ganho: string | number;
  status: Sensor["status"];
  codigo?: string;
  nome?: string;
}

function toSensor(sensor: SensorResponse): Sensor {
  return {
    id: sensor.id, estacao_id: sensor.estacao_id,
    codigo: sensor.codigo, nome: sensor.nome,
    grandeza: sensor.tipo, unidade: sensor.unidade_medida,
    fator: Number(sensor.fator), ganho: Number(sensor.ganho), status: sensor.status,
  };
}

export async function createSensor(estacaoId: string, dados: NovoSensor): Promise<Sensor> {
  const response = await api.post<SensorResponse>(`/estacoes/${estacaoId}/sensores`, dados);
  return toSensor(response.data);
}
