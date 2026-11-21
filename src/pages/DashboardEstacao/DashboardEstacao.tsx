import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Chart from '../../components/chart/Chart'
import { useAtualizacaoPeriodica } from '../../hooks/useAtualizacaoPeriodica'
import {
  getIqar,
  getSeriesEstacao,
  getUltimasLeituras,
  type IqarResponse,
  type LeituraRecente,
  type PontoSerie,
} from '../../services/analise/analise.service'
import { getEstacoesStatus, type EstacaoStatus } from '../../services/estacoesService'
import { listarGrandezas, type Grandeza } from '../../services/tiposSensorService'
import { Button } from '../../shared/components/Button'
import { Loading } from '../../shared/components/Loading'
import {
  classificarErroDashboard,
  filtrarPontosValidos,
  formatarHorarioBrasilia,
  formatarNomeGrandeza,
  formatarNumero,
  formatarRotuloVisualGrandeza,
  GRANDEZAS_PADRAO,
  INTERVALO_POLLING_DASHBOARD_MS,
  lerPeriodoUrl,
  MENSAGENS_ERRO_DASHBOARD,
  normalizarChaveGrandeza,
  obterUnidadeGrandeza,
  PERIODOS_DASHBOARD,
  resolverExibicaoIqar,
  SEGMENTOS_BARRA_IQAR,
  type TipoErroDashboard,
} from './dashboardEstacao.utils'

type EstadoDashboard = 'carregando' | 'pronto' | 'erro'

type ResultadoDashboard =
  | {
      chave: string
      tipo: 'pronto'
      pontosSerie: PontoSerie[]
      leituras: LeituraRecente[]
      iqar: IqarResponse | null
      atualizadoEm: string
    }
  | {
      chave: string
      tipo: 'erro'
      erro: TipoErroDashboard
    }

function IconeGrandeza({ grandeza }: { grandeza: string }) {
  const chave = normalizarChaveGrandeza(grandeza)

  if (chave === 'PM25') {
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-md bg-sky-500/15 text-sky-400">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="8" cy="8" r="2" />
          <circle cx="16" cy="10" r="1.5" />
          <circle cx="11" cy="16" r="2.2" />
          <circle cx="17" cy="17" r="1.2" />
        </svg>
      </span>
    )
  }

  if (chave === 'PM10') {
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="9" r="3" />
          <circle cx="16" cy="15" r="2.5" />
          <circle cx="16" cy="7" r="1.5" />
        </svg>
      </span>
    )
  }

  if (chave === 'NO2') {
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-md bg-amber-500/15 text-amber-400">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2v7.31L4.72 18.55A2 2 0 0 0 6.46 21h11.08a2 2 0 0 0 1.74-2.45L14 9.31V2" />
          <path d="M8.5 2h7" />
        </svg>
      </span>
    )
  }

  if (chave === 'O3') {
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-md bg-cyan-500/15 text-cyan-400">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="7" r="2.5" />
          <circle cx="7" cy="16" r="2.5" />
          <circle cx="17" cy="16" r="2.5" />
        </svg>
      </span>
    )
  }

  if (chave === 'CO') {
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-md bg-orange-500/15 text-orange-400">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M2 10c3-3 6 3 9 0s6-3 9 0" />
          <path d="M2 16c3-3 6 3 9 0s6-3 9 0" />
        </svg>
      </span>
    )
  }

  if (chave === 'SO2') {
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-md bg-blue-500/15 text-blue-400">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      </span>
    )
  }

  if (chave === 'TEMPERATURA') {
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-md bg-rose-500/15 text-rose-400">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
        </svg>
      </span>
    )
  }

  return (
    <span className="inline-flex size-7 items-center justify-center rounded-md bg-sky-500/15 text-sky-400">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    </span>
  )
}

