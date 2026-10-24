import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthProvider'
import api from '../api/instance'
import { AppRoutes } from './AppRoutes'

const ESTACAO = '9c8b7a6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d'

function Location() {
  return <output data-testid="location">{useLocation().pathname}</output>
}

function renderComPerfil(papel: string, path = '/platform') {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))
  localStorage.setItem('token', `header.${payload}.signature`)
  localStorage.setItem('usuario', JSON.stringify({
    id: 'usuario-teste', nome: 'Maria Silva', papel, municipio: 'São José dos Campos',
  }))
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
        <Location />
      </AuthProvider>
    </MemoryRouter>,
  )
}

const chamou = (url: string) => vi.mocked(api.get).mock.calls.some(([chamada]) => chamada === url)

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(api, 'get').mockImplementation(async (url) => ({
    data: url === '/estacoes/status' ? { estacoes: [], resumo: {} } : [],
  }))
  vi.spyOn(api, 'post').mockResolvedValue({ data: {} })
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('Menu e rotas por perfil (TASK 24.04)', () => {
  it.each(['ADMINISTRADOR', 'GESTOR_PUBLICO'])('%s vê Alertas no menu e abre as regras de alerta', async (papel) => {
    renderComPerfil(papel)
    const menu = within(screen.getByRole('navigation'))
    fireEvent.click(menu.getByRole('button', { name: 'Alertas' }))

    expect(await screen.findByRole('heading', { name: 'Regras de Alerta' })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/alerts')
    await waitFor(() => expect(chamou('/alertas/regras-alerta')).toBe(true))
  })

  it('o pesquisador não vê o item Alertas no menu', () => {
    renderComPerfil('PESQUISADOR')
    const menu = within(screen.getByRole('navigation'))

    expect(menu.getByRole('button', { name: 'Visão Geral' })).toBeInTheDocument()
    expect(menu.queryByRole('button', { name: 'Alertas' })).not.toBeInTheDocument()
  })

  it('o pesquisador que abre /alerts pela URL volta para a Visão Geral sem consultar as regras', async () => {
    renderComPerfil('PESQUISADOR', '/alerts')

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/platform$/))
    expect(screen.queryByRole('heading', { name: 'Regras de Alerta' })).not.toBeInTheDocument()
    expect(chamou('/alertas/regras-alerta')).toBe(false)
  })

  it('o pesquisador que abre o detalhe de uma estação pela URL volta para a Visão Geral sem consultar os sensores', async () => {
    renderComPerfil('PESQUISADOR', `/platform/estacoes/${ESTACAO}`)

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/platform$/))
    expect(chamou(`/estacoes/estacoes/${ESTACAO}/sensores`)).toBe(false)
  })

  it.each(['ADMINISTRADOR', 'GESTOR_PUBLICO'])('%s continua abrindo o detalhe de uma estação', async (papel) => {
    renderComPerfil(papel, `/platform/estacoes/${ESTACAO}`)

    await waitFor(() => expect(chamou(`/estacoes/estacoes/${ESTACAO}/sensores`)).toBe(true))
    expect(screen.getByTestId('location')).toHaveTextContent(`/platform/estacoes/${ESTACAO}`)
  })
})
