import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthProvider'
import api from '../api/instance'
import { AppRoutes } from './AppRoutes'

function Location() {
  return <output data-testid="location">{useLocation().pathname}</output>
}

function renderNavigation(papel: string | null, path = '/platform') {
  if (papel) {
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))
    localStorage.setItem('token', `header.${payload}.signature`)
    localStorage.setItem('usuario', JSON.stringify({
      id: 'usuario-teste', nome: 'Maria Silva', papel, municipio: 'São José dos Campos',
    }))
  }
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
  vi.spyOn(api, 'get').mockImplementation(async (url) => ({
    data: url === '/estacoes/status' ? { estacoes: [], resumo: {} } : [],
  }))
  vi.spyOn(api, 'post').mockResolvedValue({ data: {} })
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('Navegação autenticada pela sidebar', () => {
  it.each([
    ['ADMINISTRADOR', 'Administrador', true],
    ['GESTOR_PUBLICO', 'Gestor Público', false],
    ['PESQUISADOR', 'Pesquisador', false],
  ])('mostra nome, perfil e menu corretos para %s', async (papel, label, canManageUsers) => {
    renderNavigation(papel)
    const sidebar = within(screen.getByRole('complementary'))
    expect(sidebar.getByText('Maria Silva')).toBeInTheDocument()
    expect(sidebar.getByText(label)).toBeInTheDocument()
    expect(sidebar.queryByText('INMET / USP')).not.toBeInTheDocument()
    expect(Boolean(sidebar.queryByRole('button', { name: 'Usuários' }))).toBe(canManageUsers)
    const panel = within(screen.getByRole('heading', { name: 'Plataforma' }).closest('main')!)
    expect(panel.queryByText('Usuários')).not.toBeInTheDocument()
    expect(panel.queryByRole('button', { name: 'Sair' })).not.toBeInTheDocument()
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/estacoes/status'))
  })

  it.each([false, true])('navega para usuários pelo menu do administrador com sidebar recolhida=%s', async (recolhida) => {
    renderNavigation('ADMINISTRADOR')
    if (recolhida) fireEvent.click(screen.getByRole('button', { name: 'Recolher sidebar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Usuários' }))
    expect(await screen.findByRole('heading', { name: 'Gestão de Usuários' })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/platform/usuarios')
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/usuarios/'))
  })

  it.each(['GESTOR_PUBLICO', 'PESQUISADOR'])('bloqueia acesso direto a usuários para %s', async (papel) => {
    renderNavigation(papel, '/platform/usuarios')
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/platform$/))
    expect(screen.queryByRole('heading', { name: 'Gestão de Usuários' })).not.toBeInTheDocument()
    expect(api.get).not.toHaveBeenCalledWith('/usuarios/')
  })

  it('bloqueia acesso direto a usuários sem autenticação', async () => {
    renderNavigation(null, '/platform/usuarios')
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/login'))
    expect(api.get).not.toHaveBeenCalledWith('/usuarios/')
  })

  it.each([false, true])('encerra a sessão pela sidebar recolhida=%s e redireciona para login', async (recolhida) => {
    renderNavigation('ADMINISTRADOR')
    if (recolhida) fireEvent.click(screen.getByRole('button', { name: 'Recolher sidebar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/login'))
    expect(api.post).toHaveBeenCalledWith('/auth/logout')
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('usuario')).toBeNull()
  })

  it('mantém a sessão e permite tentar novamente quando o logout falha', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error('Falha de conexão'))
    renderNavigation('GESTOR_PUBLICO')
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível encerrar a sessão.')
    expect(localStorage.getItem('token')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Sair' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/login'))
  })

  it.each(['ADMINISTRADOR', 'GESTOR_PUBLICO'])('recolhe e expande preservando navegação e permissões de %s', async (papel) => {
    renderNavigation(papel)
    fireEvent.click(screen.getByRole('button', { name: 'Recolher sidebar' }))
    expect(screen.getByRole('button', { name: 'Expandir sidebar' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: 'Visão Geral' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Estações' })).toHaveAttribute('title', 'Estações')
    expect(screen.getByRole('button', { name: 'Sair' })).toHaveAttribute('title', 'Sair')
    expect(Boolean(screen.queryByRole('button', { name: 'Usuários' }))).toBe(papel === 'ADMINISTRADOR')
    fireEvent.click(screen.getByRole('button', { name: 'Estações' }))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/platform/territory'))
    expect(screen.getByRole('button', { name: 'Estações' })).toHaveAttribute('aria-current', 'page')
    fireEvent.click(screen.getByRole('button', { name: 'Expandir sidebar' }))
    expect(screen.getByRole('button', { name: 'Recolher sidebar' })).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Visão Geral' }))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/platform$/))
  })
})
