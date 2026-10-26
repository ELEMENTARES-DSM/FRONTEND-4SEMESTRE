import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthorization } from '../../auth/useAuthorization'
import { useAtualizacaoPeriodica } from '../../hooks/useAtualizacaoPeriodica'
import { buscarResumoAlarmes } from '../../services/alarms/alarms.service'
import { SEVERIDADES, type ResumoAlarmes, type SeveridadeAlarme } from '../../types/alarms'
import { rotuloSeveridade } from '../../utils/alarmes'

const CORES: Record<SeveridadeAlarme, string> = {
  CRITICO: 'bg-error/15 text-error border-error/30',
  ALERTA: 'bg-warning/15 text-warning border-warning/30',
  ATENCAO: 'bg-info/15 text-info border-info/30',
}

// O atalho abre a lista com os mesmos alarmes que o indicador conta.
export const LINK_ALARMES_ABERTOS = '/platform/alarmes?situacao=aberto&periodo=todos'

// US-24: alarmes abertos por severidade, no cabeçalho de todas as telas.
export function IndicadorAlarmes() {
  const { hasPermission } = useAuthorization()
  const podeVer = hasPermission('alarms.view')
  const [resumo, setResumo] = useState<ResumoAlarmes | null>(null)
  const [falhou, setFalhou] = useState(false)

  const atualizar = useCallback(() => {
    buscarResumoAlarmes()
      .then((novo) => {
        setResumo(novo)
        setFalhou(false)
      })
      .catch(() => setFalhou(true))
  }, [])

  useEffect(() => {
    if (podeVer) atualizar()
  }, [podeVer, atualizar])

  useAtualizacaoPeriodica(atualizar, undefined, podeVer)

  // Sem a permissão o indicador não aparece nem consulta a rota.
  if (!podeVer) return null

  if (!resumo) {
    return (
      <span className="hidden md:inline text-xs text-muted" title={falhou ? 'Não foi possível consultar os alarmes' : undefined}>
        {falhou ? 'Alarmes indisponíveis' : 'Alarmes…'}
      </span>
    )
  }

  return (
    <Link
      to={LINK_ALARMES_ABERTOS}
      aria-label={`Alarmes abertos: ${resumo.total}`}
      title={falhou ? 'Não foi possível atualizar; mostrando a última contagem' : 'Alarmes abertos por severidade'}
      className="flex items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-white/5"
    >
      <span className="text-xs text-muted">Alarmes abertos</span>
      {resumo.total === 0 ? (
        <span className="rounded border border-line px-2 py-0.5 text-xs text-muted">Nenhum</span>
      ) : (
        SEVERIDADES.filter((s) => resumo.abertos[s] > 0).map((s) => (
          <span key={s} className={`rounded border px-2 py-0.5 text-xs font-semibold ${CORES[s]}`}>
            {rotuloSeveridade(s)} {resumo.abertos[s]}
          </span>
        ))
      )}
    </Link>
  )
}
