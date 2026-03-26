import { ReactNode, useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { MobileLayout } from "./mobile/MobileLayout";
import { useAuthStore } from "@/stores/authStore";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { AuthPermissionsWrapper } from "@/components/common/AuthPermissionsWrapper";
import { ProtectedRoute, usePagePermission } from "@/components/common/ProtectedRoute";
import NotificationCenter from "@/components/common/NotificationCenter";
import {
  DEFAULT_USER_PREFERENCES,
  USER_PREFERENCES_UPDATED_EVENT,
  loadUserPreferences,
  type UserPreferences,
} from "@/lib/user-preferences";

interface DashboardLayoutProps {
  children: ReactNode;
}

import { AccessibilityWidget } from "../common/AccessibilityWidget";

function DashboardContent({
  children,
  preferences,
}: DashboardLayoutProps & { preferences: UserPreferences }) {
  const { state, isMobile } = useSidebar();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const collapsed = state === "collapsed";
  const sidebarOnRight = preferences.sidebarPosition === 'right';
  const contentShiftClass = isMobile
    ? 'ml-0 mr-0'
    : sidebarOnRight
      ? collapsed
        ? 'mr-20 ml-0'
        : 'mr-80 ml-0'
      : collapsed
        ? 'ml-20 mr-0'
        : 'ml-80 mr-0';
  const headerPaddingClass =
    preferences.interfaceDensity === 'compact'
      ? 'px-3 md:px-4'
      : preferences.interfaceDensity === 'spacious'
        ? 'px-6 md:px-8'
        : 'px-4 md:px-6';
  const contentPaddingClass =
    preferences.interfaceDensity === 'compact'
      ? 'px-3 py-3 md:px-4 md:py-4'
      : preferences.interfaceDensity === 'spacious'
        ? 'px-6 py-6 md:px-8 md:py-8'
        : 'px-4 py-4 md:px-6 md:py-6';
  const contentWidthClass =
    preferences.dashboardLayout === 'compact'
      ? 'mx-auto max-w-5xl'
      : preferences.dashboardLayout === 'minimal'
        ? 'mx-auto max-w-4xl'
        : preferences.dashboardLayout === 'detailed'
          ? 'max-w-none'
          : 'mx-auto max-w-7xl';

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

  if (isMobile) {
    return (
      <MobileLayout>
        <AccessibilityWidget />
        {requiredPermission ? (
          <ProtectedRoute permission={requiredPermission}>
            {children}
          </ProtectedRoute>
        ) : (
          children
        )}
      </MobileLayout>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <AppSidebar sidebarPosition={preferences.sidebarPosition} />
      <AccessibilityWidget />
      <main className={`transition-all duration-300 ${contentShiftClass}`}>
        <header className={`h-16 flex items-center justify-between border-b bg-background transition-colors duration-300 ${headerPaddingClass}`}>
          <SidebarTrigger />
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <div className="text-sm text-muted-foreground hidden md:block">
              {user?.name}
            </div>
          </div>
        </header>
        <div className={`min-h-screen ${contentPaddingClass}`}>
          <div className={contentWidthClass}>
            {requiredPermission ? (
              <ProtectedRoute permission={requiredPermission}>
                {children}
              </ProtectedRoute>
            ) : (
              children
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated, user } = useAuthStore();
  const [preferences, setPreferences] = useState<UserPreferences>(
    DEFAULT_USER_PREFERENCES,
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const syncPreferences = () => {
      const nextPreferences = loadUserPreferences(user?.id);
      setPreferences(nextPreferences);
      setSidebarOpen(nextPreferences.sidebarMode !== 'collapsed');
    };

    syncPreferences();
    window.addEventListener(USER_PREFERENCES_UPDATED_EVENT, syncPreferences);
    return () =>
      window.removeEventListener(
        USER_PREFERENCES_UPDATED_EVENT,
        syncPreferences,
      );
  }, [user?.id]);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthPermissionsWrapper>
      <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <DashboardContent preferences={preferences}>{children}</DashboardContent>
      </SidebarProvider>
    </AuthPermissionsWrapper>
  );
}
