import instance from "../api/instance";
import type {
  RegraAlerta,
  RegraAlertaPayload,
  EstacaoOption,
} from "../types/alerts";

interface RegraAlertaBackend {
  id: string;
  nome: string;
  sensor_id: string;
  sensor_tipo: string;
  sensor_unidade_medida: string;
  estacao_id: string;
  estacao_codigo: string;
  estacao_nome: string;
  municipio: string;
  operador: ">" | ">=" | "<" | "<=" | "=";
  valor_limite: number;
  severidade: "ATENCAO" | "ALERTA" | "CRITICO";
  esta_ativo: boolean;
  criado_em: string;
}

export const alertsService = {
  getRegras: async (): Promise<RegraAlerta[]> => {
    const response = await instance.get<RegraAlertaBackend[]>("/alertas/regras-alerta");

    return response.data.map((item) => ({
      id: item.id,
      nome: item.nome,
      sensor_id: item.sensor_id,
      estacao: item.estacao_codigo ? `${item.estacao_codigo} (${item.estacao_nome})` : item.estacao_id,
      sensorNome: item.sensor_tipo,
      unidadeMedida: item.sensor_unidade_medida,
      operador: item.operador,
      valor_limite: item.valor_limite,
      severidade: item.severidade,
      esta_ativo: item.esta_ativo,
      criado_em: item.criado_em,
    }));
  },

  getEstacoes: async (): Promise<EstacaoOption[]> => {
    // 1. Procura as estações
    const responseEstacoes = await instance.get<Array<{ id: string; codigo: string; nome: string }>>("/estacoes");
    const estacoes = responseEstacoes.data;

    // 2. Procura os sensores para cada estação em paralelo
    const estacoesComSensores = await Promise.all(
      estacoes.map(async (estacao) => {
        const nomeFormatado = estacao.codigo && estacao.nome 
          ? `${estacao.codigo} (${estacao.nome})` 
          : estacao.nome || estacao.codigo || "Estação sem nome";

        try {
          const responseSensores = await instance.get<Array<{ id: string; tipo: string; unidade_medida: string }>>(
            `/estacoes/estacoes/${estacao.id}/sensores`
          );

          return {
            id: estacao.id,
            nome: nomeFormatado,
            sensores: responseSensores.data.map((sensor) => ({
              id: sensor.id,
              nome: sensor.tipo,
              unidadeMedida: sensor.unidade_medida,
            })),
          };
        } catch (error) {
          console.error(`[alertsService] Erro ao carregar sensores da estação ${estacao.id}:`, error);
          return {
            id: estacao.id,
            nome: nomeFormatado,
            sensores: [],
          };
        }
      })
    );

    return estacoesComSensores;
  },

  updateStatus: async (id: string, esta_ativo: boolean): Promise<void> => {
    // Mapeia o boolean para a string exata que a API exige ("Ativa" | "Inativa")
    const status = esta_ativo ? "Ativa" : "Inativa";
    await instance.patch(`/alertas/regras-alerta/${id}/status`, { status });
  },

  createRegra: async (payload: RegraAlertaPayload): Promise<RegraAlerta> => {
    const response = await instance.post<RegraAlertaBackend>(
      "/alertas/regras-alerta",
      payload
    );

    const item = response.data;
    return {
      id: item.id,
      nome: item.nome,
      sensor_id: item.sensor_id,
      estacao: item.estacao_codigo || "Estação",
      sensorNome: item.sensor_tipo || "Sensor",
      unidadeMedida: item.sensor_unidade_medida || "",
      operador: item.operador,
      valor_limite: item.valor_limite,
      severidade: item.severidade,
      esta_ativo: item.esta_ativo,
      criado_em: item.criado_em,
    };
  },
};