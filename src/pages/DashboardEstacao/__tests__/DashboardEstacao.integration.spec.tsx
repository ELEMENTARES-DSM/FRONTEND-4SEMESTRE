import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../../api/instance'
import { AuthProvider } from '../../../auth/AuthProvider'
import { AppRoutes } from '../../../routes/AppRoutes'
import { INTERVALO_POLLING_DASHBOARD_MS } from '../dashboardEstacao.utils'

const ESTACAO_1 = {
  id: '11111111-1111-4111-8111-111111111111',
  codigo: 'EST-001',
  nome: 'Estação Centro',
  municipio: 'São José dos Campos',
  status_operacional: 'Ativa' as const,
  ultimo_ping: '2026-11-20T12:00:00.000Z',
}

const ESTACAO_2 = {
  id: '22222222-2222-4222-8222-222222222222',
  codigo: 'EST-002',
  nome: 'Estação Jardim das Flores',
  municipio: 'São José dos Campos',
  status_operacional: 'Ativa' as const,
  ultimo_ping: '2026-11-20T11:55:00.000Z',
}

function LocationDisplay() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname + location.search}</output>
}

function autenticarEabrir(rotaInicial: string, papel = 'GESTOR_PUBLICO') {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))
  localStorage.setItem('token', `header.${payload}.signature`)
  localStorage.setItem(
    'usuario',
    JSON.stringify({
      id: 'usuario-1',
      nome: 'Gestora SJC',
      papel,
      municipio: 'São José dos Campos',
    }),
  )

  return render(
    <MemoryRouter initialEntries={[rotaInicial]}>
      <AuthProvider>
        <AppRoutes />
        <LocationDisplay />
      </AuthProvider>
    </MemoryRouter>,
  )
}

