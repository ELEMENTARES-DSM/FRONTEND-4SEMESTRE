import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DashboardEstacao,
} from '../DashboardEstacao'
import {
  filtrarPontosValidos,
  obterUnidadeGrandeza,
  resolverExibicaoIqar,
} from '../dashboardEstacao.utils'
import {
  getIqar,
  getSeriesEstacao,
  getUltimasLeituras,
} from '../../../services/analise/analise.service'
import { getEstacoesStatus } from '../../../services/estacoesService'
import { listarGrandezas } from '../../../services/tiposSensorService'

vi.mock('../../../services/analise/analise.service', () => ({
  getSeriesEstacao: vi.fn(),
  getUltimasLeituras: vi.fn(),
  getIqar: vi.fn(),
}))

vi.mock('../../../services/estacoesService', () => ({
  getEstacoesStatus: vi.fn(),
}))

vi.mock('../../../services/tiposSensorService', () => ({
  listarGrandezas: vi.fn(),
}))

const mockGetSeries = vi.mocked(getSeriesEstacao)
const mockGetUltimasLeituras = vi.mocked(getUltimasLeituras)
const mockGetIqar = vi.mocked(getIqar)
const mockGetEstacoesStatus = vi.mocked(getEstacoesStatus)
const mockListarGrandezas = vi.mocked(listarGrandezas)

