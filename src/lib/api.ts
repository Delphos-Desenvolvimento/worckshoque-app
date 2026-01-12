import { useAuthStore, getApiBaseUrl } from '@/stores/authStore';
import axios, { AxiosInstance } from 'axios';

// Usando a função centralizada para obter a URL base
const API_BASE_URL = getApiBaseUrl();

const styleTitle = 'color:#fff;background:#dc2626;padding:2px 6px;border-radius:4px;font-weight:600';
const styleKey = 'color:#111;font-weight:600';
const styleVal = 'color:#374151';

// Erro personalizado para sessão expirada
export class SessionExpiredError extends Error {
  constructor() {
    super('Sessão expirada');
    this.name = 'SessionExpiredError';
  }
}

// Flag para evitar múltiplos redirecionamentos simultâneos
let isRedirecting = false;

async function logHttpError(url: string, method: string | undefined, response: Response) {
  const status = response.status;
  const contentType = response.headers.get('content-type') || '';
  let jsonBody: unknown = undefined;
  let textBody = '';
  try {
    const clone = response.clone();
    if (contentType.includes('application/json')) {
      jsonBody = await clone.json();
    } else {
      textBody = await clone.text();
    }
  } catch {
    textBody = '';
  }
  let message = '';
  let errorId: string | undefined = undefined;
  let statusCode = status;
  if (jsonBody && typeof jsonBody === 'object') {
    const obj = jsonBody as Record<string, unknown>;
    const m = obj.message;
    const e = obj.errorId ?? obj.traceId;
    const sc = obj.statusCode;
    message = typeof m === 'string' ? m : JSON.stringify(obj);
    errorId = typeof e === 'string' ? e : undefined;
    if (typeof sc === 'number') statusCode = sc;
  } else {
    message = textBody;
  }
  console.groupCollapsed(`%c⛔ HTTP ${method ?? ''} ${status} ${url}`, styleTitle);
  console.log('%cstatus%c', styleKey, styleVal, status);
  console.log('%cmethod%c', styleKey, styleVal, method ?? 'UNKNOWN');
  console.log('%curl%c', styleKey, styleVal, url);
  if (errorId) console.log('%cerrorId%c', styleKey, styleVal, errorId);
  if (message) console.log('%cmessage%c', styleKey, styleVal, message);
  console.log('%ccontent-type%c', styleKey, styleVal, contentType || 'n/a');
  console.groupEnd();
}

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
  // console.log('Fazendo requisição para:', url); // Removido log excessivo
  const response = await fetch(url, config);
  
  if (response.status === 401) {
    if (!isRedirecting) {
      isRedirecting = true;
      console.warn('API 401 detectado, invalidando sessão e redirecionando');
      const authStore = useAuthStore.getState();
      authStore.logout();
      window.location.href = '/login';
    }
    // Rejeitar a promessa com erro específico
    return Promise.reject(new SessionExpiredError());
  }

  if (response.status >= 400) {
    await logHttpError(url, config.method, response);
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
    const e = error as { response?: { status?: number; data?: unknown }; config?: { url?: string; method?: string } };
    const status = e.response?.status ?? 0;
    const url = e.config?.url ?? '';
    const method = e.config?.method ? e.config.method.toUpperCase() : undefined;
    if (status >= 400) {
      const data = e.response?.data;
      let message = '';
      let errorId: string | undefined = undefined;
      if (data && typeof data === 'object') {
        const obj = data as Record<string, unknown>;
        const m = obj.message;
        const id = obj.errorId ?? obj.traceId;
        message = typeof m === 'string' ? m : JSON.stringify(obj);
        errorId = typeof id === 'string' ? id : undefined;
      } else {
        message = typeof data === 'string' ? data : '';
      }
      console.groupCollapsed(`%c⛔ HTTP ${method ?? ''} ${status} ${url}`, styleTitle);
      console.log('%cstatus%c', styleKey, styleVal, status);
      console.log('%cmethod%c', styleKey, styleVal, method ?? 'UNKNOWN');
      console.log('%curl%c', styleKey, styleVal, url);
      if (errorId) console.log('%cerrorId%c', styleKey, styleVal, errorId);
      if (message) console.log('%cmessage%c', styleKey, styleVal, message);
      console.groupEnd();
    }
    // Interceptor para tratar erros de autenticação no axios
    if (error.response?.status === 401) {
      if (!isRedirecting) {
        isRedirecting = true;
        console.warn('Axios 401: Token inválido ou expirado, fazendo logout');
        const authStore = useAuthStore.getState();
        authStore.logout();
        window.location.href = '/login';
      }
      // Rejeitar a promessa para evitar que o código de chamada fique pendurado
      return Promise.reject(new SessionExpiredError());
    }
    return Promise.reject(error);
  }
);