const criarErroAxios = (status: number, message = 'Erro') =>
  new AxiosError(message, 'ERR_BAD_RESPONSE', undefined, undefined, {
    status,
    data: { message },
  } as AxiosResponse)

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date('2026-11-20T15:00:00.000Z'))
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('DashboardEstacao integração (US-35)', () => {
  it('deve navegar do link da estação na Visão Geral para /platform/dashboard/:id e carregar os dados', async () => {
    const getSpy = vi
      .spyOn(api, 'get')
      .mockImplementation(async (url: string, config?: AxiosRequestConfig) => {
        if (url === '/estacoes/status') {
          return {
            data: {
              resumo: { total: 2, ativas: 2, com_falha: 0, inativas: 0 },
              estacoes: [ESTACAO_1, ESTACAO_2],
            },
          }
        }
        if (url === '/alertas/alarmes/resumo') {
          return { data: { abertos: { ATENCAO: 0, ALERTA: 0, CRITICO: 0 }, total: 0 } }
        }
        if (url === '/estacoes/tipos-sensor') {
          return {
            data: [
              { id: '1', nome: 'PM2.5', unidade: 'µg/m³', faixa_min: '0', faixa_max: '1000', agregacao: 'media' },
            ],
          }
        }
        if (url === `/analise/estacoes/${ESTACAO_1.id}/series`) {
          return {
            data: {
              estacaoId: ESTACAO_1.id,
              grandeza: config?.params?.grandeza ?? 'PM2.5',
              periodo: config?.params?.periodo ?? '24h',
              dados: [
                { timestamp: '2026-11-20T14:50:00.000Z', valor: 16.4 },
                { timestamp: '2026-11-20T14:55:00.000Z', valor: 17.1 },
              ],
            },
          }
        }
        if (url === `/analise/estacoes/${ESTACAO_1.id}/ultimas-leituras`) {
          return {
            data: {
              estacaoId: ESTACAO_1.id,
              leituras: [
                {
                  grandeza: 'PM2.5',
                  valorCalibrado: 17.1,
                  unidade: 'µg/m³',
                  tempoRelativo: 'há 5 min',
                },
              ],
            },
          }
        }
        if (url === '/analise/iqar') {
          return {
            data: {
              estacaoId: ESTACAO_1.id,
              indice: 14,
              status: 'Boa',
              rotuloFaixa: 'Boa',
              cor: '#00E400',
              mensagem: 'Qualidade do ar considerada boa.',
            },
          }
        }
        return { data: [] }
      })

    autenticarEabrir('/platform')

    const linkEstacao = await screen.findByRole('link', { name: 'Estação Centro' })
    fireEvent.click(linkEstacao)

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        `/platform/dashboard/${ESTACAO_1.id}`,
      ),
    )

    expect(
      await screen.findByRole('heading', {
        name: /Dashboard da Estação · EST-001 \(Estação Centro\)/i,
      }),
    ).toBeInTheDocument()

    expect(getSpy).toHaveBeenCalledWith(
      `/analise/estacoes/${ESTACAO_1.id}/series`,
      { params: { grandeza: 'PM2.5', periodo: '24h' } },
    )
    expect(getSpy).toHaveBeenCalledWith(
      `/analise/estacoes/${ESTACAO_1.id}/ultimas-leituras`,
    )
    expect(getSpy).toHaveBeenCalledWith('/analise/iqar', {
      params: { estacaoId: ESTACAO_1.id },
    })
  })

  it('deve recarregar os dados automaticamente a cada 5 minutos (polling)', async () => {
    let valorLeitura = 18.0
    const getSpy = vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
      if (url === '/estacoes/status') {
        return {
          data: {
            resumo: { total: 1, ativas: 1, com_falha: 0, inativas: 0 },
            estacoes: [ESTACAO_1],
          },
        }
      }
      if (url === '/alertas/alarmes/resumo') {
        return { data: { abertos: { ATENCAO: 0, ALERTA: 0, CRITICO: 0 }, total: 0 } }
      }
      if (url === '/estacoes/tipos-sensor') return { data: [] }
      if (url === '/analise/estacoes/EST-001/series') {
        return {
          data: {
            estacaoId: 'EST-001',
            grandeza: 'PM2.5',
            periodo: '24h',
            dados: [{ timestamp: '2026-11-20T14:55:00.000Z', valor: valorLeitura }],
          },
        }
      }
      if (url === '/analise/estacoes/EST-001/ultimas-leituras') {
        return {
          data: {
            estacaoId: 'EST-001',
            leituras: [
              {
                grandeza: 'PM2.5',
                valorCalibrado: valorLeitura,
                unidade: 'µg/m³',
                tempoRelativo: 'há 1 min',
              },
            ],
          },
        }
      }
      if (url === '/analise/iqar') {
        return {
          data: {
            status: 'Moderada',
            rotuloFaixa: 'Moderada',
            cor: '#FFFF00',
            mensagem: 'Qualidade do ar considerada moderada.',
          },
        }
      }
      return { data: [] }
    })

    autenticarEabrir('/platform/dashboard/EST-001')

    const cartaoLeitura = await screen.findByRole('article', {
      name: 'Última leitura de PM2.5',
    })
    expect(within(cartaoLeitura).getByText('18')).toBeInTheDocument()

    const chamadasAntes = getSpy.mock.calls.filter(
      ([u]) => u === '/analise/estacoes/EST-001/series',
    ).length
    expect(chamadasAntes).toBe(1)

    valorLeitura = 27.5
    await act(() => vi.advanceTimersByTimeAsync(INTERVALO_POLLING_DASHBOARD_MS))

    await waitFor(() => {
      const chamadasDepois = getSpy.mock.calls.filter(
        ([u]) => u === '/analise/estacoes/EST-001/series',
      ).length
      expect(chamadasDepois).toBe(2)
    })

    expect(
      await within(
        screen.getByRole('article', { name: 'Última leitura de PM2.5' }),
      ).findByText('27,5'),
    ).toBeInTheDocument()
  })

  it('deve trocar de estação, grandeza e período pelos filtros e atualizar a URL e as chamadas de API', async () => {
    const getSpy = vi
      .spyOn(api, 'get')
      .mockImplementation(async (url: string, config?: AxiosRequestConfig) => {
        if (url === '/estacoes/status') {
          return {
            data: {
              resumo: { total: 2, ativas: 2, com_falha: 0, inativas: 0 },
              estacoes: [ESTACAO_1, ESTACAO_2],
            },
          }
        }
        if (url === '/alertas/alarmes/resumo') {
          return { data: { abertos: { ATENCAO: 0, ALERTA: 0, CRITICO: 0 }, total: 0 } }
        }
        if (url === '/estacoes/tipos-sensor') {
          return {
            data: [
              { id: '1', nome: 'PM2.5', unidade: 'µg/m³', faixa_min: '0', faixa_max: '1000', agregacao: 'media' },
              { id: '2', nome: 'Temperatura', unidade: '°C', faixa_min: '-50', faixa_max: '60', agregacao: 'media' },
            ],
          }
        }
        if (url.endsWith('/series')) {
          return {
            data: {
              estacaoId: 'EST-002',
              grandeza: config?.params?.grandeza ?? 'PM2.5',
              periodo: config?.params?.periodo ?? '24h',
              dados: [{ timestamp: '2026-11-20T00:00:00.000Z', valor: 23.4 }],
            },
          }
        }
        if (url.endsWith('/ultimas-leituras')) {
          return { data: { estacaoId: 'EST-002', leituras: [] } }
        }
        if (url === '/analise/iqar') {
          return {
            data: {
              status: 'Boa',
              rotuloFaixa: 'Boa',
              cor: '#00E400',
              mensagem: 'Qualidade do ar considerada boa.',
            },
          }
        }
        return { data: [] }
      })

    autenticarEabrir(`/platform/dashboard/${ESTACAO_1.id}`)

    await screen.findByRole('heading', { name: /Dashboard da Estação/i })

    fireEvent.change(screen.getByLabelText('Grandeza'), {
      target: { value: 'Temperatura' },
    })
    fireEvent.change(screen.getByLabelText('Período'), {
      target: { value: '30d' },
    })

    await waitFor(() =>
      expect(getSpy).toHaveBeenCalledWith(
        `/analise/estacoes/${ESTACAO_1.id}/series`,
        { params: { grandeza: 'Temperatura', periodo: '30d' } },
      ),
    )

    fireEvent.change(screen.getByLabelText('Estação'), {
      target: { value: ESTACAO_2.id },
    })

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        `/platform/dashboard/${ESTACAO_2.id}?grandeza=Temperatura&periodo=30d`,
      ),
    )

    await waitFor(() =>
      expect(getSpy).toHaveBeenCalledWith(
        `/analise/estacoes/${ESTACAO_2.id}/series`,
        { params: { grandeza: 'Temperatura', periodo: '30d' } },
      ),
    )
  })

  it.each([
    [
      'sem conexão',
      new AxiosError('Network Error', 'ERR_NETWORK'),
      'Sem conexão com o servidor. Verifique a rede e tente novamente.',
    ],
    [
      'estação de outro município (404)',
      criarErroAxios(404, 'Estação não encontrada.'),
      'Estação não encontrada ou indisponível para o seu município.',
    ],
    [
      'sem permissão (403)',
      criarErroAxios(403, 'Acesso negado.'),
      'Seu perfil não tem permissão para consultar os dados desta estação.',
    ],
    [
      'erro interno do servidor (500)',
      criarErroAxios(500, 'Internal Server Error'),
      'Não foi possível carregar os dados do dashboard. Tente novamente em instantes.',
    ],
  ])('deve tratar o erro "%s" e permitir tentar novamente com sucesso', async (_caso, erroSimulado, mensagemEsperada) => {
    let falhar = true

    vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
      if (url === '/estacoes/status') {
        return { data: { resumo: { total: 1, ativas: 1, com_falha: 0, inativas: 0 }, estacoes: [ESTACAO_1] } }
      }
      if (url === '/alertas/alarmes/resumo') {
        return { data: { abertos: { ATENCAO: 0, ALERTA: 0, CRITICO: 0 }, total: 0 } }
      }
      if (url === '/estacoes/tipos-sensor') return { data: [] }

      if (falhar) throw erroSimulado

      if (url.endsWith('/series')) {
        return {
          data: {
            estacaoId: 'EST-001',
            grandeza: 'PM2.5',
            periodo: '24h',
            dados: [],
          },
        }
      }
      if (url.endsWith('/ultimas-leituras')) {
        return { data: { estacaoId: 'EST-001', leituras: [] } }
      }
      if (url === '/analise/iqar') {
        return {
          data: {
            status: 'Sem dados suficientes',
            rotuloFaixa: 'Sem dados suficientes',
            mensagem: 'Não há dados suficientes para calcular o IQAr.',
          },
        }
      }
      return { data: [] }
    })

    autenticarEabrir('/platform/dashboard/EST-001')

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent(mensagemEsperada)

    falhar = false
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(
      await screen.findByText('Nenhuma medida no período selecionado.'),
    ).toBeInTheDocument()
  })
})
