import { useAuthStore, getApiBaseUrl } from '@/stores/authStore';
import axios, { AxiosInstance } from 'axios';

// Usando a função centralizada para obter a URL base
const API_BASE_URL = getApiBaseUrl();

// Função para fazer requisições autenticadas
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const authStore = useAuthStore.getState();
  const token = authStore.token;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  // Normaliza a URL base e o endpoint, evitando duplicar "/api"
  const base = API_BASE_URL.replace(/\/+$/, '');
  const rawEndpoint = endpoint.replace(/^\/+/, '');
  const baseHasApi = /\/api$/.test(base);
  const endpointStartsWithApi = rawEndpoint.startsWith('api/');
  const normalizedEndpoint = baseHasApi && endpointStartsWithApi
    ? rawEndpoint.slice(4)
    : rawEndpoint;
  const url = `${base}/${normalizedEndpoint}`;
  console.log('Fazendo requisição para:', url);
  const response = await fetch(url, config);
  
  // Log apenas erros 401 para debug
  if (response.status === 401) {
    console.error('❌ [apiRequest] 401 Unauthorized para:', url);
    const responseText = await response.clone().text().catch(() => '');
    console.error('❌ [apiRequest] Resposta 401:', responseText);
  }
  
  // Tratar erros 401 de forma MUITO conservadora
  // NÃO fazer logout automaticamente - apenas se o token realmente expirou
  if (response.status === 401 && token) {
    // Verificar se o token realmente expirou (decodificar JWT)
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        const exp = payload.exp * 1000; // Converter para milissegundos
        const now = Date.now();
        
        // Se o token realmente expirou (com margem de 5 minutos para evitar problemas de sincronização)
        if (exp < (now - 5 * 60 * 1000)) {
          console.warn('Token expirado detectado, fazendo logout');
          const authStore = useAuthStore.getState();
          authStore.logout();
          // Não redirecionar imediatamente
        } else {
          // Token não expirou, pode ser problema de permissão ou autenticação
          // Não fazer logout, apenas retornar o erro
        }
      }
    } catch {
      // Se não conseguir decodificar, NÃO fazer logout
      // Pode ser erro de permissão, não de token
    }
    
    // Para TODOS os outros 401, apenas retornar o erro sem fazer logout
    // Deixar o componente tratar o erro adequadamente
  }
  
  return response;
};

// Métodos de conveniência
export const api = {
  get: (endpoint: string, options?: RequestInit) =>
    apiRequest(endpoint, { ...options, method: 'GET' }),
    
  post: (endpoint: string, data?: unknown, options?: RequestInit) =>
    apiRequest(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  put: (endpoint: string, data?: unknown, options?: RequestInit) =>
    apiRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: (endpoint: string, data?: unknown, options?: RequestInit) =>
    apiRequest(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  delete: (endpoint: string, options?: RequestInit) =>
    apiRequest(endpoint, { ...options, method: 'DELETE' }),
};

// Instância do axios configurada com a URL base centralizada
// Use esta instância para requisições que precisam de axios (ex: uploads, progress, etc)
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token automaticamente
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ [axiosInstance] Token não encontrado para requisição:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de autenticação
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // NÃO fazer logout automaticamente em erros 401
    // Apenas verificar se o token realmente expirou
    if (error.response?.status === 401) {
      const authStore = useAuthStore.getState();
      const token = authStore.token;
      
      // Só verificar expiração se tiver token
      if (token) {
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            const exp = payload.exp * 1000; // Converter para milissegundos
            const now = Date.now();
            
            // Se o token realmente expirou E tiver passado pelo menos 10 segundos
            // (evitar falsos positivos durante hot reload)
            const minExpirationTime = 10 * 1000; // 10 segundos
            if (exp < now && (Date.now() - exp) > minExpirationTime) {
              console.warn('Token expirado detectado no interceptor, fazendo logout');
              authStore.logout();
            }
          }
        } catch {
          // Se não conseguir decodificar, NÃO fazer logout
          // Pode ser erro de permissão, não de token
        }
      }
      
      // Para TODOS os 401, apenas rejeitar o erro sem fazer logout
      // Deixar o componente tratar o erro adequadamente
    }
    return Promise.reject(error);
  }
);
