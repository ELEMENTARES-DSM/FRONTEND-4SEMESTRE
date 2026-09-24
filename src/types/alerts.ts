export type OperadorRelacional = ">" | ">=" | "<" | "<=" | "=";
export type NivelSeveridade = "ATENCAO" | "ALERTA" | "CRITICO";

export interface RegraAlertaPayload {
  sensor_id: string;
  nome: string;
  operador: OperadorRelacional;
  valor_limite: number;
  severidade: NivelSeveridade;
  esta_ativo?: boolean;
}

export interface RegraAlerta {
  id: string;
  sensor_id: string;
  nome?: string;
  valor_limite: number;
  severidade: NivelSeveridade;
  esta_ativo: boolean;
  criado_em?: string;
  operador: OperadorRelacional;
  // Campos EXTRAS necessários para a exibição na Tabela (JOINs do Backend)
  // (Podem vir como opcionais se o backend não fizer o JOIN)
  estacao?: string;
  sensorNome?: string;
  unidadeMedida?: string;
}

export interface EstacaoOption {
  id: string;
  nome: string;
  sensores: {
    id: string;
    nome: string;
    unidadeMedida: string;
  }[];
}
