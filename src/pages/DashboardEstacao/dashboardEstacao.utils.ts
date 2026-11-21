import { isAxiosError } from 'axios'
import type {
  IqarResponse,
  LeituraRecente,
  PeriodoAnalise,
  PontoSerie,
} from '../../services/analise/analise.service'
import type { Grandeza } from '../../services/tiposSensorService'

// US-35: os painéis se atualizam sozinhos a cada 5 minutos.
export const INTERVALO_POLLING_DASHBOARD_MS = 5 * 60 * 1000

export const SEM_DADOS_SUFICIENTES = 'Sem dados suficientes'

export type TipoErroDashboard =
  | 'sem-conexao'
  | 'sem-permissao'
  | 'nao-encontrada'
  | 'cota-excedida'
  | 'servidor'

export const MENSAGENS_ERRO_DASHBOARD: Record<TipoErroDashboard, string> = {
  'sem-conexao': 'Sem conexão com o servidor. Verifique a rede e tente novamente.',
  'sem-permissao': 'Seu perfil não tem permissão para consultar os dados desta estação.',
  'nao-encontrada': 'Estação não encontrada ou indisponível para o seu município.',
  'cota-excedida': 'Limite de consultas excedido para o seu perfil. Tente novamente mais tarde.',
  servidor: 'Não foi possível carregar os dados do dashboard. Tente novamente em instantes.',
}

export function classificarErroDashboard(erro: unknown): TipoErroDashboard {
  if (isAxiosError(erro)) {
    if (!erro.response) return 'sem-conexao'
    if (erro.response.status === 401 || erro.response.status === 403) return 'sem-permissao'
    if (erro.response.status === 404) return 'nao-encontrada'
    if (erro.response.status === 429) return 'cota-excedida'
  }
  return 'servidor'
}

// Faixas oficiais do IQAr sobre a média móvel de 24h de PM2.5 (DEC-6 / CONAMA 506/2024 e CETESB).
export interface FaixaIqarVisual {
  rotulo: string
  cor: string
  descricao: string
  segmentoAtivo: number
}

export const FAIXAS_OFICIAIS_IQAR: Record<string, FaixaIqarVisual> = {
  boa: {
    rotulo: 'Boa',
    cor: '#22C55E',
    descricao: 'Qualidade do ar considerada boa.',
    segmentoAtivo: 0,
  },
  moderada: {
    rotulo: 'Moderada',
    cor: '#EAB308',
    descricao: 'Qualidade do ar considerada moderada.',
    segmentoAtivo: 1,
  },
  ruim: {
    rotulo: 'Ruim',
    cor: '#F97316',
    descricao: 'Qualidade do ar considerada ruim.',
    segmentoAtivo: 2,
  },
  'muito ruim': {
    rotulo: 'Muito Ruim',
    cor: '#EF4444',
    descricao: 'Qualidade do ar considerada muito ruim.',
    segmentoAtivo: 3,
  },
  pessima: {
    rotulo: 'Péssima',
    cor: '#A855F7',
    descricao: 'Qualidade do ar considerada péssima.',
    segmentoAtivo: 4,
  },
  péssima: {
    rotulo: 'Péssima',
    cor: '#A855F7',
    descricao: 'Qualidade do ar considerada péssima.',
    segmentoAtivo: 4,
  },
}

export const SEGMENTOS_BARRA_IQAR: ReadonlyArray<{
  faixa: string
  corAtiva: string
  corInativa: string
}> = [
  { faixa: 'Boa', corAtiva: '#22C55E', corInativa: '#22C55E33' },
  { faixa: 'Moderada', corAtiva: '#EAB308', corInativa: '#EAB30833' },
  { faixa: 'Ruim', corAtiva: '#F97316', corInativa: '#F9731633' },
  { faixa: 'Muito Ruim', corAtiva: '#EF4444', corInativa: '#EF444433' },
  { faixa: 'Péssima', corAtiva: '#A855F7', corInativa: '#A855F733' },
]

export const PERIODOS_DASHBOARD: ReadonlyArray<{
  value: PeriodoAnalise
  label: string
  subtituloGrafico: string
  resolucaoRodape: string
}> = [
  {
    value: '24h',
    label: '24 h',
    subtituloGrafico: 'Hoje, 00h–24h · Amostras a cada 5 min',
    resolucaoRodape: 'amostras a cada 5 min',
  },
  {
    value: '7d',
    label: '7 dias',
    subtituloGrafico: 'Últimos 7 dias · Média por hora',
    resolucaoRodape: 'média por hora',
  },
  {
    value: '30d',
    label: '30 dias',
    subtituloGrafico: 'Últimos 30 dias · Média por dia',
    resolucaoRodape: 'média por dia',
  },
]

export const GRANDEZAS_PADRAO: ReadonlyArray<{
  nome: string
  rotulo: string
  unidade: string
}> = [
  { nome: 'PM2.5', rotulo: 'MP2.5', unidade: 'µg/m³' },
  { nome: 'PM10', rotulo: 'MP10', unidade: 'µg/m³' },
  { nome: 'NO2', rotulo: 'NO₂', unidade: 'µg/m³' },
  { nome: 'O3', rotulo: 'O₃', unidade: 'µg/m³' },
  { nome: 'CO', rotulo: 'CO', unidade: 'ppm' },
  { nome: 'SO2', rotulo: 'SO₂', unidade: 'µg/m³' },
  { nome: 'Temperatura', rotulo: 'Temperatura', unidade: '°C' },
  { nome: 'Umidade Relativa', rotulo: 'Umidade Relativa', unidade: '%' },
  { nome: 'Velocidade do Vento', rotulo: 'Velocidade do Vento', unidade: 'km/h' },
  { nome: 'Direção do Vento', rotulo: 'Direção do Vento', unidade: '°' },
  { nome: 'Precipitação', rotulo: 'Precipitação', unidade: 'mm' },
  { nome: 'Pressão Atmosférica', rotulo: 'Pressão Atmosférica', unidade: 'hPa' },
]

