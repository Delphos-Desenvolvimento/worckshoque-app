import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { UserRole } from '../stores/authStore';

// Definição de todas as permissões do sistema
// Sincronizado com backend/prisma/seed.ts
export const PERMISSIONS = {
  // Dashboards
  'dashboard.master.view': 'Visualizar Dashboard Global',
  'dashboard.admin.view': 'Visualizar Dashboard da Empresa',
  'dashboard.user.view': 'Visualizar Dashboard Pessoal',
  
  // Diagnósticos
  'diagnostico.view': 'Visualizar Diagnósticos',
  'diagnostico.create': 'Criar Diagnósticos',
  'diagnostico.edit': 'Editar Diagnósticos',
  'diagnostico.delete': 'Excluir Diagnósticos',
  'diagnostico.global': 'Acessar Diagnósticos Globais',
  
  // Planos de Ação
  'plano.view': 'Visualizar Planos de Ação',
  'plano.create': 'Criar Planos de Ação',
  'plano.edit': 'Editar Planos de Ação',
  'plano.delete': 'Excluir Planos de Ação',
  'plano.global': 'Gerenciar Planos Globais',
  
  // Conquistas
  'conquista.view': 'Visualizar Conquistas',
  'conquista.manage': 'Gerenciar Sistema de Conquistas',
  'conquista.create': 'Criar Conquistas',
  'conquista.edit': 'Editar Conquistas',
  'conquista.delete': 'Excluir Conquistas',
  
  // Usuários
  'user.view': 'Visualizar Usuários',
  'user.create': 'Criar Usuários',
  'user.edit': 'Editar Usuários',
  'user.delete': 'Excluir Usuários',
  'user.manage': 'Gerenciar Usuários',
  
  // Perfis e Permissões
  'perfil.view': 'Visualizar Perfis',
  'perfil.create': 'Criar Perfis',
  'perfil.edit': 'Editar Perfis',
  'perfil.delete': 'Excluir Perfis',
  'permissao.manage': 'Gerenciar Permissões',
  
  // Conteúdos
  'conteudo.view': 'Visualizar Conteúdos',
  'conteudo.create': 'Criar Conteúdos',
  'conteudo.edit': 'Editar Conteúdos',
  'conteudo.delete': 'Excluir Conteúdos',
  'conteudo.publish': 'Publicar/Arquivar Conteúdos',
  'conteudo.manage_categories': 'Gerenciar Categorias de Conteúdo',
  'conteudo.view_restricted': 'Visualizar Conteúdos Restritos',
  'conteudo.view_private': 'Visualizar Conteúdos Privados',
  'conteudo.manage_access': 'Gerenciar Acesso a Conteúdos',
  
  // Empresas
  'empresa.view': 'Visualizar Empresas',
  'empresa.create': 'Criar Empresas',
  'empresa.edit': 'Editar Empresas',
  'empresa.delete': 'Excluir Empresas',
  'empresa.manage': 'Gerenciar Empresas',
  
  // Relatórios
  'relatorio.view': 'Visualizar Relatórios',
  'relatorio.create': 'Criar Relatórios',
  'relatorio.export': 'Exportar Relatórios',
  'relatorio.global': 'Acessar Relatórios Globais',
  
  // Financeiro
  'financeiro.view': 'Visualizar Financeiro',
  'financeiro.manage': 'Gerenciar Financeiro',
  
  // Configurações
  'config.view': 'Visualizar Configurações',
  'config.edit': 'Editar Configurações',
  
  // Sistema
  'sistema.view': 'Visualizar Sistema',
  'sistema.manage': 'Gerenciar Sistema',
  'backup.manage': 'Gerenciar Backup',
  'agent.chat.view': 'Visualizar Chat do Agente',
  'agent.chat.manage': 'Gerenciar Chat do Agente',
  
  // Auditoria e Segurança
  'auditoria.logs.view': 'Visualizar Logs de Auditoria',
  'auditoria.logs.export': 'Exportar Logs de Auditoria',
  'auditoria.alerts.view': 'Visualizar Alertas de Segurança',
  'auditoria.alerts.manage': 'Gerenciar Alertas de Segurança',
  'auditoria.compliance.view': 'Visualizar Relatórios de Compliance',
  'auditoria.compliance.export': 'Exportar Relatórios de Compliance',
} as const;

export type Permission = keyof typeof PERMISSIONS;

