import axios from 'axios'
import { getValidToken } from '../auth/session'
import { env } from '../config/env'

const instance = axios.create({
  baseURL: env.apiUrl || '/',
  headers: { 'Content-Type': 'application/json' },
})

// O adaptador de testes nunca é ativado no build de produção.
if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true') {
  instance.defaults.adapter = async (config) => {
    const { mockApiAdapter } = await import('../mocks/apiAdapter')
    return mockApiAdapter(config)
  }
}

instance.interceptors.request.use((config) => {
  const token = getValidToken()
  if (token && config.url !== '/auth/login') {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url
    const authorization = error.config?.headers?.Authorization
    const sentToken = typeof authorization === 'string' && authorization.startsWith('Bearer ')
      ? authorization.slice(7)
      : null

    // A falha do login pertence ao formulário; uma resposta atrasada de uma
    // sessão anterior não deve encerrar uma sessão criada depois.
    if (error.response?.status === 401 && url !== '/auth/login' && url !== '/auth/logout'
      && sentToken && sentToken === localStorage.getItem('token')) {
      window.dispatchEvent(new Event('auth:unauthorized'))
    }

    if (error.response?.status === 403) {
      const serverMessage =
        error.response.data?.erro ||
        error.response.data?.message ||
        'Acesso negado. Perfil insuficiente para esta ação.'

      window.dispatchEvent(
        new CustomEvent('auth:forbidden', {
          detail: {
            url,
            status: 403,
            message: serverMessage,
            data: error.response.data,
          },
        }),
      )
    }

    return Promise.reject(error)
  },
)

export default instance
