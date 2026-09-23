import instance from "../api/instance";
import { MOCK_REGRAS_ALERTA } from "./mocks/alertsMock";

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

export const alertsService = {
  getRegras: async (): Promise<RegraAlerta[]> => {
    try {
      const response = await instance.get<RegraAlerta[]>("/regras-alerta");
      return response.data;
    } catch (error) {
      console.warn(
        "Backend indisponível. Utilizando dados mockados de fallback:",
        error,
      );
      return MOCK_REGRAS_ALERTA;
    }
  },

  updateStatus: async (id: string, esta_ativa: boolean): Promise<void> => {
    try {
      await instance.patch(`/regras-alerta/${id}/status`, { esta_ativa });
    } catch (error) {
      console.warn("Backend indisponível ao atualizar status:", error);
    }
  },
};
