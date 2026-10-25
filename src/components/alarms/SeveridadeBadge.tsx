import type { SeveridadeAlarme, SituacaoAlarme } from '../../types/alarms'

// A severidade aparece sempre com cor e texto (US-24).
const SEVERIDADES: Record<SeveridadeAlarme, { label: string; classe: string; ponto: string }> = {
  CRITICO: { label: 'Crítico', classe: 'bg-error/15 text-error border-error/30', ponto: 'bg-error' },
  ALERTA: { label: 'Alerta', classe: 'bg-warning/15 text-warning border-warning/30', ponto: 'bg-warning' },
  ATENCAO: { label: 'Atenção', classe: 'bg-info/15 text-info border-info/30', ponto: 'bg-info' },
}

export function SeveridadeBadge({ severidade }: { severidade: SeveridadeAlarme }) {
  const atual = SEVERIDADES[severidade] ?? { label: severidade, classe: 'bg-base-300 text-muted border-line', ponto: 'bg-muted' }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${atual.classe}`}
    >
      <span className={`size-1.5 rounded-full shrink-0 ${atual.ponto}`} aria-hidden="true" />
      {atual.label}
    </span>
  )
}

export function SituacaoBadge({ situacao }: { situacao: SituacaoAlarme }) {
  const aberto = situacao === 'aberto'
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border ${
        aberto ? 'border-error/30 text-error' : 'border-line text-muted'
      }`}
    >
      {aberto ? 'Aberto' : 'Normalizado'}
    </span>
  )
}
