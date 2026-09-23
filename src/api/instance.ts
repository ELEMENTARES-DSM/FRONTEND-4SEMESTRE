import axios from 'axios'

// Instancia axios para uso em todas as requisições
const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
    headers:{
        'Content-Type': 'application/json',
    }
})

// O adaptador de testes nunca é ativado no build de produção.
if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true') {
    instance.defaults.adapter = async (config) => {
        const { mockApiAdapter } = await import('../mocks/apiAdapter');
        return mockApiAdapter(config);
    };
}

// Interceptor para requisições com Bearer Token
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            // O formato esperado pelo backend é "Bearer [token]"
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default instance