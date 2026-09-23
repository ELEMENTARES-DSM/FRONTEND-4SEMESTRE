import type { RegraAlerta } from "../alertsService";

export const MOCK_REGRAS_ALERTA: RegraAlerta[] = [
  {
    id: "e8b3a1a0-1234-4567-89ab-cdef01234567",
    nomeRegra: "PM2.5 Crítico — Zona Leste",
    estacao: "EST-SJC-001",
    sensor_id: "sns-01",
    sensorNome: "PM2.5",
    unidadeMedida: "µg/m³",
    operador: ">",
    valor_limite: 150,
    nivel_severidade: "Critico",
    esta_ativa: true,
  },
  {
    id: "f9c4b2b1-9876-5432-10fe-dcba98765432",
    nomeRegra: "Alerta de Umidade Baixa",
    estacao: "EST-SJC-002",
    sensor_id: "sns-02",
    sensorNome: "Umidade",
    unidadeMedida: "%",
    operador: "<",
    valor_limite: 20,
    nivel_severidade: "Alerta",
    esta_ativa: false,
  },
];
