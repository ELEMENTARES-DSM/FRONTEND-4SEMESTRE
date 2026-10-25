import { useEffect, useState } from 'react'
import { Icon } from '../../shared/components/Icon'
import { Loading } from '../../shared/components/Loading'
import { buscarAlarme } from '../../services/alarms/alarms.service'
import {
  classificarErroAlarmes,
  MENSAGENS_ERRO_ALARMES,
  type TipoErroAlarmes,
} from '../../services/alarms/alarms.errors'
import type { Alarme } from '../../types/alarms'
import {
  descreverEstacao,
  descreverSensor,
  formatarDataHora,
  formatarValorLimite,
} from '../../utils/alarmes'
import { SeveridadeBadge, SituacaoBadge } from './SeveridadeBadge'

export interface AlarmeDetalheProps {
  alarmeId: string
  onClose: () => void
}

type Resultado =
  | { alarmeId: string; tipo: 'pronto'; alarme: Alarme }
  | { alarmeId: string; tipo: 'erro'; erro: TipoErroAlarmes }

// Painel lateral com o detalhe do alarme, carregado pela rota por id (US-24).
export function AlarmeDetalhe({ alarmeId, onClose }: AlarmeDetalheProps) {
  const [resultado, setResultado] = useState<Resultado | null>(null)

  useEffect(() => {
    let ativo = true
    buscarAlarme(alarmeId)
      .then((alarme) => ativo && setResultado({ alarmeId, tipo: 'pronto', alarme }))
      .catch((erro) => ativo && setResultado({ alarmeId, tipo: 'erro', erro: classificarErroAlarmes(erro) }))
    return () => {
      ativo = false
    }
  }, [alarmeId])

  // Enquanto o resultado é de outro id (ou ainda não chegou), o painel está carregando.
  const estado = resultado?.alarmeId === alarmeId ? resultado : { tipo: 'carregando' as const }

  return (
    <aside
      aria-label="Detalhe do alarme"
      className="w-full lg:w-96 shrink-0 rounded-xl border border-line bg-base-200 p-5 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-base-content">Detalhe do alarme</h2>
        <button
          type="button"
          className="p-1.5 rounded hover:bg-white/5 text-muted"
          onClick={onClose}
          aria-label="Fechar detalhe"
        >
          <Icon name="close" />
        </button>
      </div>

      {estado.tipo === 'carregando' && <Loading size="sm" text="Carregando alarme..." />}

      {estado.tipo === 'erro' && (
        <p role="alert" className="text-sm text-error">
          {MENSAGENS_ERRO_ALARMES[estado.erro]}
        </p>
      )}

      {estado.tipo === 'pronto' && (
        <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted">Severidade</dt>
          <dd><SeveridadeBadge severidade={estado.alarme.severidade} /></dd>
          <dt className="text-muted">Situação</dt>
          <dd><SituacaoBadge situacao={estado.alarme.situacao} /></dd>
          <dt className="text-muted">Leitura</dt>
          <dd>{formatarDataHora(estado.alarme.lido_em)}</dd>
          <dt className="text-muted">Estação</dt>
          <dd>{descreverEstacao(estado.alarme)}</dd>
          <dt className="text-muted">Município</dt>
          <dd>{estado.alarme.municipio}</dd>
          <dt className="text-muted">Sensor</dt>
          <dd>{descreverSensor(estado.alarme)}</dd>
          <dt className="text-muted">Regra</dt>
          <dd>{estado.alarme.regra_nome ?? '—'}</dd>
          <dt className="text-muted">Valor × limite</dt>
          <dd className="font-mono">{formatarValorLimite(estado.alarme)}</dd>
          <dt className="text-muted">Registrado</dt>
          <dd>{formatarDataHora(estado.alarme.criado_em)}</dd>
          <dt className="text-muted">Normalizado</dt>
          <dd>{formatarDataHora(estado.alarme.normalizado_em)}</dd>
        </dl>
      )}
    </aside>
  )
}
