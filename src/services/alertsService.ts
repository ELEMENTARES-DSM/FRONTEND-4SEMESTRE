import instance from "../api/instance";
import type { RegraAlerta } from "../pages/Alerts";
import { MOCK_REGRAS_ALERTA } from "./mocks/alertsMock";

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

  createRegra: async (
    regra: Omit<RegraAlerta, "id">,
  ): Promise<RegraAlerta> => {
    try {
      const response = await instance.post<RegraAlerta>("/regras-alerta", regra);
      return response.data;
    } catch (error) {
      console.warn("Backend indisponível ao criar regra:", error);
      throw error;
    }
  },
};
