import { ReactNode, useEffect } from "react";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuthStore } from "@/stores/authStore";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { AuthPermissionsWrapper } from "@/components/common/AuthPermissionsWrapper";
import { ProtectedRoute, usePagePermission } from "@/components/common/ProtectedRoute";
import NotificationCenter from "@/components/common/NotificationCenter";

interface DashboardLayoutProps {
  children: ReactNode;
}

function DashboardContent({ children }: DashboardLayoutProps) {
  const { state } = useSidebar();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const collapsed = state === "collapsed";

  // Verificar permissão da página atual
  const currentPath = location.pathname;
  const requiredPermission = usePagePermission(currentPath);

  // Redirecionamento automático baseado no role (fallback para compatibilidade)
  useEffect(() => {
    if (user && !requiredPermission) {
      // Se não há permissão mapeada, usar sistema antigo de roles
      const shouldRedirect = () => {
        switch (user.role) {
          case 'master': {
            const masterRoutes = [
              '/master-dashboard',
              '/perfis-permissoes',
              '/planos-conquistas-globais',
              '/relatorios',
              '/financeiro',
              '/notificacoes',
              '/perfil',
              '/configuracoes',
              '/agente',
            ];
            if (currentPath.startsWith('/planos-acao/')) {
              return false;
            }
            return !masterRoutes.includes(currentPath);
          }
          case 'admin': {
            const adminRoutes = [
              '/admin-dashboard',
              '/gestao-usuarios',
              '/gestao-planos',
              '/respostas-equipe',
              '/relatorios',
              '/conquistas-empresa',
              '/notificacoes',
              '/perfil',
              '/configuracoes',
              '/agente',
            ];
            if (currentPath.startsWith('/planos-acao/')) {
              return false;
            }
            return !adminRoutes.includes(currentPath);
          }
          case 'user': {
            const userRoutes = [
              '/dashboard',
              '/diagnostico',
              '/conquistas',
              '/meus-diagnosticos',
              '/questionarios',
              '/meus-questionarios',
              '/diagnosticos',
              '/planos-acao',
              '/planos-acao/', // Inclui a rota base
              ...Array(10).fill(0).map((_, i) => `/planos-acao/${i+1}`), // Inclui exemplos de IDs
              '/gamificacao',
              '/relatorios',
              '/notificacoes',
              '/perfil',
              '/configuracoes',
              '/agente',
            ];
            // Verifica se a rota começa com /planos-acao/
            if (currentPath.startsWith('/planos-acao/')) {
              return false; // Permite todas as rotas que começam com /planos-acao/
            }
            return !userRoutes.includes(currentPath);
          }
          default:
            return false;
        }
      };

      if (shouldRedirect()) {
        switch (user.role) {
          case 'master':
            navigate('/master-dashboard');
            break;
          case 'admin':
            navigate('/admin-dashboard');
            break;
          case 'user':
            navigate('/dashboard');
            break;
        }
      }
    }
  }, [user, location.pathname, navigate, requiredPermission, currentPath]);

  return (
    <div className="min-h-screen w-full">
      <AppSidebar />
      <main className={`transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-80'}`}>
        <header className="h-16 flex items-center justify-between border-b px-6 bg-background transition-colors duration-300">
          <SidebarTrigger />
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <div className="text-sm text-muted-foreground">
              {user?.name}
            </div>
          </div>
        </header>
        <div className="px-6 py-6 min-h-screen">
          {requiredPermission ? (
            <ProtectedRoute permission={requiredPermission}>
              {children}
            </ProtectedRoute>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthPermissionsWrapper>
      <SidebarProvider>
        <DashboardContent>{children}</DashboardContent>
      </SidebarProvider>
    </AuthPermissionsWrapper>
  );
}
