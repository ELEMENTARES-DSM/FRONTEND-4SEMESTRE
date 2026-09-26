import instance from "../api/instance";
import type {
  RegraAlerta,
  RegraAlertaPayload,
  EstacaoOption,
} from "../types/alerts";
import { MOCK_REGRAS_ALERTA, MOCK_ESTACOES } from "./mocks/alertsMock";

let regrasEmMemoria: RegraAlerta[] = [...MOCK_REGRAS_ALERTA];

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

export const alertsService = {
  getRegras: async (): Promise<RegraAlerta[]> => {
    try {
      const response = await instance.get<RegraAlerta[]>("/regras-alerta");
      return response.data;
    } catch (error) {
      console.warn(
        "Backend indisponível. Utilizando dados mockados de fallback.",
        error,
      );
      await delay();
      return [...regrasEmMemoria];
    }
  },

  getEstacoes: async (): Promise<EstacaoOption[]> => {
    try {
      const response = await instance.get<EstacaoOption[]>("/estacoes");
      return response.data;
    } catch (error) {
      console.warn(
        "Backend indisponível. Carregando opções de estações mockadas.",
        error,
      );
      await delay(200);
      return MOCK_ESTACOES;
    }
  },

  updateStatus: async (id: string, esta_ativo: boolean): Promise<void> => {
    try {
      await instance.patch(`/regras-alerta/${id}/status`, { esta_ativo });
    } catch (error) {
      console.warn(
        "Backend indisponível ao atualizar status. Atualizando em memória.",
        error,
      );
      await delay(300);
      regrasEmMemoria = regrasEmMemoria.map((item) =>
        item.id === id ? { ...item, esta_ativo } : item,
      );
    }
  },

  createRegra: async (payload: RegraAlertaPayload): Promise<RegraAlerta> => {
    try {
      const response = await instance.post<RegraAlerta>(
        "/regras-alerta",
        payload,
      );
      return response.data;
    } catch (error) {
      console.warn(
        "Backend indisponível ao criar regra. Salvando em memória.",
        error,
      );
      await delay(400);

      let estacaoNome = "EST-SJC-001";
      let sensorNome = "Sensor";
      let unidadeMedida = "";

      MOCK_ESTACOES.forEach((e) => {
        const foundSensor = e.sensores.find((s) => s.id === payload.sensor_id);
        if (foundSensor) {
          estacaoNome = e.nome;
          sensorNome = foundSensor.nome;
          unidadeMedida = foundSensor.unidadeMedida;
        }
      });

      const novaRegra: RegraAlerta = {
        id: crypto.randomUUID(),
        sensor_id: payload.sensor_id,
        nome: payload.nome,
        operador: payload.operador,
        valor_limite: payload.valor_limite,
        severidade: payload.severidade,
        esta_ativo: payload.esta_ativo ?? true,
        estacao: estacaoNome,
        sensorNome: sensorNome,
        unidadeMedida: unidadeMedida,
        criado_em: new Date().toISOString(),
      };

      regrasEmMemoria = [novaRegra, ...regrasEmMemoria];
      return novaRegra;
    }
  },
};
