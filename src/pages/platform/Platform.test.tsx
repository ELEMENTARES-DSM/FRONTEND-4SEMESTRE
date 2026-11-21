import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
      .mockResolvedValueOnce({ data: STATUS })

    renderPlatform('GESTOR_PUBLICO')

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro no servidor ao carregar as estações. Tente novamente em instantes.')
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Estação Centro')).toBeInTheDocument()
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2))
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
