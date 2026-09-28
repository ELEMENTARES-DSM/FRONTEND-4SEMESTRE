import { createContext } from 'react'
import type { Usuario } from './session'

export interface AuthValue {
  token: string | null
  usuario: Usuario | null
  login: (email: string, senha: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthValue | null>(null)