export function normalizarChaveGrandeza(valor: string): string {
  const limpo = valor.trim().toUpperCase().replace(/\./g, '')
  if (limpo === 'MP25') return 'PM25'
  if (limpo === 'MP10') return 'PM10'
  if (limpo === 'NO₂') return 'NO2'
  if (limpo === 'O₃') return 'O3'
  if (limpo === 'SO₂') return 'SO2'
  return limpo
}

export function obterUnidadeGrandeza(
  grandeza: string,
  leituras: LeituraRecente[],
  catalogo: Grandeza[],
): string {
  const chave = normalizarChaveGrandeza(grandeza)

  const daLeitura = leituras.find(
    (item) => normalizarChaveGrandeza(item.grandeza) === chave && item.unidade.trim() !== '',
  )
  if (daLeitura) return daLeitura.unidade

  const doCatalogo = catalogo.find((item) => normalizarChaveGrandeza(item.nome) === chave)
  if (doCatalogo && doCatalogo.unidade.trim() !== '') return doCatalogo.unidade

  const padrao = GRANDEZAS_PADRAO.find((item) => normalizarChaveGrandeza(item.nome) === chave)
  return padrao?.unidade ?? ''
}

export function formatarNomeGrandeza(grandeza: string): string {
  const chave = normalizarChaveGrandeza(grandeza)
  if (chave === 'PM25') return 'PM2.5'
  if (chave === 'PM10') return 'PM10'
  return grandeza
}

export function formatarRotuloVisualGrandeza(grandeza: string): string {
  const chave = normalizarChaveGrandeza(grandeza)
  if (chave === 'PM25') return 'MP2.5'
  if (chave === 'PM10') return 'MP10'
  if (chave === 'NO2') return 'NO₂'
  if (chave === 'O3') return 'O₃'
  if (chave === 'SO2') return 'SO₂'
  return grandeza
}

/**
 * Descarta medidas marcadas como inválidas (`valida === false`, US-19 / Cenário 3)
 * ou com valor não numérico antes de enviar ao componente de gráfico.
 */
export function filtrarPontosValidos(dados: PontoSerie[]): PontoSerie[] {
  return dados.filter(
    (ponto) =>
      ponto.valida !== false &&
      typeof ponto.valor === 'number' &&
      Number.isFinite(ponto.valor),
  )
}

export function resolverExibicaoIqar(iqar: IqarResponse | null): {
  semDados: boolean
  rotulo: string
  cor: string
  mensagem: string
  indice: number | null
  segmentoAtivo: number
} {
  if (!iqar) {
    return {
      semDados: true,
      rotulo: SEM_DADOS_SUFICIENTES,
      cor: '#64748B',
      mensagem: 'Não há 24 h de dados válidos de PM2.5 para calcular o IQAr.',
      indice: null,
      segmentoAtivo: -1,
    }
  }

  const textoFaixa = (iqar.rotuloFaixa || iqar.classificacao || iqar.status || '').trim()
  const textoStatus = (iqar.status || '').trim()
  const indiceTexto = typeof iqar.indice === 'string' ? iqar.indice.trim() : ''

  const semDados =
    !textoFaixa ||
    textoFaixa.toLowerCase() === SEM_DADOS_SUFICIENTES.toLowerCase() ||
    textoStatus.toLowerCase() === SEM_DADOS_SUFICIENTES.toLowerCase() ||
    indiceTexto.toLowerCase() === SEM_DADOS_SUFICIENTES.toLowerCase()

  if (semDados) {
    return {
      semDados: true,
      rotulo: SEM_DADOS_SUFICIENTES,
      cor: '#64748B',
      mensagem: iqar.mensagem || 'Não há 24 h de dados válidos de PM2.5 para calcular o IQAr.',
      indice: null,
      segmentoAtivo: -1,
    }
  }

  const faixaOficial = FAIXAS_OFICIAIS_IQAR[textoFaixa.toLowerCase()]
  const rotulo = faixaOficial?.rotulo ?? textoFaixa
  const cor = iqar.cor || faixaOficial?.cor || '#22C55E'
  const mensagem = iqar.mensagem || faixaOficial?.descricao || `Faixa oficial: ${rotulo}.`
  const indice =
    typeof iqar.indice === 'number' && Number.isFinite(iqar.indice)
      ? iqar.indice
      : null
  const segmentoAtivo = faixaOficial?.segmentoAtivo ?? 0

  return {
    semDados: false,
    rotulo,
    cor,
    mensagem,
    indice,
    segmentoAtivo,
  }
}

export function lerPeriodoUrl(valor: string | null): PeriodoAnalise {
  if (valor === '24h' || valor === '7d' || valor === '30d') return valor
  return '24h'
}

export function formatarNumero(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 2,
  }).format(valor)
}

export function formatarHorarioBrasilia(timestamp: string): string {
  const data = new Date(timestamp)
  if (Number.isNaN(data.getTime())) return '—'
  const partes = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(data)

  const hora = partes.find((p) => p.type === 'hour')?.value ?? '00'
  const min = partes.find((p) => p.type === 'minute')?.value ?? '00'
  return `${hora}h${min}`
}
