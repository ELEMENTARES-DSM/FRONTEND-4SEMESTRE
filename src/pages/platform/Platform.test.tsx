import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { AxiosRequestConfig } from 'axios'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from '../../auth/AuthProvider'
import api from '../../api/instance'
import { Platform } from './Platform'

const STATUS = {
  resumo: { total: 2, ativas: 1, com_falha: 1, inativas: 0 },
  estacoes: [
    { id: 'e1', codigo: 'SJC-001', nome: 'Estação Centro', status_operacional: 'Ativa', ultimo_ping: '2026-10-24T13:00:00.000Z' },
    { id: 'e2', codigo: 'SJC-002', nome: 'Estação Norte', status_operacional: 'Com Falha', ultimo_ping: null },
  ],
}

function renderPlatform(papel: string) {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))
  localStorage.setItem('token', `header.${payload}.signature`)
  localStorage.setItem('usuario', JSON.stringify({
    id: 'usuario-teste', nome: 'Maria Silva', papel, municipio: 'São José dos Campos',
  }))
  return render(
    <MemoryRouter initialEntries={['/platform']}>
      <AuthProvider>
        <Platform />
      </AuthProvider>
    </MemoryRouter>,
  )
}

function mockarApi(iqarPorEstacao: Record<string, unknown>, status = STATUS) {
  return vi.spyOn(api, 'get').mockImplementation(async (url: string, config?: AxiosRequestConfig) => {
    if (url === '/estacoes/status') return { data: status }
    if (url === '/analise/iqar') {
      const resposta = iqarPorEstacao[(config?.params as { estacaoId?: string } | undefined)?.estacaoId ?? '']
      if (resposta instanceof Error) throw resposta
      return { data: resposta }
    }
    return { data: [] }
  })
}

function LocalizacaoAtual() {
  const { pathname } = useLocation()
  return <output data-testid="localizacao">{pathname}</output>
}

