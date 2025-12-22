import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  Lightbulb, 
  Trophy, 
  User,
  Users,
  Settings,
  BarChart3,
  Shield,
  Building,
  DollarSign,
  Activity,
  Target,
  FileBarChart,
  UserCheck,
  Award,
  Cog,
  Bell,
  Book,
  MessageSquare
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuthStore, UserRole } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { AuthPermissionsWrapper } from "@/components/common/AuthPermissionsWrapper";
import { Permission } from "@/contexts/PermissionsContext";
import { PERMISSION_MAPPING } from "@/lib/permission-mapping";
import { usePermissions } from "@/contexts/PermissionsContext";

// Configuração de menus baseada em permissões
const menuConfig = [
  {
    title: "PRINCIPAL",
    items: [
      { 
        permission: 'dashboard.user.view' as Permission,
        icon: LayoutDashboard 
      },
      { 
        permission: 'questionario.view' as Permission,
        icon: FileText 
      },
      { 
        permission: 'diagnostico.view' as Permission,
        icon: Activity 
      },
      { 
        permission: 'plano.view' as Permission,
        icon: Lightbulb 
      },
      { 
        permission: 'conquista.view' as Permission,
        icon: Trophy 
      },
      { 
        permission: 'agent.chat.view' as Permission,
        icon: MessageSquare 
      },
      { 
        permission: 'user.view' as Permission,
        icon: User 
      },
      { 
        permission: 'conteudo.view' as Permission,
        icon: Book 
      },
    ]
  },
  {
    title: "GESTÃO",
    items: [
      { 
        permission: 'dashboard.admin.view' as Permission,
        icon: LayoutDashboard 
      },
      { 
        permission: 'user.manage' as Permission,
        icon: Users 
      },
      { 
        permission: 'plano.create' as Permission,
        icon: Lightbulb 
      },
    ]
  },
  {
    title: "ANÁLISE",
    items: [
      { 
        permission: 'relatorio.view' as Permission,
        icon: BarChart3 
      },
      { 
        permission: 'notification.view' as Permission,
        icon: Bell 
      },
      { 
        permission: 'conquista.manage' as Permission,
        icon: Award 
      },
      { 
        permission: 'config.edit' as Permission,
        icon: Settings 
      },
    ]
  },
  {
    title: "SISTEMA",
    items: [
      { 
        permission: 'dashboard.master.view' as Permission,
        icon: LayoutDashboard 
      },
      { 
        permission: 'permissao.manage' as Permission,
        icon: Shield 
      },
    ]
  },
  {
    title: "FINANCEIRO & SISTEMA",
    items: [
      { 
        permission: 'financeiro.manage' as Permission,
        icon: DollarSign 
      },
    ]
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, logout } = useAuthStore();
  const { hasPermission } = usePermissions();
  const location = useLocation();
  const currentPath = location.pathname;

  if (!user) return null;

  // Função para verificar se uma categoria tem pelo menos 1 item visível
  const hasVisibleItems = (categoryItems: { permission: Permission; icon: React.ComponentType<{ className?: string }> }[]) => {
    return categoryItems.some(item => hasPermission(item.permission));
  };

  const isActive = (path: string) => currentPath === path;

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case 'user': return 'Colaborador';
      case 'admin': return 'Administrador';
      case 'master': return 'Master';
      default: return 'Usuário';
    }
  };

  // Componente para item da sidebar com controle de permissão
  const SidebarItem = ({ permission, icon: Icon }: { permission: Permission; icon: React.ComponentType<{ className?: string }> }) => {
    const itemConfig = PERMISSION_MAPPING.SIDEBAR[permission];
    
    if (!itemConfig) return null;

    return (
      <AuthPermissionsWrapper permission={permission}>
        <NavLink
          to={itemConfig.url}
          className={({ isActive }) =>
            `group flex items-start gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-900 shadow-lg"
                : "hover:bg-slate-800/70 text-slate-300 hover:text-white"
            }`
          }
        >
          <div className={`p-2 rounded-lg ${
            isActive 
              ? "bg-slate-900/20" 
              : "bg-slate-700/50 group-hover:bg-slate-600/50"
          }`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm">{itemConfig.title}</div>
            <div className={`text-xs mt-1 ${
              isActive ? "text-slate-700" : "text-slate-400"
            }`}>
              {itemConfig.description}
            </div>
          </div>
        </NavLink>
      </AuthPermissionsWrapper>
    );
  };

  // Componente para item colapsado
  const CollapsedSidebarItem = ({ permission, icon: Icon }: { permission: Permission; icon: React.ComponentType<{ className?: string }> }) => {
    const itemConfig = PERMISSION_MAPPING.SIDEBAR[permission];
    
    if (!itemConfig) return null;

    return (
      <AuthPermissionsWrapper permission={permission}>
        <NavLink
          to={itemConfig.url}
          className={({ isActive }) =>
            `group flex items-center justify-center p-3 rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-900 shadow-lg"
                : "hover:bg-slate-800/70 text-slate-300 hover:text-white"
            }`
          }
          title={itemConfig.title}
        >
          <Icon className="w-5 h-5" />
        </NavLink>
      </AuthPermissionsWrapper>
    );
  };

  return (
    <div className={`h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0 z-50 ${collapsed ? 'w-20' : 'w-80'}`}>
      {/* Header */}
      <div className={`border-b border-slate-700/50 flex-shrink-0 ${collapsed ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center justify-center">
          <img 
            src="/logo_workchoque.png" 
            alt="WorkChoque" 
            className={`object-contain ${collapsed ? 'w-12 h-12' : 'w-25 h-25'}`}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-400/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-slate-300/50">
        {menuConfig
          .filter(group => hasVisibleItems(group.items)) // 🎯 FILTRAR APENAS CATEGORIAS COM ITENS VISÍVEIS
          .map((group, groupIndex) => (
          <div key={groupIndex} className={collapsed ? 'mb-4' : 'mb-6'}>
            {/* Group Header - Only show when not collapsed */}
            {!collapsed && (
              <div className="px-6 py-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {group.title}
                </h3>
              </div>
            )}

            {/* Group Items - Expanded Mode */}
            {!collapsed && (
              <div className="space-y-1 px-3">
                {group.items.map((item) => (
                  <SidebarItem
                    key={item.permission}
                    permission={item.permission}
                    icon={item.icon}
                  />
                ))}
              </div>
            )}

            {/* Collapsed Mode - Show only icons */}
            {collapsed && (
              <div className="space-y-2 px-3">
                {group.items.map((item) => (
                  <CollapsedSidebarItem
                    key={item.permission}
                    permission={item.permission}
                    icon={item.icon}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className={`border-t border-slate-700/50 flex-shrink-0 ${collapsed ? 'p-3' : 'p-4'}`}>
        {!collapsed ? (
          <div className="space-y-3">
            <div className="px-3 py-2 bg-slate-800/50 rounded-lg">
              <div className="text-sm font-medium text-white truncate">
                {user.name}
              </div>
              <div className="text-xs text-slate-400">
                {getRoleDisplayName(user.role)}
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={logout}
              className="w-full bg-transparent border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-400 transition-all duration-200"
            >
              Sair
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={logout}
              className="p-3 bg-transparent border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-400 rounded-lg transition-all duration-200"
              title="Sair"
            >
              <User className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}