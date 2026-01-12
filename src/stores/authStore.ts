import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Permission } from '../contexts/PermissionsContext';

export type UserRole = 'user' | 'admin' | 'master';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company?: string;
  created_at: string;
  updated_at: string;
  permissions?: string[]; // Permissões efetivas do usuário (role + customizadas)
  allowed?: Record<string, boolean>; // Permissões customizadas específicas do usuário
  customPermissions?: Permission[]; // DEPRECATED - usar permissions
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
  refreshUserPermissions: () => Promise<void>;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  company?: string;
  role?: UserRole;
}

type AuthStore = AuthState & AuthActions;

// Configuração centralizada da URL base da API
export const getApiBaseUrl = () => {
  let envUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  envUrl = envUrl.replace(/\/+$/, '');
  
  const baseUrl = envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  
  console.log('URL da API configurada:', baseUrl);
  return baseUrl;
};

const API_BASE_URL = getApiBaseUrl();

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Ações
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const ct = response.headers.get('content-type') || '';
            let errMsg = 'Credenciais inválidas';
            try {
              const clone = response.clone();
              if (ct.includes('application/json')) {
                const body = await clone.json();
                if (body && typeof body === 'object' && 'message' in (body as Record<string, unknown>)) {
                  errMsg = String((body as Record<string, unknown>).message);
                }
              } else {
                errMsg = await clone.text();
              }
            } catch (_err) { void _err; }
            throw new Error(errMsg);
          }

          const data = await response.json();
          
          set({
            user: data.user,
            token: data.access_token,
            isAuthenticated: true,
            isLoading: false,
          });

          return true;
        } catch (error) {
          console.error('Erro no login:', error);
          set({ isLoading: false });
          return false;
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true });
        
        try {
          const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          });

          if (!response.ok) {
            const ct = response.headers.get('content-type') || '';
            let errMsg = 'Erro no cadastro';
            try {
              const clone = response.clone();
              if (ct.includes('application/json')) {
                const body = await clone.json();
                if (body && typeof body === 'object' && 'message' in (body as Record<string, unknown>)) {
                  errMsg = String((body as Record<string, unknown>).message);
                }
              } else {
                errMsg = await clone.text();
              }
            } catch (_err) { void _err; }
            throw new Error(errMsg);
          }

          await response.json();
          
          set({
            isLoading: false,
          });

          return true;
        } catch (error) {
          console.error('Erro no cadastro:', error);
          set({ isLoading: false });
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      setToken: (token: string) => {
        set({ token });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      refreshUserPermissions: async () => {
        const { user, token } = get();
        
        if (!user || !token) {
          console.warn('🚨 [refreshUserPermissions] Usuário ou token não encontrado');
          return;
        }

        try {
          console.log('🔄 [refreshUserPermissions] Atualizando permissões para usuário:', user.name);
          
          const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const userData = await response.json();
            console.log('✅ [refreshUserPermissions] Permissões atualizadas:', userData.permissions?.length || 0);
            console.log('✅ [refreshUserPermissions] Permissões:', userData.permissions);
            
            // Atualizar o usuário completo, não apenas permissões
            set({ 
              user: { 
                ...user, 
                permissions: userData.permissions || [],
                allowed: userData.allowed || {},
                role: userData.role || user.role,
                name: userData.name || user.name,
                email: userData.email || user.email,
              },
              isAuthenticated: true
            });
          } else if (response.status === 401) {
            console.warn('⚠️ [refreshUserPermissions] Token inválido ou expirado');
            // Não fazer logout automaticamente, apenas logar o aviso
          } else {
            console.error('❌ [refreshUserPermissions] Erro ao buscar permissões:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('❌ [refreshUserPermissions] Erro na requisição:', error);
          // Não fazer logout em caso de erro de rede
        }
      },

      clearAuth: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
      }),
      // Configuração para evitar perda de dados durante hot reload
      skipHydration: false,
      // Garantir que os dados sejam preservados mesmo durante desenvolvimento
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Hook para verificar se o usuário tem uma role específica
export const useHasRole = (role: UserRole) => {
  const user = useAuthStore((state) => state.user);
  return user?.role === role;
};

// Hook para verificar se o usuário tem uma das roles especificadas
export const useHasAnyRole = (roles: UserRole[]) => {
  const user = useAuthStore((state) => state.user);
  return user ? roles.includes(user.role) : false;
};
