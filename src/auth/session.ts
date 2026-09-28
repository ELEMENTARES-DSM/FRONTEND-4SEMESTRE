export interface Usuario {
  id: string
  nome: string
  papel: string
  municipio: string | null
}

export interface Session {
  token: string
  usuario: Usuario
}

export const devAuthBypass = import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_BYPASS === 'true'

export function clearStoredSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')
}

// Recebe um token JWT e tenta descobrir quando ele expira.
export function tokenExpiresAt(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null
  } catch {
    return null
  }
}

// Procura o token no localStorage e verifica se ele ainda está válido.
export function getValidToken(): string | null {
  const token = localStorage.getItem('token')
  if (!token) return null
  const expiresAt = tokenExpiresAt(token)
  if (expiresAt === null || expiresAt <= Date.now()) return null
  return token
}

//Tenta recuperar a sessão salva no navegador.
export function readStoredSession(): Session | null {
  const token = getValidToken()
  const saved = localStorage.getItem('usuario')
  if (!token || !saved) {
    clearStoredSession()
    return null
  }
  try {
    const usuario: unknown = JSON.parse(saved)
    if (typeof usuario !== 'object' || usuario === null || !('id' in usuario)
      || !('nome' in usuario) || !('papel' in usuario)
      || typeof usuario.id !== 'string' || typeof usuario.nome !== 'string'
      || typeof usuario.papel !== 'string') throw new Error('Perfil inválido')
    // Criando uma Session
    return { token, usuario: usuario as Usuario }
  } catch {
    clearStoredSession()
    return null
  }
}