function renderPlatformComRotas(papel: string) {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))
  localStorage.setItem('token', `header.${payload}.signature`)
  localStorage.setItem('usuario', JSON.stringify({
    id: 'usuario-teste', nome: 'Maria Silva', papel, municipio: 'São José dos Campos',
  }))
  return render(
    <MemoryRouter initialEntries={['/platform']}>
      <AuthProvider>
        <Routes>
          <Route path="/platform" element={<Platform />} />
          <Route path="/platform/dashboard/:id" element={<span>Dashboard</span>} />
        </Routes>
        <LocalizacaoAtual />
      </AuthProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('Visão Geral por perfil', () => {
  it('o munícipe vê a Visão Geral com as estações sem o botão de criar estação', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: STATUS })

    renderPlatform('MUNICIPE')

    expect(screen.getByRole('heading', { name: 'Visão Geral' })).toBeInTheDocument()
    expect(await screen.findByText('Estação Centro')).toBeInTheDocument()
    expect(screen.getByText('Estação Norte')).toBeInTheDocument()
    const linksSensores = screen.getAllByRole('link', { name: 'Sensores' })
    expect(linksSensores[0]).toHaveAttribute('href', '/platform/estacoes/e1')
    expect(linksSensores[1]).toHaveAttribute('href', '/platform/estacoes/e2')
    expect(get).toHaveBeenCalledWith('/estacoes/status')
    expect(screen.queryByRole('button', { name: 'Nova Estação' })).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('deve apontar o nome de cada estação para o dashboard dela quando a tabela carrega', async () => {
    // Dado
    vi.spyOn(api, 'get').mockResolvedValue({ data: STATUS })

    // Quando
    renderPlatform('MUNICIPE')
    await screen.findByText('Estação Centro')

    // Então
    expect(screen.getByRole('link', { name: /Estação Centro/ })).toHaveAttribute('href', '/platform/dashboard/e1')
    expect(screen.getByRole('link', { name: /Estação Norte/ })).toHaveAttribute('href', '/platform/dashboard/e2')
  })

  it('deve abrir /platform/dashboard/e2 quando clicar no nome da segunda estação', async () => {
    // Dado
    vi.spyOn(api, 'get').mockResolvedValue({ data: STATUS })
    renderPlatformComRotas('MUNICIPE')
    const linkSegundaEstacao = await screen.findByRole('link', { name: /Estação Norte/ })

    // Quando
    fireEvent.click(linkSegundaEstacao)

    // Então
    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('localizacao')).toHaveTextContent('/platform/dashboard/e2')
  })

  it('deve mostrar o índice e a classificação quando a análise devolve número', async () => {
    // Dado
    mockarApi({
      e1: { estacaoId: 'e1', indice: 14, status: 'Boa', rotuloFaixa: 'Boa', cor: '#00E400', mensagem: '' },
      e2: { estacaoId: 'e2', indice: 35, status: 'Moderada', rotuloFaixa: 'Moderada', cor: '#EAB308', mensagem: '' },
    })

    // Quando
    renderPlatform('MUNICIPE')
    await screen.findByText('Estação Centro')

    // Então
    expect(await screen.findByText('14')).toBeInTheDocument()
    expect(screen.getByText('Boa')).toBeInTheDocument()
    expect(screen.getByText('35')).toBeInTheDocument()
    expect(screen.getByText('Moderada')).toBeInTheDocument()
  })

  it('deve mostrar Sem dados suficientes quando a análise devolve esse texto', async () => {
    // Dado
    mockarApi({
      e1: { estacaoId: 'e1', indice: 'Sem dados suficientes', status: 'Sem dados suficientes', rotuloFaixa: 'Sem dados suficientes', mensagem: '' },
      e2: { estacaoId: 'e2', indice: 'Sem dados suficientes', status: 'Sem dados suficientes', rotuloFaixa: 'Sem dados suficientes', mensagem: '' },
    })

    // Quando
    renderPlatform('MUNICIPE')

    // Então
    expect(await screen.findAllByText('Sem dados suficientes')).toHaveLength(2)
    expect(screen.queryByText('Sem leitura')).not.toBeInTheDocument()
  })

  it('deve mostrar Sem leitura só na estação cuja chamada de IQAr falhou quando as outras respondem', async () => {
    // Dado
    mockarApi({
      e1: { estacaoId: 'e1', indice: 14, status: 'Boa', rotuloFaixa: 'Boa', cor: '#00E400', mensagem: '' },
      e2: new Error('Network Error'),
    })

    // Quando
    renderPlatform('MUNICIPE')

    // Então
    expect(await screen.findByText('14')).toBeInTheDocument()
    expect(screen.getAllByText('Sem leitura')).toHaveLength(1)
    expect(screen.getByText('Estação Norte')).toBeInTheDocument()
  })

  it('deve continuar carregando a Visão Geral quando todas as chamadas de IQAr falham', async () => {
    // Dado
    mockarApi({ e1: new Error('Network Error'), e2: new Error('Network Error') })

    // Quando
    renderPlatform('MUNICIPE')

    // Então
    expect(await screen.findByText('Estação Centro')).toBeInTheDocument()
    expect(screen.getByText('Estação Norte')).toBeInTheDocument()
    expect(screen.getAllByText('Sem leitura')).toHaveLength(2)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('deve não consultar o IQAr quando a estação está inativa', async () => {
    // Dado
    const status = {
      resumo: { total: 2, ativas: 1, com_falha: 0, inativas: 1 },
      estacoes: [
        STATUS.estacoes[0],
        { id: 'e3', codigo: 'SJC-003', nome: 'Estação Sul', status_operacional: 'Inativa', ultimo_ping: null },
      ],
    }
    const get = mockarApi({
      e1: { estacaoId: 'e1', indice: 14, status: 'Boa', rotuloFaixa: 'Boa', cor: '#00E400', mensagem: '' },
    }, status)

    // Quando
    renderPlatform('MUNICIPE')
    await screen.findByText('Estação Sul')

    // Então
    await waitFor(() => expect(get).toHaveBeenCalledWith('/analise/iqar', { params: { estacaoId: 'e1' } }))
    expect(get).not.toHaveBeenCalledWith('/analise/iqar', { params: { estacaoId: 'e3' } })
  })

  it.each(['GESTOR_PUBLICO', 'ADMINISTRADOR'])('%s continua vendo os indicadores e a tabela de estações', async (papel) => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: STATUS })

    renderPlatform(papel)

    expect(await screen.findByText('Estação Centro')).toBeInTheDocument()
    expect(screen.getByText('Estação Norte')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nova Estação' })).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith('/estacoes/status')
  })

  it('para quem tem acesso, a falha de conexão mostra a mensagem e o botão de tentar de novo', async () => {
    const get = vi.spyOn(api, 'get')
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValue({ data: STATUS })

    renderPlatform('GESTOR_PUBLICO')

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro no servidor ao carregar as estações. Tente novamente em instantes.')
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Estação Centro')).toBeInTheDocument()
    await waitFor(() => expect(get.mock.calls.filter(([url]) => url === '/estacoes/status')).toHaveLength(2))
  })

  it('para ADMINISTRADOR, busca o município em /estacoes quando /estacoes/status não retorna o campo', async () => {
    const get = vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
      if (url === '/estacoes/status') return { data: STATUS }
      if (url === '/estacoes') {
        return {
          data: [
            { id: 'e1', municipio: 'São José dos Campos' },
            { id: 'e2', municipio: 'Taubaté' },
          ],
        }
      }
      return { data: [] }
    })

    renderPlatform('ADMINISTRADOR')

    expect(await screen.findByText('Estação Centro')).toBeInTheDocument()
    expect(screen.getAllByText('São José dos Campos').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Taubaté').length).toBeGreaterThan(0)
    expect(get).toHaveBeenCalledWith('/estacoes/status')
    expect(get).toHaveBeenCalledWith('/estacoes')
  })
})
