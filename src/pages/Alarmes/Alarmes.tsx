import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '../../shared/components/Button'
import { Loading } from '../../shared/components/Loading'
import { Table, type TableColumn } from '../../shared/components/Table'
import { AlarmeDetalhe } from '../../components/alarms/AlarmeDetalhe'
import { SeveridadeBadge, SituacaoBadge } from '../../components/alarms/SeveridadeBadge'
import { useAuthorization } from '../../auth/useAuthorization'
import { useAtualizacaoPeriodica } from '../../hooks/useAtualizacaoPeriodica'
import { getEstacoesStatus } from '../../services/estacoesService'
import { listarAlarmes } from '../../services/alarms/alarms.service'
import {
  classificarErroAlarmes,
  MENSAGENS_ERRO_ALARMES,
  type TipoErroAlarmes,
} from '../../services/alarms/alarms.errors'
import { SEVERIDADES, type Alarme, type SeveridadeAlarme, type SituacaoAlarme } from '../../types/alarms'
import {
  PERIODOS,
  descreverEstacao,
  descreverSensor,
  formatarDataHora,
  formatarValorLimite,
  intervaloDoPeriodo,
  rotuloSeveridade,
  type PeriodoAlarmes,
} from '../../utils/alarmes'

type Estado = 'carregando' | 'pronto' | 'erro'

type Resultado =
  | { chave: string; tipo: 'pronto'; alarmes: Alarme[] }
  | { chave: string; tipo: 'erro'; erro: TipoErroAlarmes }

interface OpcaoEstacao {
  id: string
  rotulo: string
}

const PERIODO_PADRAO: PeriodoAlarmes = 'hoje'

function lerPeriodo(valor: string | null): PeriodoAlarmes {
  return PERIODOS.some((p) => p.value === valor) ? (valor as PeriodoAlarmes) : PERIODO_PADRAO
}

const selectClass = 'select select-sm bg-base-300 border-line text-sm w-full'

const colunas: TableColumn<Alarme>[] = [
  { key: 'lido_em', header: 'Data e hora', render: (a) => <span className="font-mono text-xs">{formatarDataHora(a.lido_em)}</span> },
  { key: 'estacao', header: 'Estação', render: (a) => descreverEstacao(a) },
  { key: 'sensor', header: 'Sensor', render: (a) => descreverSensor(a) },
  { key: 'regra', header: 'Regra', render: (a) => a.regra_nome ?? '—' },
  { key: 'valor', header: 'Valor × limite', render: (a) => <span className="font-mono text-xs">{formatarValorLimite(a)}</span> },
  { key: 'severidade', header: 'Severidade', render: (a) => <SeveridadeBadge severidade={a.severidade} /> },
  { key: 'situacao', header: 'Situação', render: (a) => <SituacaoBadge situacao={a.situacao} /> },
]

