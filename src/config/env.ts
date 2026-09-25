export const getEnv = () => ({
  apiUrl: import.meta.env.VITE_API_URL || '/',
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
  ambiente: import.meta.env.VITE_AMBIENTE || 'desenvolvimento',
})

export const env = {
  get apiUrl() {
    return import.meta.env.VITE_API_URL || '/'
  },
  get useMock() {
    return import.meta.env.VITE_USE_MOCK === 'true'
  },
  get ambiente() {
    return import.meta.env.VITE_AMBIENTE || 'desenvolvimento'
  },
}
