import axios from 'axios'
import { getValidToken } from '../auth/session'

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/',
})

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
    return Promise.reject(error)
  },
)

export default instance