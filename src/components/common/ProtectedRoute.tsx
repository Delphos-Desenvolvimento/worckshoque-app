import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthPermissionsWrapper } from './AuthPermissionsWrapper';
import { Permission } from '@/contexts/PermissionsContext';
import { PERMISSION_MAPPING, getPagePermission } from '@/lib/permission-mapping';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: Permission | Permission[];
  requireAll?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  permission, 
  requireAll = false,
  redirectTo = '/',
  fallback = null
}: ProtectedRouteProps) {
  const location = useLocation();
  
  // Se não há permissão especificada, renderiza sempre
  if (!permission) {
    return <>{children}</>;
  }

  // Fallback padrão para usuários sem permissão
  const defaultFallback = (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Acesso Negado
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Você não tem permissão para acessar esta página.
        </p>
        <div className="space-y-2">
          <p className="text-xs text-gray-400">
            Permissão necessária: {Array.isArray(permission) ? permission.join(' ou ') : permission}
          </p>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <AuthPermissionsWrapper 
      permission={permission} 
      fallback={fallback || defaultFallback}
      requireAll={requireAll}
    >
      {children}
    </AuthPermissionsWrapper>
  );
}

// Hook para verificar permissão de página
export const usePagePermission = (path: string): Permission | null => {
  return getPagePermission(path) as Permission | null;
}

// Componente para proteger página baseada na rota
interface RouteProtectedProps {
  children: React.ReactNode;
  path: string;
  fallback?: React.ReactNode;
}

export function RouteProtected({ children, path, fallback }: RouteProtectedProps) {
  const requiredPermission = usePagePermission(path);
  
  if (!requiredPermission) {
    // Se não há permissão mapeada para esta rota, renderiza normalmente
    return <>{children}</>;
  }

  return (
    <ProtectedRoute permission={requiredPermission} fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}
