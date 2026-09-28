// @vitest-environment happy-dom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Login } from './Login'

// O hook é simulado: nenhum teste envia credenciais ao backend.
const authMock = vi.hoisted(() => ({
  token: null as string | null,
  login: vi.fn(),
}))

vi.mock('../../auth/useAuth', () => ({
  useAuth: () => authMock,
}))

vi.mock('../../auth/session', () => ({
  devAuthBypass: false,
}))

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/platform" element={<p>Página protegida</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

function fillForm() {
  fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
    target: { value: '  usuario@exemplo.com  ' },
  })
  fireEvent.change(screen.getByLabelText('Senha'), {
    target: { value: 'senha-segura' },
  })
  fireEvent.click(screen.getByRole('button', { name: /Acessar plataforma/i }))
}

describe('Login', () => {
  afterEach(cleanup)

  beforeEach(() => {
    authMock.token = null
    authMock.login.mockReset()
  })

  it('envia as credenciais e abre a plataforma após autenticar', async () => {
    authMock.login.mockResolvedValueOnce(undefined)
    renderLogin()

    fillForm()

    await waitFor(() => {
      expect(authMock.login).toHaveBeenCalledWith(
        'usuario@exemplo.com',
        'senha-segura',
      )
    })
    expect(await screen.findByText('Página protegida')).toBeInTheDocument()
  })

  it.each([
    [401, 'Email ou senha incorretos.'],
    [403, 'Esta conta não está ativa.'],
  ])('mostra o erro correto quando a API responde %i', async (status, message) => {
    authMock.login.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status },
    })
    renderLogin()

    fillForm()

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.queryByText('Página protegida')).not.toBeInTheDocument()
  })

  it('redireciona quem já possui token sem exibir o formulário', () => {
    authMock.token = 'token-existente'
    renderLogin()

    expect(screen.getByText('Página protegida')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Acessar plataforma/i }))
      .not.toBeInTheDocument()
    expect(authMock.login).not.toHaveBeenCalled()
  })
})
