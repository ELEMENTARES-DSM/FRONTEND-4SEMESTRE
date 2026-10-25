import type { Alarme, OperadorAlarme, SeveridadeAlarme } from '../types/alarms'

const ROTULOS_SEVERIDADE: Record<SeveridadeAlarme, string> = {
  CRITICO: 'Crítico',
  ALERTA: 'Alerta',
  ATENCAO: 'Atenção',
}

export function rotuloSeveridade(severidade: SeveridadeAlarme): string {
  return ROTULOS_SEVERIDADE[severidade] ?? severidade
}

export type PeriodoAlarmes = 'hoje' | '7d' | '30d' | 'todos'

export const PERIODOS: { value: PeriodoAlarmes; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: 'todos', label: 'Todo o período' },
]

/** Início e fim do período no fuso do navegador, em ISO 8601 (o backend aceita com fuso). */
export function intervaloDoPeriodo(periodo: PeriodoAlarmes, agora = new Date()): { de?: string; ate?: string } {
  if (periodo === 'todos') return {}

  const inicio = new Date(agora)
  inicio.setHours(0, 0, 0, 0)
  if (periodo === '7d') inicio.setDate(inicio.getDate() - 6)
  if (periodo === '30d') inicio.setDate(inicio.getDate() - 29)

  const fim = new Date(agora)
  fim.setHours(23, 59, 59, 999)

  return { de: inicio.toISOString(), ate: fim.toISOString() }
}

const SIMBOLOS: Record<OperadorAlarme, string> = { '>': '>', '>=': '≥', '<': '<', '<=': '≤', '=': '=' }

const numero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

/** "52,3 µg/m³ ≥ 50 µg/m³": valor medido, operador da regra e limite. */
export function formatarValorLimite(alarme: Pick<Alarme, 'valor' | 'operador' | 'limite' | 'sensor_unidade_medida'>): string {
  const unidade = alarme.sensor_unidade_medida ? ` ${alarme.sensor_unidade_medida}` : ''
  return `${numero.format(alarme.valor)}${unidade} ${SIMBOLOS[alarme.operador] ?? alarme.operador} ${numero.format(alarme.limite)}${unidade}`
}

// As estações são de municípios brasileiros e o e-mail do alarme usa o horário de
// Brasília: a tela mostra o mesmo horário, qualquer que seja o fuso da máquina.
export const FUSO_HORARIO_ALARMES = 'America/Sao_Paulo'

export function formatarDataHora(valor?: string | null): string {
  if (!valor) return '—'
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO_HORARIO_ALARMES,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(data)
}

export function descreverEstacao(alarme: Pick<Alarme, 'estacao_codigo' | 'estacao_nome' | 'estacao_id'>): string {
  if (alarme.estacao_codigo && alarme.estacao_nome) return `${alarme.estacao_codigo} · ${alarme.estacao_nome}`
  return alarme.estacao_codigo ?? alarme.estacao_nome ?? alarme.estacao_id
}

export function descreverSensor(alarme: Pick<Alarme, 'sensor_codigo' | 'sensor_tipo' | 'sensor_id'>): string {
  if (alarme.sensor_codigo && alarme.sensor_tipo) return `${alarme.sensor_codigo} · ${alarme.sensor_tipo}`
  return alarme.sensor_codigo ?? alarme.sensor_tipo ?? alarme.sensor_id
}
