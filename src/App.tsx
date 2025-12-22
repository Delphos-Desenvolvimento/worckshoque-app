import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { PermissionsProvider } from "./contexts/PermissionsContext";
import { useAuthStore } from "./stores/authStore";
import type { User } from "./stores/authStore";
import { DashboardLayout } from "./components/layout/LayoutPage";
import Index from "./pages/Index";
import Dashboard from "./components/user/Dashboard";
import Diagnostico from "./components/user/Diagnostico";
import Login from "./pages/Login";
import AdminDashboard from "./components/admin/AdminDashboard";
import NotFound from "./pages/NotFound";

// User Pages
import Questionarios from "./components/common/Questionarios";
import Diagnosticos from "./components/user/Diagnosticos";
import PlanosAcaoV2 from "./components/user/PlanosAcaoV2";
import DetalhesPlanoAcao from "./components/user/DetalhesPlanoAcao";
// import Gamificacao from "./components/user/Gamificacao";
import ConquistasUnified from "./components/common/ConquistasUnified";
import Conquistas from "./components/user/Conquistas";
import Perfil from "./components/user/Perfil";

// Content Management
import  ContentManager  from "./components/common/contents/ContentManager";
import  ContentViewer  from "./components/common/contents/ContentViewer";
import  ContentEditor  from "./components/common/contents/ContentEditor";
import  ContentLayout  from "./components/common/contents/ContentLayout";

// Admin Pages
import GestaoUsuarios from "./components/admin/GestaoUsuarios";
import RespostasEquipe from "./components/admin/RespostasEquipe";
import Relatorios from "./components/common/Relatorios";
import Notificacoes from "./components/common/Notificacoes";

// Master Pages
import MasterDashboard from "./components/master/MasterDashboard";
import PerfisPermissoes from "./components/master/PerfisPermissoes";
import QuestionariosGlobais from "./components/master/QuestionariosGlobais";
import PlanosConquistasGlobais from "./components/master/PlanosConquistasGlobais";
import Financeiro from "./components/master/Financeiro";
import DiagnosticosGlobais from "./components/master/DiagnosticosGlobais";

// Common Pages
import Configuracoes from "./components/common/Configuracoes";
import ChatPage from "./components/common/chatbot/ChatPage";
import AgentChatWidget from "./components/common/chatbot/AgentChatWidget";

const queryClient = new QueryClient();