// US-24: alarmes do município, com filtros que combinam entre si e detalhe no painel lateral.
export function Alarmes() {
  const { alarmeId } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { papel } = useAuthorization()

  const periodo = lerPeriodo(params.get('periodo'))
  const severidade = (params.get('severidade') ?? '') as SeveridadeAlarme | ''
  const estacao = params.get('estacao') ?? ''
  const situacao = (params.get('situacao') ?? '') as SituacaoAlarme | ''

  // Cada combinação de filtros (e cada "tentar de novo") é um pedido: enquanto o
  // resultado na tela for de outro pedido, a lista está carregando.
  const [tentativa, setTentativa] = useState(0)
  const chave = `${periodo}|${severidade}|${estacao}|${situacao}|${tentativa}`
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [avisoAtualizacao, setAvisoAtualizacao] = useState<string | null>(null)
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null)
  const [estacoesCadastradas, setEstacoesCadastradas] = useState<OpcaoEstacao[]>([])
  const pedido = useRef(0)

  const carregar = useCallback(
    (chaveDoPedido: string, silencioso: boolean) => {
      const atual = ++pedido.current
      return listarAlarmes({
        ...intervaloDoPeriodo(periodo),
        severidade: severidade || undefined,
        estacao_id: estacao || undefined,
        situacao: situacao || undefined,
      })
        .then((lista) => {
          if (atual !== pedido.current) return
          setResultado({ chave: chaveDoPedido, tipo: 'pronto', alarmes: lista })
          setAvisoAtualizacao(null)
          setAtualizadoEm(new Date())
        })
        .catch((falha) => {
          if (atual !== pedido.current) return
          const tipo = classificarErroAlarmes(falha)
          if (silencioso) {
            // Na atualização automática a lista atual continua na tela.
            setAvisoAtualizacao(`Não foi possível atualizar agora. ${MENSAGENS_ERRO_ALARMES[tipo]}`)
            return
          }
          setResultado({ chave: chaveDoPedido, tipo: 'erro', erro: tipo })
        })
    },
    [periodo, severidade, estacao, situacao],
  )

  useEffect(() => {
    void carregar(chave, false)
  }, [carregar, chave])

  useAtualizacaoPeriodica(() => void carregar(chave, true))

  const estado: Estado = resultado?.chave === chave ? resultado.tipo : 'carregando'
  const alarmes = useMemo(() => (resultado?.tipo === 'pronto' ? resultado.alarmes : []), [resultado])
  const erro: TipoErroAlarmes | null = resultado?.tipo === 'erro' ? resultado.erro : null

  useEffect(() => {
    getEstacoesStatus()
      .then((lista) => setEstacoesCadastradas(lista.map((e) => ({ id: e.id, rotulo: `${e.codigo} · ${e.nome}` }))))
      .catch(() => setEstacoesCadastradas([]))
  }, [])

  // Estações cadastradas e as que aparecem nos alarmes (por exemplo, inativadas depois).
  const opcoesEstacao = useMemo(() => {
    const porId = new Map(estacoesCadastradas.map((e) => [e.id, e]))
    for (const a of alarmes) {
      if (!porId.has(a.estacao_id)) porId.set(a.estacao_id, { id: a.estacao_id, rotulo: descreverEstacao(a) })
    }
    return [...porId.values()].sort((x, y) => x.rotulo.localeCompare(y.rotulo, 'pt-BR'))
  }, [estacoesCadastradas, alarmes])

  const mudarFiltro = (nome: string, valor: string) => {
    const proximos = new URLSearchParams(params)
    if (valor) proximos.set(nome, valor)
    else proximos.delete(nome)
    setParams(proximos)
  }

  const busca = params.toString() ? `?${params.toString()}` : ''
  const abrirDetalhe = (alarme: Alarme) => navigate(`/platform/alarmes/${alarme.id}${busca}`)
  const fecharDetalhe = () => navigate(`/platform/alarmes${busca}`)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-base-content">Alarmes</h1>
          <p className="text-sm text-muted">
            {papel === 'ADMINISTRADOR' ? 'Alarmes de todos os municípios.' : 'Alarmes das estações do seu município.'}{' '}
            Atualiza a cada 30 segundos
            {atualizadoEm ? ` · última atualização ${atualizadoEm.toLocaleTimeString('pt-BR')}` : ''}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted">
          Período
          <select className={selectClass} value={periodo} onChange={(e) => mudarFiltro('periodo', e.target.value)}>
            {PERIODOS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Severidade
          <select className={selectClass} value={severidade} onChange={(e) => mudarFiltro('severidade', e.target.value)}>
            <option value="">Todas</option>
            {SEVERIDADES.map((s) => (
              <option key={s} value={s}>{rotuloSeveridade(s)}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Estação
          <select className={selectClass} value={estacao} onChange={(e) => mudarFiltro('estacao', e.target.value)}>
            <option value="">Todas</option>
            {opcoesEstacao.map((e) => (
              <option key={e.id} value={e.id}>{e.rotulo}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Situação
          <select className={selectClass} value={situacao} onChange={(e) => mudarFiltro('situacao', e.target.value)}>
            <option value="">Todas</option>
            <option value="aberto">Aberto</option>
            <option value="normalizado">Normalizado</option>
          </select>
        </label>
      </div>

      {avisoAtualizacao && (
        <p role="status" className="text-xs text-warning">{avisoAtualizacao}</p>
      )}

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <div className="flex-1 min-w-0 w-full">
          {estado === 'carregando' && <Loading text="Carregando alarmes..." centered />}

          {estado === 'erro' && erro && (
            <div role="alert" className="rounded-xl border border-error/30 bg-error/10 p-5 flex flex-col gap-3 items-start">
              <p className="text-sm text-error">{MENSAGENS_ERRO_ALARMES[erro]}</p>
              <Button variant="secondary" onClick={() => setTentativa((n) => n + 1)}>Tentar de novo</Button>
            </div>
          )}

          {estado === 'pronto' && (
            <Table<Alarme>
              columns={colunas}
              data={alarmes}
              keyExtractor={(a) => a.id}
              onRowClick={abrirDetalhe}
              emptyMessage="Nenhum alarme no período"
              size="sm"
            />
          )}
        </div>

        {alarmeId && <AlarmeDetalhe alarmeId={alarmeId} onClose={fecharDetalhe} />}
      </div>
    </div>
  )
}
