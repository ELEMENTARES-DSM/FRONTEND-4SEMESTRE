import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { AuthContext } from '../auth/AuthContext'
import { AuthProvider } from '../auth/AuthProvider'
import type { Usuario } from '../auth/session'

function createFakeJwt(expiresInSeconds = 3600): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expiresInSeconds }),
  )
  return `${header}.${payload}.signature`
}

function renderWithRouter({
  initialRoute = '/platform/territory',
  usuario = null,
  token = null,
  allowedRoles,
  requiredPermission,
}: {
  initialRoute?: string
  usuario?: Usuario | null
  token?: string | null
  allowedRoles?: ('ADMINISTRADOR' | 'GESTOR_PUBLICO' | 'PESQUISADOR')[]
  requiredPermission?: 'territory.access' | 'stations.view' | 'stations.create' | 'stations.toggle-status'
}) {
  const authValue = {
    token,
    usuario,
    login: async () => {},
    logout: async () => {},
  }

  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/login" element={<div>Tela de Login</div>} />
          <Route path="/platform" element={<div>Dashboard da Plataforma</div>} />
          <Route
            path="/platform/territory"
            element={
              <ProtectedRoute
                allowedRoles={allowedRoles}
                requiredPermission={requiredPermission}
              >
                <div>Tela de Território Permitida</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('ProtectedRoute - Controle de Acesso a Rotas', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('redireciona usuário não autenticado para /login', () => {
    renderWithRouter({
      token: null,
      usuario: null,
      requiredPermission: 'territory.access',
    })

    expect(screen.getByText('Tela de Login')).toBeInTheDocument()
    expect(screen.queryByText('Tela de Território Permitida')).not.toBeInTheDocument()
  })

  it('permite acesso a /platform/territory quando usuário é ADMINISTRADOR', () => {
    const token = createFakeJwt()
    localStorage.setItem('token', token)

    renderWithRouter({
      token,
      usuario: {
        id: 'user-admin',
        nome: 'Admin User',
        papel: 'ADMINISTRADOR',
        municipio: null,
      },
      requiredPermission: 'territory.access',
      allowedRoles: ['ADMINISTRADOR', 'GESTOR_PUBLICO'],
    })

    expect(screen.getByText('Tela de Território Permitida')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard da Plataforma')).not.toBeInTheDocument()
  })

  it('bloqueia acesso e redireciona para /platform quando usuário é PESQUISADOR', () => {
    const token = createFakeJwt()
    localStorage.setItem('token', token)

    renderWithRouter({
      token,
      usuario: {
        id: 'user-pesq',
        nome: 'Pesquisador User',
        papel: 'PESQUISADOR',
        municipio: null,
      },
      requiredPermission: 'territory.access',
      allowedRoles: ['ADMINISTRADOR', 'GESTOR_PUBLICO'],
    })

    expect(screen.queryByText('Tela de Território Permitida')).not.toBeInTheDocument()
    expect(screen.getByText('Dashboard da Plataforma')).toBeInTheDocument()
  })

  it('mantém bloqueio de PESQUISADOR mesmo após simulação de F5 (persistência em localStorage)', () => {
    const token = createFakeJwt()
    const usuarioPesquisador = {
      id: 'user-pesq',
      nome: 'Pesquisador Persistido',
      papel: 'PESQUISADOR',
      municipio: null,
    }

    localStorage.setItem('token', token)
    localStorage.setItem('usuario', JSON.stringify(usuarioPesquisador))

    render(
      <MemoryRouter initialEntries={['/platform/territory']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Tela de Login</div>} />
            <Route path="/platform" element={<div>Dashboard da Plataforma</div>} />
            <Route
              path="/platform/territory"
              element={
                <ProtectedRoute requiredPermission="territory.access">
                  <div>Tela de Território Permitida</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.queryByText('Tela de Território Permitida')).not.toBeInTheDocument()
    expect(screen.getByText('Dashboard da Plataforma')).toBeInTheDocument()
  })
})
