import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthProvider'
import api from '../api/instance'
import exemplos from '../services/alarms/exemplos-openapi.json'
import { AppRoutes } from './AppRoutes'

function Location() {
  return <output data-testid="location">{useLocation().pathname}</output>
}

function renderComo(papel: string, path: string) {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))
  localStorage.setItem('token', `header.${payload}.signature`)
  localStorage.setItem(
    'usuario',
    JSON.stringify({ id: 'usuario-teste', nome: 'Maria Silva', papel, municipio: 'São José dos Campos' }),
  )
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
        <Location />
      </AuthProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(api, 'get').mockImplementation(async (url) => {
    if (url === '/estacoes/status') return { data: { estacoes: [], resumo: {} } }
    if (url === '/alertas/alarmes/resumo') return { data: exemplos.resumo }
    return { data: [] }
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('Menu e rota de alarmes (US-24)', () => {
  it.each([['ADMINISTRADOR'], ['GESTOR_PUBLICO']])('%s vê o item Alarmes e abre a tela', async (papel) => {
    renderComo(papel, '/platform/alarmes')

    expect(within(screen.getByRole('complementary')).getByRole('button', { name: 'Alarmes' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Alarmes' })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/platform/alarmes')
  })

  it('cenário 5: o pesquisador não vê o item nem abre a rota de Alarmes', async () => {
    renderComo('PESQUISADOR', '/platform/alarmes')

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/platform$/))
    expect(within(screen.getByRole('complementary')).queryByRole('button', { name: 'Alarmes' })).not.toBeInTheDocument()
    expect(api.get).not.toHaveBeenCalledWith('/alertas/alarmes', expect.anything())
    expect(api.get).not.toHaveBeenCalledWith('/alertas/alarmes/resumo')
  })

  it('o indicador aparece no cabeçalho de outras telas', async () => {
    renderComo('GESTOR_PUBLICO', '/platform')

    expect(await screen.findByRole('link', { name: 'Alarmes abertos: 3' })).toBeInTheDocument()
  })
})
