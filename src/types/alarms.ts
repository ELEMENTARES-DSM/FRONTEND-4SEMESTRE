export type SeveridadeAlarme = 'ATENCAO' | 'ALERTA' | 'CRITICO'
export type SituacaoAlarme = 'aberto' | 'normalizado'
export type OperadorAlarme = '>' | '>=' | '<' | '<=' | '='

// Mais grave primeiro, como aparecem na tela e no indicador.
export const SEVERIDADES: SeveridadeAlarme[] = ['CRITICO', 'ALERTA', 'ATENCAO']

/** Mesmo JSON de GET /alertas/alarmes (OpenAPI do alertas-notificacoes). */
export interface Alarme {
  id: string
  regra_id: string
  regra_nome: string | null
  sensor_id: string
  sensor_codigo: string | null
  sensor_tipo: string | null
  sensor_unidade_medida: string | null
  estacao_id: string
  estacao_codigo: string | null
  estacao_nome: string | null
  municipio: string
  valor: number
  operador: OperadorAlarme
  limite: number
  severidade: SeveridadeAlarme
  situacao: SituacaoAlarme
  lido_em: string
  criado_em: string
  normalizado_em: string | null
}

/** GET /alertas/alarmes/resumo: alarmes abertos por severidade. */
export interface ResumoAlarmes {
  abertos: Record<SeveridadeAlarme, number>
  total: number
}

/** Filtros aceitos por GET /alertas/alarmes; datas em ISO 8601 com fuso. */
export interface FiltrosAlarme {
  de?: string
  ate?: string
  severidade?: SeveridadeAlarme
  estacao_id?: string
  situacao?: SituacaoAlarme
}