// Definição de perfis e suas permissões
// Sincronizado com backend/prisma/seed.ts
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [
    'dashboard.user.view',
    'diagnostico.view',
    'diagnostico.create',
    'plano.view',
    'conquista.view',
    'agent.chat.view',
  ],
  
  admin: [
    'dashboard.user.view',
    'dashboard.admin.view',
    'diagnostico.view',
    'diagnostico.create',
    'diagnostico.edit',
    'diagnostico.delete',
    'plano.view',
    'plano.create',
    'plano.edit',
    'plano.delete',
    'conquista.view',
    'conquista.manage',
    'conquista.create',
    'conquista.edit',
    'conquista.delete',
    'user.view',
    'user.create',
    'user.edit',
    'user.delete',
    'user.manage',
    'relatorio.view',
    'relatorio.create',
    'relatorio.export',
    'auditoria.logs.view',
    'auditoria.logs.export',
    'auditoria.alerts.view',
    'config.view',
    'config.edit',
    'agent.chat.view',
    'agent.chat.manage',
  ],
  
  master: [
    // Todas as permissões
    ...Object.keys(PERMISSIONS) as Permission[],
  ],
};

// Interface para o contexto
interface PermissionsContextType {
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  getUserPermissions: () => Permission[];
  getRolePermissions: (role: UserRole) => Permission[];
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

interface PermissionsProviderProps {
  children: ReactNode;
  userRole: UserRole;
  customPermissions?: Permission[]; // Permissões adicionais do usuário
  userPermissions?: string[]; // Permissões efetivas do backend
}

export function PermissionsProvider({ 
  children, 
  userRole, 
  customPermissions = [],
  userPermissions = []
}: PermissionsProviderProps) {
  
  // Memoizar as permissões do usuário para evitar recálculos desnecessários
  const effectivePermissions = useMemo((): Permission[] => {
    // Se temos permissões do backend, usar elas
    if (userPermissions.length > 0) {
      return userPermissions as Permission[];
    }
    
    // Fallback para sistema hardcoded
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    return [...rolePermissions, ...customPermissions];
  }, [userPermissions, userRole, customPermissions]);

  const hasBackendPermissions = userPermissions.length > 0;
  
  // Memoizar as funções para evitar recriação desnecessária
  const getUserPermissions = useMemo((): (() => Permission[]) => {
    return (): Permission[] => effectivePermissions;
  }, [effectivePermissions]);

  const hasPermission = useMemo((): ((permission: Permission) => boolean) => {
    return (permission: Permission): boolean => {
      // Se há permissões vindas do backend, respeitar exatamente elas (inclusive para master)
      if (hasBackendPermissions) {
        return effectivePermissions.includes(permission);
      }
      // Caso não haja permissões do backend, usar fallback por role (master terá tudo pelo ROLE_PERMISSIONS)
      return effectivePermissions.includes(permission);
    };
  }, [effectivePermissions, hasBackendPermissions]);

  const hasAnyPermission = useMemo((): ((permissions: Permission[]) => boolean) => {
    return (permissions: Permission[]): boolean => {
      if (hasBackendPermissions) {
        return permissions.some(permission => effectivePermissions.includes(permission));
      }
      return permissions.some(permission => effectivePermissions.includes(permission));
    };
  }, [effectivePermissions, hasBackendPermissions]);

  const hasAllPermissions = useMemo((): ((permissions: Permission[]) => boolean) => {
    return (permissions: Permission[]): boolean => {
      if (hasBackendPermissions) {
        return permissions.every(permission => effectivePermissions.includes(permission));
      }
      return permissions.every(permission => effectivePermissions.includes(permission));
    };
  }, [effectivePermissions, hasBackendPermissions]);

  const getRolePermissions = useMemo((): ((role: UserRole) => Permission[]) => {
    return (role: UserRole): Permission[] => {
      return ROLE_PERMISSIONS[role] || [];
    };
  }, []);

  const value: PermissionsContextType = useMemo(() => ({
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getUserPermissions,
    getRolePermissions,
  }), [hasPermission, hasAnyPermission, hasAllPermissions, getUserPermissions, getRolePermissions]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}

// Hook para verificar se um componente deve ser renderizado
export function usePermissionGate(permission: Permission | Permission[]) {
  const { hasPermission, hasAnyPermission } = usePermissions();
  
  if (Array.isArray(permission)) {
    return hasAnyPermission(permission);
  }
  
  return hasPermission(permission);
}
