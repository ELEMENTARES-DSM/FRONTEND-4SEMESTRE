import api from "../api/instance";

export interface Sensor {
  id: string;
  estacao_id: string;
  codigo: string;
  nome: string;
  grandeza: "TEMPERATURA" | "UMIDADE" | "PRESSAO" | "CHUVA" | "VENTO" | "PM25";
  unidade: string;
  fator: number;
  ganho: number;
  status: "Ativo" | "Inativo";
}

export async function getSensoresByEstacao(
  estacaoId: string,
): Promise<Sensor[]> {
  const response = await api.get<Sensor[]>(`/estacoes/${estacaoId}/sensores`);

  return response.data;
}

export async function updateSensorStatus(
  sensorId: string,
  status: "Ativo" | "Inativo",
): Promise<void> {
  await api.patch(`/sensores/${sensorId}/status`, {
    status,
  });
}
