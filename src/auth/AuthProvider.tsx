import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../api/instance'
import { AuthContext } from './AuthContext'
import { clearStoredSession, readStoredSession, tokenExpiresAt } from './session'
import type { Session, Usuario } from './session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readStoredSession)
  const navigate = useNavigate()
  const location = useLocation()

  const clear = useCallback(() => {
    clearStoredSession()
    setSession(null)
  }, [])

  useEffect(() => {
    const sync = () => setSession(readStoredSession())
    const unauthorized = () => {
      clear()
      const from = location.pathname.startsWith('/platform')
        ? location.pathname + location.search
        : '/platform'
      navigate('/login', { replace: true, state: { from } })
    }
    window.addEventListener('storage', sync)
    window.addEventListener('auth:unauthorized', unauthorized)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('auth:unauthorized', unauthorized)
    }
  }, [clear, location.pathname, location.search, navigate])

  useEffect(() => {
    if (!session) return
    const expiresAt = tokenExpiresAt(session.token)
    const remaining = expiresAt === null ? 0 : expiresAt - Date.now()
    const timer = window.setTimeout(() => {
      setSession(readStoredSession())
    }, Math.max(0, Math.min(remaining, 2_147_483_647)))
    return () => window.clearTimeout(timer)
  }, [session])

  const login = async (email: string, senha: string) => {
    const response = await api.post<{ token: string; usuario: Usuario }>('/auth/login', { email, senha })
    const { token, usuario } = response.data
    if (typeof token !== 'string' || (tokenExpiresAt(token) ?? 0) <= Date.now()
      || !usuario || typeof usuario.id !== 'string'
      || typeof usuario.nome !== 'string' || typeof usuario.papel !== 'string') {
      throw new Error('Resposta de login inválida.')
    }
    localStorage.setItem('token', token)
    localStorage.setItem('usuario', JSON.stringify(usuario))
    setSession({ token, usuario })
  }

  const logout = async () => {
    try {
      if (session?.token) await api.post('/auth/logout')
    } catch {
    } finally {
      clear()
      navigate('/login', { replace: true })
    }
  }

  return (
    <AuthContext.Provider value={{ token: session?.token ?? null, usuario: session?.usuario ?? null, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
