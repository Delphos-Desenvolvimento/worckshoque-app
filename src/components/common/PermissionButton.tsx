import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { AuthPermissionsWrapper } from './AuthPermissionsWrapper';
import { Permission } from '@/contexts/PermissionsContext';
import { PERMISSION_MAPPING } from '@/lib/permission-mapping';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  FileText,
  Eye,
  Settings,
  Save,
  X
} from 'lucide-react';

// Mapeamento de ícones para ações
const ACTION_ICONS = {
  Plus,
  Edit,
  Trash2,
  Download,
  FileText,
  Eye,
  Settings,
  Save,
  X
} as const;

interface PermissionButtonProps extends Omit<ButtonProps, 'children'> {
  permission: Permission;
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  showTooltip?: boolean;
  tooltipText?: string;
}

export function PermissionButton({ 
  permission, 
  children, 
  fallback = null, 
  showTooltip = true,
  tooltipText,
  ...buttonProps 
}: PermissionButtonProps) {
  const buttonConfig = PERMISSION_MAPPING.BUTTONS[permission];
  
  // Se não há configuração específica, usar permissão como texto
  const buttonText = children || buttonConfig?.text || permission;
  const IconComponent = buttonConfig?.icon ? ACTION_ICONS[buttonConfig.icon] : null;
  const variant = buttonConfig?.variant || 'default';
  
  const tooltip = tooltipText || `Requer permissão: ${permission}`;

  return (
    <AuthPermissionsWrapper 
      permission={permission} 
      fallback={fallback}
    >
      <Button
        {...buttonProps}
        variant={variant}
        title={showTooltip ? tooltip : undefined}
        className={`${buttonProps.className || ''} ${!showTooltip ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        {IconComponent && <IconComponent className="w-4 h-4 mr-2" />}
        {buttonText}
      </Button>
    </AuthPermissionsWrapper>
  );
}

// Componente para botões de ação comuns
interface ActionButtonProps extends Omit<ButtonProps, 'children'> {
  action: 'create' | 'edit' | 'delete' | 'view' | 'export' | 'save' | 'cancel';
  module: string;
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ActionButton({ 
  action, 
  module, 
  children, 
  fallback = null, 
  ...buttonProps 
}: ActionButtonProps) {
  const permission = `${module}.${action}` as Permission;
  
  return (
    <PermissionButton
      permission={permission}
      fallback={fallback}
      {...buttonProps}
    >
      {children}
    </PermissionButton>
  );
}


// Componente para grupo de botões com permissões
interface PermissionButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function PermissionButtonGroup({ children, className }: PermissionButtonGroupProps) {
  return (
    <div className={`flex gap-2 ${className || ''}`}>
      {children}
    </div>
  );
}