function renderDashboard(rotaInicial = '/platform/dashboard/EST-001') {
  return render(
    <MemoryRouter initialEntries={[rotaInicial]}>
      <Routes>
        <Route path="/platform/dashboard" element={<DashboardEstacao />} />
        <Route path="/platform/dashboard/:id" element={<DashboardEstacao />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()

  mockGetEstacoesStatus.mockResolvedValue([
    {
      id: '11111111-1111-4111-8111-111111111111',
      codigo: 'EST-001',
      nome: 'Estação Centro',
      municipio: 'São José dos Campos',
      status_operacional: 'Ativa',
      ultimo_ping: '2026-11-20T12:00:00.000Z',
      minutos_sem_sinal: 2,
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      codigo: 'EST-002',
      nome: 'Estação Jardim das Flores',
      municipio: 'São José dos Campos',
      status_operacional: 'Ativa',
      ultimo_ping: '2026-11-20T12:00:00.000Z',
      minutos_sem_sinal: 4,
    },
  ])

  mockListarGrandezas.mockResolvedValue([
    {
      id: 'g-pm25',
      nome: 'PM2.5',
      unidade: 'µg/m³',
      faixa_min: '0.00',
      faixa_max: '1000.00',
      agregacao: 'media',
    },
    {
      id: 'g-umid',
      nome: 'Umidade Relativa',
      unidade: '%',
      faixa_min: '0.00',
      faixa_max: '100.00',
      agregacao: 'media',
    },
  ])

  mockGetSeries.mockResolvedValue({
    estacaoId: 'EST-001',
    grandeza: 'PM2.5',
    periodo: '24h',
    dados: [
      { timestamp: '2026-11-20T12:00:00.000Z', valor: 14.5 },
      { timestamp: '2026-11-20T12:05:00.000Z', valor: 15.2 },
    ],
  })

  mockGetUltimasLeituras.mockResolvedValue({
    estacaoId: 'EST-001',
    leituras: [
      {
        grandeza: 'PM2.5',
        valorCalibrado: 15.2,
        unidade: 'µg/m³',
        tempoRelativo: 'há 5 min',
      },
      {
        grandeza: 'Umidade Relativa',
        valorCalibrado: 64.8,
        unidade: '%',
        tempoRelativo: 'há 5 min',
      },
    ],
  })

  mockGetIqar.mockResolvedValue({
    estacaoId: 'EST-001',
    indice: 15,
    classificacao: 'Boa',
    status: 'Boa',
    cor: '#00E400',
    rotuloFaixa: 'Boa',
    mensagem: 'Qualidade do ar considerada boa.',
  })
})

describe('DashboardEstacao (US-35)', () => {
  it('deve receber o ID da estação pela rota /platform/dashboard/:id e consultar séries, últimas leituras e IQAr', async () => {
    renderDashboard('/platform/dashboard/EST-001')

    expect(
      await screen.findByRole('heading', {
        name: /Dashboard da Estação · EST-001 \(Estação Centro\)/i,
      }),
    ).toBeInTheDocument()

    expect(mockGetSeries).toHaveBeenCalledWith('EST-001', 'PM2.5', '24h')
    expect(mockGetUltimasLeituras).toHaveBeenCalledWith('EST-001')
    expect(mockGetIqar).toHaveBeenCalledWith('EST-001')
  })

  it('deve renderizar o gráfico com a série histórica em µg/m³ quando seleciona EST-001, PM2.5 e 7 dias (Cenário 1)', async () => {
    mockGetSeries.mockResolvedValue({
      estacaoId: 'EST-001',
      grandeza: 'PM2.5',
      periodo: '7d',
      dados: [
        { timestamp: '2026-11-20T13:00:00.000Z', valor: 18.4 },
        { timestamp: '2026-11-20T14:00:00.000Z', valor: 19.1 },
      ],
    })

    renderDashboard('/platform/dashboard/EST-001')
    await screen.findByRole('heading', { name: /Dashboard da Estação/i })

    fireEvent.click(screen.getByRole('button', { name: '7 dias' }))

    await waitFor(() =>
      expect(mockGetSeries).toHaveBeenLastCalledWith('EST-001', 'PM2.5', '7d'),
    )

    expect(
      await screen.findByRole('region', { name: 'PM2.5 (µg/m³)' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Média por hora · µg\/m³/i)).toBeInTheDocument()
  })

  it('deve exibir "Sem dados suficientes" no cartão de IQAr quando a estação tem menos de 24h de dados (Cenário 2)', async () => {
    mockGetIqar.mockResolvedValueOnce({
      estacaoId: 'EST-001',
      indice: 'Sem dados suficientes',
      status: 'Sem dados suficientes',
      rotuloFaixa: 'Sem dados suficientes',
      mensagem: 'Não há dados suficientes para calcular o IQAr.',
    })

    renderDashboard('/platform/dashboard/EST-001')

    const cartaoIqar = await screen.findByRole('region', {
      name: 'Índice de Qualidade do Ar (IQAr)',
    })

    expect(within(cartaoIqar).getByTestId('iqar-badge')).toHaveTextContent(
      'Sem dados suficientes',
    )
    expect(
      within(cartaoIqar).getByText('Não há dados suficientes para calcular o IQAr.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('deve descartar pontos marcados com valida = false antes de plotar o gráfico (Cenário 3)', async () => {
    mockGetSeries.mockResolvedValueOnce({
      estacaoId: 'EST-001',
      grandeza: 'Umidade Relativa',
      periodo: '24h',
      dados: [
        { timestamp: '2026-11-20T12:00:00.000Z', valor: 120.0, valida: false },
      ],
    })

    renderDashboard('/platform/dashboard/EST-001?grandeza=Umidade%20Relativa')

    expect(
      await screen.findByText('Nenhuma medida no período selecionado.'),
    ).toBeInTheDocument()
  })

  it('deve exibir os cartões de última leitura com valor calibrado, unidade e tempo relativo', async () => {
    renderDashboard('/platform/dashboard/EST-001')

    const cartaoPm25 = await screen.findByRole('article', {
      name: 'Última leitura de PM2.5',
    })
    expect(within(cartaoPm25).getByText('15,2')).toBeInTheDocument()
    expect(within(cartaoPm25).getByText('µg/m³')).toBeInTheDocument()
    expect(within(cartaoPm25).getByText('há 5 min')).toBeInTheDocument()

    const cartaoUmidade = screen.getByRole('article', {
      name: 'Última leitura de Umidade Relativa',
    })
    expect(within(cartaoUmidade).getByText('64,8')).toBeInTheDocument()
    expect(within(cartaoUmidade).getByText('%')).toBeInTheDocument()
  })

  it.each([
    ['Boa', '#22C55E'],
    ['Moderada', '#EAB308'],
    ['Ruim', '#F97316'],
    ['Muito Ruim', '#EF4444'],
    ['Péssima', '#A855F7'],
  ])('deve mapear a faixa oficial %s com a cor %s quando o backend não envia cor explícita', (faixa, corEsperada) => {
    const resultado = resolverExibicaoIqar({
      status: faixa,
      rotuloFaixa: faixa,
      mensagem: '',
    })

    expect(resultado.semDados).toBe(false)
    expect(resultado.rotulo).toBe(faixa)
    expect(resultado.cor).toBe(corEsperada)
  })

  it('deve filtrar pontos com valida = false e manter pontos válidos na função utilitária', () => {
    const pontos = filtrarPontosValidos([
      { timestamp: '2026-11-20T12:00:00.000Z', valor: 55.2, valida: true },
      { timestamp: '2026-11-20T12:05:00.000Z', valor: 120.0, valida: false },
      { timestamp: '2026-11-20T12:10:00.000Z', valor: 58.0 },
    ])

    expect(pontos).toEqual([
      { timestamp: '2026-11-20T12:00:00.000Z', valor: 55.2, valida: true },
      { timestamp: '2026-11-20T12:10:00.000Z', valor: 58.0 },
    ])
  })

  it('não deve exibir status online nem horário fictício quando não há metadados nem leituras da estação', async () => {
    mockGetEstacoesStatus.mockResolvedValueOnce([])
    mockGetUltimasLeituras.mockResolvedValueOnce({
      estacaoId: 'EST-999',
      leituras: [],
    })
    mockGetSeries.mockResolvedValueOnce({
      estacaoId: 'EST-999',
      grandeza: 'PM2.5',
      periodo: '24h',
      dados: [],
    })

    renderDashboard('/platform/dashboard/EST-999')

    expect(
      await screen.findByText('Nenhuma medida no período selecionado.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Status indisponível')).toBeInTheDocument()
    expect(screen.getByText('Sem registro recente')).toBeInTheDocument()
    expect(screen.queryByText('Estação online')).not.toBeInTheDocument()
    expect(screen.queryByText(/há 2 min/i)).not.toBeInTheDocument()
  })

  it('deve resolver a unidade de medida a partir das últimas leituras, do catálogo ou do padrão', () => {
    expect(
      obterUnidadeGrandeza(
        'Radiação Solar',
        [{ grandeza: 'Radiação Solar', valorCalibrado: 450, unidade: 'W/m²', tempoRelativo: 'há 1 min' }],
        [],
      ),
    ).toBe('W/m²')

    expect(
      obterUnidadeGrandeza(
        'Pressão Atmosférica',
        [],
        [],
      ),
    ).toBe('hPa')
  })
})