export function DashboardEstacao() {
  const { id: idRota } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [estacoes, setEstacoes] = useState<EstacaoStatus[]>([])
  const [catalogo, setCatalogo] = useState<Grandeza[]>([])

  const estacaoDaQuery =
    searchParams.get('station') ?? searchParams.get('estacao') ?? ''
  const estacaoSelecionada = (idRota ?? estacaoDaQuery).trim()

  const grandezaSelecionada =
    (searchParams.get('grandeza') ?? '').trim() || 'PM2.5'
  const periodoSelecionado = lerPeriodoUrl(searchParams.get('periodo'))

  const [tentativa, setTentativa] = useState(0)
  const [resultado, setResultado] = useState<ResultadoDashboard | null>(null)
  const [avisoPolling, setAvisoPolling] = useState<string | null>(null)

  const requisicaoAtual = useRef(0)

  // Carrega a lista de estações e o catálogo de grandezas em segundo plano para popular os seletores.
  useEffect(() => {
    let ativo = true

    getEstacoesStatus()
      .then((lista) => {
        if (!ativo) return
        setEstacoes(lista)
      })
      .catch(() => {
        if (ativo) setEstacoes([])
      })

    listarGrandezas()
      .then((lista) => {
        if (!ativo) return
        setCatalogo(lista)
      })
      .catch(() => {
        if (ativo) setCatalogo([])
      })

    return () => {
      ativo = false
    }
  }, [])

  // Se acessou /platform/dashboard sem :id, seleciona a primeira estação disponível quando carregada.
  const idEfetivo = useMemo(() => {
    if (estacaoSelecionada) return estacaoSelecionada
    return estacoes[0]?.codigo || estacoes[0]?.id || ''
  }, [estacaoSelecionada, estacoes])

  const chavePedido = `${idEfetivo}|${grandezaSelecionada}|${periodoSelecionado}|${tentativa}`

  const carregarDados = useCallback(
    (chaveDoPedido: string, silencioso: boolean) => {
      if (!idEfetivo) return Promise.resolve()

      const pedidoId = ++requisicaoAtual.current

      return Promise.all([
        getSeriesEstacao(idEfetivo, grandezaSelecionada, periodoSelecionado),
        getUltimasLeituras(idEfetivo),
        getIqar(idEfetivo),
      ])
        .then(([respostaSeries, respostaLeituras, respostaIqar]) => {
          if (pedidoId !== requisicaoAtual.current) return

          const validos = filtrarPontosValidos(respostaSeries?.dados ?? [])
          setResultado({
            chave: chaveDoPedido,
            tipo: 'pronto',
            pontosSerie: validos,
            leituras: respostaLeituras?.leituras ?? [],
            iqar: respostaIqar ?? null,
            atualizadoEm: new Date().toISOString(),
          })
          setAvisoPolling(null)
        })
        .catch((falha) => {
          if (pedidoId !== requisicaoAtual.current) return
          const tipo = classificarErroDashboard(falha)

          if (silencioso) {
            setAvisoPolling(
              `Não foi possível atualizar agora. ${MENSAGENS_ERRO_DASHBOARD[tipo]}`,
            )
          } else {
            setResultado({
              chave: chaveDoPedido,
              tipo: 'erro',
              erro: tipo,
            })
          }
        })
    },
    [idEfetivo, grandezaSelecionada, periodoSelecionado],
  )

  useEffect(() => {
    void carregarDados(chavePedido, false)
  }, [carregarDados, chavePedido])

  useAtualizacaoPeriodica(
    () => {
      void carregarDados(chavePedido, true)
    },
    INTERVALO_POLLING_DASHBOARD_MS,
    Boolean(idEfetivo),
  )

  const estado: EstadoDashboard =
    !idEfetivo || resultado?.chave === chavePedido
      ? resultado?.tipo ?? 'pronto'
      : 'carregando'

  const pontosSerie = useMemo(
    () => (resultado?.tipo === 'pronto' ? resultado.pontosSerie : []),
    [resultado],
  )
  const leituras = useMemo(
    () => (resultado?.tipo === 'pronto' ? resultado.leituras : []),
    [resultado],
  )
  const iqar = resultado?.tipo === 'pronto' ? resultado.iqar : null
  const atualizadoEm = resultado?.tipo === 'pronto' ? resultado.atualizadoEm : null
  const erro = resultado?.tipo === 'erro' ? resultado.erro : null

  const opcoesEstacao = useMemo(() => {
    const mapa = new Map<string, { valor: string; rotulo: string }>()

    for (const item of estacoes) {
      const chave = item.id
      mapa.set(chave, {
        valor: item.id,
        rotulo: `${item.codigo} — ${item.nome}`,
      })
    }

    if (idEfetivo) {
      const jaExiste = estacoes.some(
        (item) =>
          item.id === idEfetivo ||
          item.codigo.toUpperCase() === idEfetivo.toUpperCase(),
      )
      if (!jaExiste) {
        mapa.set(idEfetivo, {
          valor: idEfetivo,
          rotulo: idEfetivo,
        })
      }
    }

    return [...mapa.values()]
  }, [estacoes, idEfetivo])

  const valorSelectEstacao = useMemo(() => {
    if (!idEfetivo) return ''
    const encontrada = estacoes.find(
      (item) =>
        item.id === idEfetivo ||
        item.codigo.toUpperCase() === idEfetivo.toUpperCase(),
    )
    return encontrada ? encontrada.id : idEfetivo
  }, [estacoes, idEfetivo])

  const estacaoDetalhes = useMemo(
    () =>
      estacoes.find(
        (item) =>
          item.id === idEfetivo ||
          item.codigo.toUpperCase() === idEfetivo.toUpperCase(),
      ) ?? null,
    [estacoes, idEfetivo],
  )

  const opcoesGrandeza = useMemo(() => {
    const vistos = new Set<string>()
    const lista: Array<{ valor: string; rotulo: string }> = []

    const adicionar = (nome: string) => {
      const limpo = nome.trim()
      if (!limpo) return
      const chave = normalizarChaveGrandeza(limpo)
      if (vistos.has(chave)) return
      vistos.add(chave)
      lista.push({
        valor: limpo,
        rotulo: formatarRotuloVisualGrandeza(limpo),
      })
    }

    adicionar(grandezaSelecionada)
    for (const item of catalogo) adicionar(item.nome)
    for (const item of leituras) adicionar(item.grandeza)
    for (const item of GRANDEZAS_PADRAO) adicionar(item.nome)

    return lista
  }, [catalogo, leituras, grandezaSelecionada])

  const valorSelectGrandeza = useMemo(() => {
    const chaveAtual = normalizarChaveGrandeza(grandezaSelecionada)
    return (
      opcoesGrandeza.find((op) => normalizarChaveGrandeza(op.valor) === chaveAtual)
        ?.valor ?? grandezaSelecionada
    )
  }, [opcoesGrandeza, grandezaSelecionada])

  const unidadeAtual = useMemo(
    () => obterUnidadeGrandeza(grandezaSelecionada, leituras, catalogo),
    [grandezaSelecionada, leituras, catalogo],
  )

  const infoPeriodo = useMemo(
    () =>
      PERIODOS_DASHBOARD.find((p) => p.value === periodoSelecionado) ??
      PERIODOS_DASHBOARD[0],
    [periodoSelecionado],
  )

  const leiturasOrdenadas = useMemo(() => {
    const ordemPrioridade = ['PM25', 'PM10', 'NO2', 'O3', 'CO', 'SO2']
    return [...leituras].sort((a, b) => {
      const idxA = ordemPrioridade.indexOf(normalizarChaveGrandeza(a.grandeza))
      const idxB = ordemPrioridade.indexOf(normalizarChaveGrandeza(b.grandeza))
      if (idxA !== -1 && idxB !== -1) return idxA - idxB
      if (idxA !== -1) return -1
      if (idxB !== -1) return 1
      return a.grandeza.localeCompare(b.grandeza, 'pt-BR')
    })
  }, [leituras])

  const iqarVisual = useMemo(() => resolverExibicaoIqar(iqar), [iqar])

  const statusOnlineTexto = useMemo(() => {
    if (!estacaoDetalhes) return 'Status indisponível'
    if (estacaoDetalhes.status_operacional === 'Ativa') return 'Estação online'
    if (estacaoDetalhes.status_operacional === 'Com Falha') return 'Estação com falha'
    return 'Estação inativa'
  }, [estacaoDetalhes])

  const statusDotColor = useMemo(() => {
    if (!estacaoDetalhes) {
      return 'bg-slate-500'
    }
    if (estacaoDetalhes.status_operacional === 'Ativa') {
      return 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
    }
    if (estacaoDetalhes.status_operacional === 'Com Falha') {
      return 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
    }
    return 'bg-slate-500'
  }, [estacaoDetalhes])

  const ultimoTempoRelativo = useMemo(() => {
    if (leituras.length > 0 && leituras[0].tempoRelativo) {
      return leituras[0].tempoRelativo.replace(/^h/i, 'h')
    }
    if (
      estacaoDetalhes?.minutos_sem_sinal !== null &&
      estacaoDetalhes?.minutos_sem_sinal !== undefined
    ) {
      return `há ${estacaoDetalhes.minutos_sem_sinal} min`
    }
    return null
  }, [leituras, estacaoDetalhes])

  function alterarEstacao(novoId: string) {
    if (!novoId) return
    const query = searchParams.toString()
    const sufixo = query ? `?${query}` : ''
    navigate(`/platform/dashboard/${encodeURIComponent(novoId)}${sufixo}`)
  }

  function alterarFiltroUrl(campo: 'grandeza' | 'periodo', valor: string) {
    const proximos = new URLSearchParams(searchParams)
    proximos.set(campo, valor)
    setSearchParams(proximos)
  }

  const rotuloEstacaoSubtitulo = estacaoDetalhes
    ? `${estacaoDetalhes.codigo} (${estacaoDetalhes.nome})`
    : idEfetivo

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 text-base-content">
      {/* Cabeçalho fiel ao Figma Make */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]">
            <span className="text-[#00A6E6]">MONITORAMENTO AMBIENTAL</span>
            {rotuloEstacaoSubtitulo && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 normal-case tracking-normal">
                  {rotuloEstacaoSubtitulo}
                </span>
              </>
            )}
          </div>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
            Dashboard de qualidade do ar
            {rotuloEstacaoSubtitulo && (
              <span className="sr-only">
                {` · Dashboard da Estação · ${rotuloEstacaoSubtitulo}`}
              </span>
            )}
          </h1>

          <p className="mt-0.5 text-xs text-slate-400">
            Leituras calibradas e evolução temporal por estação
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <span className="inline-flex items-center gap-2 font-medium text-slate-300">
            <span className={`size-2 rounded-full ${statusDotColor}`} />
            {statusOnlineTexto}
          </span>
          <span>
            {ultimoTempoRelativo
              ? `Atualizado ${ultimoTempoRelativo}`
              : 'Sem registro recente'}
          </span>
        </div>
      </header>

      {/* Barra de Filtros: Estação, Grandeza e Período (Pills + Select acessível) */}
      <section
        aria-label="Filtros do dashboard"
        className="grid grid-cols-1 gap-4 rounded-xl border border-[#1E293B] bg-[#0B172A] p-4 md:grid-cols-12 md:items-end"
      >
        {/* ESTAÇÃO */}
        <div className="md:col-span-5">
          <label
            htmlFor="filtro-estacao-dashboard"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400"
          >
            Estação
          </label>
          <select
            id="filtro-estacao-dashboard"
            aria-label="Estação"
            value={valorSelectEstacao}
            onChange={(event) => alterarEstacao(event.target.value)}
            className="select h-10 min-h-0 w-full rounded-lg border border-[#1E3A5F] bg-[#0F213A] px-3 text-sm text-white outline-none transition focus:border-[#00A6E6]"
          >
            {opcoesEstacao.length === 0 ? (
              <option value="">Selecione uma estação</option>
            ) : (
              opcoesEstacao.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.rotulo}
                </option>
              ))
            )}
          </select>
        </div>

        {/* GRANDEZA */}
        <div className="md:col-span-4">
          <label
            htmlFor="filtro-grandeza-dashboard"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400"
          >
            Grandeza
          </label>
          <select
            id="filtro-grandeza-dashboard"
            aria-label="Grandeza"
            value={valorSelectGrandeza}
            onChange={(event) => alterarFiltroUrl('grandeza', event.target.value)}
            className="select h-10 min-h-0 w-full rounded-lg border border-[#1E3A5F] bg-[#0F213A] px-3 text-sm text-white outline-none transition focus:border-[#00A6E6]"
          >
            {opcoesGrandeza.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </select>
        </div>

        {/* PERÍODO: Botões segmentados acessíveis */}
        <div className="md:col-span-3">
          <span
            id="filtro-periodo-label"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400"
          >
            Período
          </span>

          <div
            role="group"
            aria-labelledby="filtro-periodo-label"
            className="grid h-10 grid-cols-3 items-center gap-1 rounded-lg border border-[#1E3A5F] bg-[#081223] p-1"
          >
            {PERIODOS_DASHBOARD.map((opcao) => {
              const ativo = periodoSelecionado === opcao.value
              return (
                <button
                  key={opcao.value}
                  type="button"
                  onClick={() => alterarFiltroUrl('periodo', opcao.value)}
                  aria-pressed={ativo}
                  className={`h-full rounded-md text-xs font-semibold transition ${
                    ativo
                      ? 'bg-[#00A6E6] text-[#041122] shadow-[0_0_12px_#00A6E640]'
                      : 'bg-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {opcao.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {avisoPolling && (
        <div
          role="status"
          className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-2.5 text-xs text-warning"
        >
          {avisoPolling}
        </div>
      )}

      {!idEfetivo ? (
        <section
          role="status"
          className="rounded-xl border border-[#1E293B] bg-[#0B172A] p-8 text-center text-sm text-slate-400"
        >
          Selecione uma estação para visualizar a série histórica, as últimas leituras e o IQAr.
        </section>
      ) : estado === 'carregando' ? (
        <Loading text="Carregando dados da estação..." centered />
      ) : estado === 'erro' && erro ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-xl border border-error/40 bg-error/10 p-5 text-error"
        >
          <p className="text-sm font-medium">{MENSAGENS_ERRO_DASHBOARD[erro]}</p>
          <Button
            variant="secondary"
            onClick={() => setTentativa((atual) => atual + 1)}
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <>
          {/* Linha de Cartões: IQAr à esquerda + Grid 3x2 de Últimas Leituras à direita (Fiel ao Figma) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Cartão grande do Índice de Qualidade do Ar (IQAr) */}
            <section
              aria-label="Índice de Qualidade do Ar (IQAr)"
              className="flex flex-col justify-between rounded-xl border p-5 lg:col-span-4"
              style={{
                backgroundColor: '#0B1A2D',
                borderColor: iqarVisual.semDados
                  ? '#1E293B'
                  : `${iqarVisual.cor}55`,
                boxShadow: iqarVisual.semDados
                  ? undefined
                  : `0 0 24px -10px ${iqarVisual.cor}40`,
              }}
            >
              {/* Topo do card IQAr */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    ÍNDICE DE QUALIDADE DO AR
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    {atualizadoEm
                      ? `Atualizado às ${formatarHorarioBrasilia(atualizadoEm)}`
                      : 'Média móvel 24 h (MP2.5)'}
                  </p>
                </div>

                <span
                  data-testid="iqar-badge"
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
                  style={{
                    borderColor: iqarVisual.semDados
                      ? '#475569'
                      : `${iqarVisual.cor}66`,
                    backgroundColor: iqarVisual.semDados
                      ? '#1E293B'
                      : `${iqarVisual.cor}1F`,
                    color: iqarVisual.semDados ? '#CBD5E1' : iqarVisual.cor,
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: iqarVisual.cor }}
                  />
                  {iqarVisual.rotulo}
                </span>
              </div>

              {/* Valor Central do IQAr */}
              <div className="my-6">
                {iqarVisual.semDados ? (
                  <div className="space-y-1.5">
                    <p className="text-lg font-bold text-slate-200">
                      Sem dados suficientes
                    </p>
                    <p className="text-xs text-slate-400">{iqarVisual.mensagem}</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <strong className="font-sans text-5xl font-bold tracking-tight text-white">
                        {iqarVisual.indice !== null
                          ? formatarNumero(iqarVisual.indice)
                          : iqarVisual.rotulo}
                      </strong>
                      <span className="text-sm font-medium text-slate-400">
                        IQAr
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400">
                      {iqarVisual.mensagem}
                    </p>
                  </div>
                )}
              </div>

              {/* Barra das 5 faixas oficiais (0, 50, 100, 150, 200+) como no Figma */}
              <div>
                <div className="grid grid-cols-5 gap-1.5">
                  {SEGMENTOS_BARRA_IQAR.map((seg, index) => {
                    const ativo =
                      !iqarVisual.semDados && iqarVisual.segmentoAtivo === index
                    return (
                      <div
                        key={seg.faixa}
                        title={seg.faixa}
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          backgroundColor: ativo ? seg.corAtiva : seg.corInativa,
                        }}
                      />
                    )
                  })}
                </div>
                <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-slate-400">
                  <span>0</span>
                  <span>40</span>
                  <span>80</span>
                  <span>120</span>
                  <span>200+</span>
                </div>
              </div>
            </section>

            {/* Grid de Cartões de Últimas Leituras por Grandeza (3 colunas x 2 linhas no desktop) */}
            <section
              aria-label="Últimas leituras da estação"
              className="lg:col-span-8"
            >
              {leituras.length === 0 ? (
                <div className="flex h-full min-h-[180px] items-center justify-center rounded-xl border border-[#1E293B] bg-[#0B172A] p-6 text-sm text-slate-400">
                  Nenhuma leitura recente registrada para esta estação.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                  {leiturasOrdenadas.slice(0, 6).map((leitura) => {
                    const nomeCan = formatarNomeGrandeza(leitura.grandeza)
                    const rotuloVisual = formatarRotuloVisualGrandeza(
                      leitura.grandeza,
                    )
                    return (
                      <article
                        key={leitura.grandeza}
                        aria-label={`Última leitura de ${nomeCan}`}
                        className="flex flex-col justify-between rounded-xl border border-[#1E293B] bg-[#0B172A] p-4 transition hover:border-[#2C4A6E]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <IconeGrandeza grandeza={leitura.grandeza} />
                            <span className="text-xs font-bold tracking-wide text-slate-200">
                              {rotuloVisual}
                            </span>
                            {rotuloVisual !== nomeCan && (
                              <span className="sr-only">{nomeCan}</span>
                            )}
                          </div>
                          <span
                            aria-hidden="true"
                            className="size-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]"
                          />
                        </div>

                        <div className="mt-4">
                          <div className="flex items-baseline gap-1.5">
                            <strong className="font-sans text-2xl font-bold tracking-tight text-white">
                              {formatarNumero(leitura.valorCalibrado)}
                            </strong>
                            {leitura.unidade && (
                              <span className="text-xs font-medium text-slate-400">
                                {leitura.unidade}
                              </span>
                            )}
                          </div>

                          <p className="mt-1.5 text-[11px] text-slate-500">
                            {leitura.tempoRelativo}
                          </p>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Cartão do Gráfico de Série Temporal (Fiel à segunda imagem do Figma) */}
          <section className="rounded-xl border border-[#1E293B] bg-[#0B172A] p-5">
            {/* Cabeçalho do gráfico */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-[#00A6E6] shadow-[0_0_8px_#00A6E6]" />
                  <h2 className="text-base font-bold text-white">
                    {formatarRotuloVisualGrandeza(grandezaSelecionada)} — Série temporal
                  </h2>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {infoPeriodo.subtituloGrafico}
                  {unidadeAtual ? ` · ${unidadeAtual}` : ''}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs">
                <span className="inline-flex items-center gap-2 text-slate-300">
                  <span className="h-0.5 w-4 rounded bg-[#00A6E6]" />
                  Valor calibrado
                </span>
                {unidadeAtual && (
                  <span className="rounded-md border border-[#1E3A5F] bg-[#0F213A] px-2.5 py-1 font-medium text-slate-300">
                    Unidade: {unidadeAtual}
                  </span>
                )}
              </div>
            </div>

            {/* Corpo do gráfico */}
            {pontosSerie.length === 0 ? (
              <div
                role="status"
                className="flex min-h-[320px] items-center justify-center rounded-lg border border-[#1E293B] bg-[#081223]/60 p-8 text-center text-sm text-slate-400"
              >
                Nenhuma medida no período selecionado.
              </div>
            ) : (
              <Chart
                titulo={`${formatarNomeGrandeza(grandezaSelecionada)}${unidadeAtual ? ` (${unidadeAtual})` : ''}`}
                ocultarTituloVisual
                unidade={unidadeAtual}
                rotuloEixoX="Horário (Brasília)"
                rotuloEixoY={formatarNomeGrandeza(grandezaSelecionada)}
                series={[
                  {
                    label: formatarNomeGrandeza(grandezaSelecionada),
                    dados: pontosSerie,
                    cor: '#00A6E6',
                  },
                ]}
              />
            )}

            {/* Rodapé do gráfico conforme o Figma */}
            <div className="mt-4 flex flex-col justify-between gap-2 border-t border-[#1E293B] pt-3 text-[11px] text-slate-500 sm:flex-row sm:items-center">
              <span>
                {ultimoTempoRelativo
                  ? `Última sincronização ${ultimoTempoRelativo}`
                  : 'Última sincronização indisponível'}
              </span>
              <span>
                Fonte: sensor calibrado · resolução {infoPeriodo.resolucaoRodape}
              </span>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default DashboardEstacao
