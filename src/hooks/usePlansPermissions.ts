import { usePermissions } from "@/contexts/PermissionsContext";

export const usePlansPermissions = () => {
  const { hasPermission } = usePermissions();

  return {
    canViewPlans: hasPermission('plano.view'),
    canCreatePlans: hasPermission('plano.create'),
    canEditPlans: hasPermission('plano.edit'),
    canDeletePlans: hasPermission('plano.delete'),
    canManageGlobalPlans: hasPermission('plano.global')
  };
};

export default usePlansPermissions;