// Componente wrapper que integra Zustand com Permissions
const AppWithAuth = () => {
  const { user, token, refreshUserPermissions } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  interface PersistedAuthStorage {
    state?: {
      token?: string | null;
      user?: User | null;
    };
    version?: number;
  }
  
  // Verificar se o token foi perdido durante hot reload e restaurar
  useEffect(() => {
    // Aguardar um pouco para o Zustand persist hidratar
    const checkAndRestore = () => {
      const storedAuth = localStorage.getItem('auth-storage');
      const currentState = useAuthStore.getState();
      
      // Se há token no localStorage mas não no store, restaurar
      if (storedAuth && (!currentState.token || !currentState.user)) {
        try {
          // Ignorar valores corrompidos (ex.: "[object Object]") e limpar entrada
          const trimmed = storedAuth.trim();
          const isJsonLike = (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'));
          if (!isJsonLike) {
            console.warn('[AppWithAuth] Valor corrompido em auth-storage, limpando...');
            localStorage.removeItem('auth-storage');
            return;
          }
          let parsed: PersistedAuthStorage | null;
          try {
            parsed = JSON.parse(storedAuth);
          } catch (e) {
            console.warn('[AppWithAuth] JSON inválido em auth-storage, limpando...');
            localStorage.removeItem('auth-storage');
            return;
          }
          if (parsed.state?.token && parsed.state?.user) {
            console.log('🔄 [AppWithAuth] Token encontrado no localStorage, restaurando após hot reload...');
            useAuthStore.setState({
              token: parsed.state.token as string,
              user: parsed.state.user as User,
              isAuthenticated: true,
            });
          }
        } catch (error) {
          console.error('Erro ao restaurar token do localStorage, limpando auth-storage:', error);
          try { localStorage.removeItem('auth-storage'); } catch (e) { console.warn('Falha ao limpar auth-storage:', e); }
        }
      }
    };
    
    // Verificar imediatamente
    checkAndRestore();
    
    // Verificar novamente após um pequeno delay para garantir que o persist terminou
    const timeout = setTimeout(checkAndRestore, 100);
    
    return () => clearTimeout(timeout);
  }, []); // Executar apenas no mount

  // Atualizar permissões quando necessário
  useEffect(() => {
    // Se o usuário está logado mas não tem permissões ou permissões vazias, buscar
    if (user && token && user.permissions === undefined) {
      console.log('🔄 [AppWithAuth] Permissões ausentes, buscando do backend...');
      void refreshUserPermissions();
    }
    
    // Marcar como inicializado após primeira renderização
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [user, token, isInitialized, refreshUserPermissions]);
  
  // Atualizar permissões periodicamente (a cada 5 minutos) para garantir sincronização
  useEffect(() => {
    if (!user || !token) return;
    
    const interval = setInterval(() => {
      console.log('🔄 [AppWithAuth] Refresh periódico de permissões...');
      void refreshUserPermissions();
    }, 5 * 60 * 1000); // 5 minutos
    
    return () => clearInterval(interval);
  }, [user, token, refreshUserPermissions]);
  
  return (
    <PermissionsProvider 
      userRole={user?.role || "user"} 
      customPermissions={user?.customPermissions || []}
      userPermissions={user?.permissions || []}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              
              {/* Protected Routes with Sidebar */}
              <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
              <Route path="/diagnostico" element={<DashboardLayout><Diagnostico /></DashboardLayout>} />
              {/* Unificado: rota de Conquistas usa página única */}
              
              
              {/* User Routes */}
              <Route path="/questionarios" element={<DashboardLayout><Questionarios /></DashboardLayout>} />
              <Route path="/diagnosticos" element={<DashboardLayout><Diagnosticos /></DashboardLayout>} />
              <Route path="/planos-acao" element={<DashboardLayout><PlanosAcaoV2 /></DashboardLayout>} />
              <Route path="/planos-acao/:id" element={<DashboardLayout><DetalhesPlanoAcao /></DashboardLayout>} />
              {/* Consolidated: redirect Gamificacao to Conquistas route by rendering unified page */}
              <Route path="/gamificacao" element={<DashboardLayout><ConquistasUnified /></DashboardLayout>} />
              <Route path="/relatorios" element={<DashboardLayout><Relatorios /></DashboardLayout>} />
              <Route path="/notificacoes" element={<DashboardLayout><Notificacoes /></DashboardLayout>} />
              <Route path="/perfil" element={<DashboardLayout><Perfil /></DashboardLayout>} />
              <Route path="/configuracoes" element={<DashboardLayout><Configuracoes /></DashboardLayout>} />
              <Route path="/agente" element={<DashboardLayout><ChatPage /></DashboardLayout>} />
              
              {/* Admin Routes */}
              <Route path="/admin-dashboard" element={<DashboardLayout><AdminDashboard /></DashboardLayout>} />
              <Route path="/gestao-usuarios" element={<DashboardLayout><GestaoUsuarios /></DashboardLayout>} />
              <Route path="/gestao-planos" element={<DashboardLayout><div>Gestão de Planos em desenvolvimento</div></DashboardLayout>} />
              <Route path="/respostas-equipe" element={<DashboardLayout><RespostasEquipe /></DashboardLayout>} />
              <Route path="/conquistas-empresa" element={<DashboardLayout><ConquistasUnified /></DashboardLayout>} />
              
              {/* Master Routes */}
              <Route path="/master-dashboard" element={<DashboardLayout><MasterDashboard /></DashboardLayout>} />
              <Route path="/perfis-permissoes" element={<DashboardLayout><PerfisPermissoes /></DashboardLayout>} />
              <Route path="/questionarios-globais" element={<DashboardLayout><QuestionariosGlobais /></DashboardLayout>} />
              <Route path="/diagnosticos-globais" element={<DashboardLayout><DiagnosticosGlobais /></DashboardLayout>} />
              <Route path="/planos-conquistas-globais" element={<DashboardLayout><PlanosConquistasGlobais /></DashboardLayout>} />
              <Route path="/financeiro" element={<DashboardLayout><Financeiro /></DashboardLayout>} />
              {/* Usar página antiga de Conquistas conforme solicitado */}
              <Route path="/conquistas" element={<DashboardLayout><Conquistas /></DashboardLayout>} />
              
              {/* Content Management Routes */}
              <Route path="/conteudos" element={<ContentLayout><ContentManager /></ContentLayout>} />
              <Route path="/conteudos/novo" element={<ContentLayout><ContentEditor /></ContentLayout>} />
              <Route path="/conteudos/:id" element={<ContentLayout><ContentViewer /></ContentLayout>} />
              <Route path="/conteudos/:id/editar" element={<ContentLayout><ContentEditor /></ContentLayout>} />
              
              {/* Legacy route */}
              <Route path="/admin" element={<DashboardLayout><AdminDashboard /></DashboardLayout>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            {(() => {
              const WidgetGate = () => {
                const location = useLocation();
                const { isAuthenticated } = useAuthStore();
                if (!isAuthenticated) return null;
                const hiddenOn = ['/', '/login', '/cadastro'];
                if (hiddenOn.includes(location.pathname)) return null;
                return <AgentChatWidget />;
              };
              return <WidgetGate />;
            })()}
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </PermissionsProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppWithAuth />
  </QueryClientProvider>
);

export default App;
