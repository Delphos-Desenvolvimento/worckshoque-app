import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { PermissionsProvider, Permission, usePermissions } from '@/contexts/PermissionsContext';

interface AuthPermissionsWrapperProps {
  children: React.ReactNode;
  permission?: Permission | Permission[];
  fallback?: React.ReactNode;
  requireAll?: boolean; // Se true, requer todas as permissões; se false, requer qualquer uma
}

export function AuthPermissionsWrapper({ 
  children, 
  permission, 
  fallback = null, 
  requireAll = false 
}: AuthPermissionsWrapperProps) {
  const { user } = useAuthStore();
  
  if (!user) {
    return <>{children}</>;
  }


  return (
    <PermissionsProvider 
      userRole={user.role} 
      customPermissions={(user.customPermissions || []) as Permission[]}
      userPermissions={user.permissions || []}
    >
      <PermissionGate 
        permission={permission} 
        fallback={fallback} 
        requireAll={requireAll}
      >
        {children}
      </PermissionGate>
    </PermissionsProvider>
  );
}

// Componente interno para controle de permissões
interface PermissionGateProps {
  children: React.ReactNode;
  permission?: Permission | Permission[];
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

function PermissionGate({ 
  children, 
  permission, 
  fallback = null, 
  requireAll = false 
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  
  // Se não há permissão especificada, renderiza sempre
  if (!permission) {
    return <>{children}</>;
  }
  
  // Verificar permissões
  let hasAccess = false;
  
  if (Array.isArray(permission)) {
    hasAccess = requireAll ? hasAllPermissions(permission) : hasAnyPermission(permission);
  } else {
    hasAccess = hasPermission(permission);
  }
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

 

