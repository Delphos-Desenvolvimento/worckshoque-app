import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Shield, 
  Save,
  Eye,
  EyeOff,
  Crown,
  Settings,
  Users,
  UserCheck,
  RefreshCw,
  AlertCircle,
  Search,
  Filter,
  Edit,
  UserPlus,
  Trophy,
  Target,
  BarChart3,
  UserCog,
  Building2,
  DollarSign,
  Cog,
  LayoutDashboard,
  User,
  ClipboardList,
  Bell,
  ShieldCheck,
  Zap,
  Star,
  Award,
  TrendingUp,
  FileText,
  Database,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  X,
  Plus,
  MoreHorizontal,
  Trash2,
  UserX,
  Mail,
  Phone,
  Building,
  Grid3X3,
  List,
  Table,
  Loader2,
  Book
} from 'lucide-react';
import { usePermissions } from '@/contexts/PermissionsContext';
import { useAuthStore, UserRole } from '@/stores/authStore';
import ModalLayout from '@/components/common/ModalLayout';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import { api, axiosInstance } from '@/lib/api';
import { toast } from 'sonner';

// Interfaces
interface Permission {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  category?: string | null;
  created_at: string;
  updated_at: string;
}

interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  allowed?: Record<string, boolean>;
  permissions?: string[];
}

// Interface para usuário da API
interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: 'master' | 'admin' | 'user';
  company_id: string | null;
  is_active: boolean;
  last_login: string | null;
  allowed: Record<string, boolean> | boolean;
  created_at: string;
  updated_at: string;
  permissions: string[];
}

// Interface para usuário formatado para o componente
interface FormattedUser {
  id: string;
  name: string;
  email: string;
  role: 'master' | 'admin' | 'user';
  status: 'Ativo' | 'Inativo';
  lastLogin: string;
  permissions: string[];
  created_at: string;
}

interface RoleInfo {
  role: UserRole;
  name: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}

// Configuração dos roles base
const ROLES: RoleInfo[] = [
  {
    role: 'master',
    name: 'Master',
    description: 'Acesso total ao sistema, pode gerenciar todas as permissões',
    color: 'bg-red-500',
    icon: <Crown className="w-5 h-5" />
  },
  {
    role: 'admin',
    name: 'Administrador',
    description: 'Acesso administrativo, pode gerenciar usuários e configurações',
    color: 'bg-blue-500',
    icon: <Settings className="w-5 h-5" />
  },
  {
    role: 'user',
    name: 'Usuário',
    description: 'Acesso básico ao sistema, funcionalidades limitadas',
    color: 'bg-green-500',
    icon: <Users className="w-5 h-5" />
  }
];

// Função para formatar nomes de categorias (DINÂMICA)
const formatCategoryName = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'conquista': 'Conquistas',
    'diagnostico': 'Diagnóstico',
    'questionario': 'Questionários',
    'relatorio': 'Relatórios',
    'user': 'Usuários',
    'empresa': 'Empresas',
    'financeiro': 'Financeiro',
    'config': 'Configurações',
    'dashboard': 'Dashboard',
    'perfil': 'Perfil',
    'plano': 'Planos de Ação',
    'notification': 'Notificações',
    'auditoria': 'Auditoria',
    'sistema': 'Sistema',
    'permissao': 'Permissões',
    'gamificacao': 'Gamificação',
    'backup': 'Backup',
    'conteudo': 'Conteúdos'
  };
  return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
};

// Função para formatar nomes específicos de permissões (USA NOME DO BANCO)
const formatPermissionName = (permissionKey: string, permissionName?: string): string => {
  // PRIORIDADE: usar o nome da permissão do banco
  if (permissionName) {
    return permissionName;
  }
  
  // Fallback: gerar nome baseado na key
  const [category, action, ...rest] = permissionKey.split('.');
  
  const actionMap: Record<string, string> = {
    'view': 'Visualizar',
    'create': 'Criar',
    'edit': 'Editar',
    'delete': 'Excluir',
    'manage': 'Gerenciar',
    'export': 'Exportar',
    'global': 'Acessar Global',
    'broadcast': 'Transmitir',
    'stats': 'Ver Estatísticas'
  };
  
  const actionText = actionMap[action] || action;
  const categoryText = formatCategoryName(category);
  
  if (rest.length > 0) {
    return `${actionText} ${categoryText} - ${rest.join(' ')}`;
  }
  
  return `${actionText} ${categoryText}`;
};

// Função para obter ícone por categoria (DINÂMICA)
const getCategoryIcon = (category: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'gamificacao': <Trophy className="w-5 h-5" />,
    'conquista': <Award className="w-5 h-5" />,
    'questionario': <FileText className="w-5 h-5" />,
    'diagnostico': <Target className="w-5 h-5" />,
    'relatorio': <BarChart3 className="w-5 h-5" />,
    'user': <Users className="w-5 h-5" />,
    'empresa': <Building2 className="w-5 h-5" />,
    'financeiro': <DollarSign className="w-5 h-5" />,
    'config': <Cog className="w-5 h-5" />,
    'dashboard': <LayoutDashboard className="w-5 h-5" />,
    'perfil': <User className="w-5 h-5" />,
    'plano': <ClipboardList className="w-5 h-5" />,
    'notification': <Bell className="w-5 h-5" />,
    'auditoria': <ShieldCheck className="w-5 h-5" />,
    'sistema': <Database className="w-5 h-5" />,
    'permissao': <Shield className="w-5 h-5" />,
    'backup': <Database className="w-5 h-5" />,
    'conteudo': <Book className="w-5 h-5" />
  };
  return iconMap[category] || <FileText className="w-5 h-5" />;
};

// Função para obter cores por categoria (DINÂMICA)
const getCategoryColors = (category: string) => {
  const colorMap: Record<string, string> = {
    'gamificacao': 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    'conquista': 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
    'questionario': 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white',
    'diagnostico': 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
    'relatorio': 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
    'user': 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white',
    'empresa': 'bg-gradient-to-r from-slate-500 to-gray-600 text-white',
    'financeiro': 'bg-gradient-to-r from-green-600 to-teal-500 text-white',
    'config': 'bg-gradient-to-r from-gray-500 to-slate-600 text-white',
    'dashboard': 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white',
    'perfil': 'bg-gradient-to-r from-pink-500 to-rose-500 text-white',
    'plano': 'bg-gradient-to-r from-orange-500 to-red-500 text-white',
    'notification': 'bg-gradient-to-r from-yellow-600 to-amber-500 text-white',
    'auditoria': 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
    'sistema': 'bg-gradient-to-r from-slate-600 to-gray-700 text-white',
    'permissao': 'bg-gradient-to-r from-primary to-primary/80 text-white',
    'backup': 'bg-gradient-to-r from-slate-700 to-gray-800 text-white',
    'conteudo': 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white'
  };
  return colorMap[category] || 'bg-gradient-to-r from-slate-500 to-gray-600 text-white';
};

export default function PerfisPermissoes() {
  const { hasPermission } = usePermissions();
  const { user, token, refreshUserPermissions } = useAuthStore();
  
  // Estados
  const [activeTab, setActiveTab] = useState('roles');
  const [rolesPermissions, setRolesPermissions] = useState<Record<UserRole, Permission[]>>({
    master: [],
    admin: [],
    user: []
  });
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [permissionsByCategory, setPermissionsByCategory] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para nova interface
  const [openDropdowns, setOpenDropdowns] = useState<Record<UserRole, boolean>>({
    master: false,
    admin: false,
    user: false
  });
  const [rolePermissionsChanges, setRolePermissionsChanges] = useState<Record<UserRole, string[]>>({
    master: [],
    admin: [],
    user: []
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Estados para interface limpa
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // Estados para gerenciamento de usuários
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("todos");
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [usuarios, setUsuarios] = useState<FormattedUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para edição de permissões de usuário
  const [editingUser, setEditingUser] = useState<FormattedUser | null>(null);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
  const [userPermissionsLoading, setUserPermissionsLoading] = useState(false);
  const [userPermissionsError, setUserPermissionsError] = useState<string | null>(null);

  // Verificar se usuário é MASTER
  const isMaster = user?.role === 'master';

  // Função para mapear usuário da API para formato do componente
  const mapApiUserToFormattedUser = (apiUser: ApiUser): FormattedUser => {
    return {
      id: apiUser.id,
      name: apiUser.name,
      email: apiUser.email,
      role: apiUser.role,
      status: apiUser.is_active ? 'Ativo' : 'Inativo',
      lastLogin: apiUser.last_login ? new Date(apiUser.last_login).toLocaleDateString('pt-BR') : 'Nunca',
      permissions: apiUser.permissions || [],
      created_at: apiUser.created_at
    };
  };

  // Função para buscar usuários da API
  const fetchUsuarios = useCallback(async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setUsersLoading(true);
      }
      setUsersError(null);

      const response = await api.get('/auth/users');
      
      if (!response.ok) {
        if (response.status === 0 || response.status >= 500) {
          throw new Error('Servidor backend não está disponível - verifique se está rodando na porta 3000');
        }
        throw new Error(`Erro ${response.status}: Erro ao carregar usuários`);
      }

      // Verificar se a resposta é JSON válido
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Resposta do servidor não é JSON válido - verifique se o backend está rodando');
      }

      const apiUsers: ApiUser[] = await response.json();
      const formattedUsers = apiUsers.map(mapApiUserToFormattedUser);
      
      setUsuarios(formattedUsers);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      
      // Tratar erro específico de JSON
      if (err instanceof SyntaxError && err.message.includes('JSON')) {
        setUsersError('Erro na resposta do servidor - verifique se o backend está rodando');
      } else if (err instanceof Error) {
        setUsersError(`Erro ao carregar usuários: ${err.message}`);
      } else {
        setUsersError('Erro desconhecido ao carregar usuários');
      }
    } finally {
      setUsersLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Carregar dados iniciais

  // Carregar usuários quando a aba for ativada
  useEffect(() => {
    if (activeTab === 'users' && isMaster) {
      fetchUsuarios();
    }
  }, [activeTab, isMaster, fetchUsuarios]);

  const loadPermissionsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }
      
      const timestamp = Date.now();
      
      // Carregar permissões
      const response = await axiosInstance.get(`/permissions`, { params: { t: timestamp } });
      const permissionsData = response.data;
      
      console.log('📊 Permissões carregadas:', permissionsData);
      
      setAllPermissions(permissionsData);
      
      // Processar as categorias e permissões
      const permissionsByCategory: Record<string, Permission[]> = {};
      
      // Agrupar permissões por categoria
      permissionsData.forEach((permission: Permission) => {
        const category = permission.category || 'outros';
        if (!permissionsByCategory[category]) {
          permissionsByCategory[category] = [];
        }
        permissionsByCategory[category].push(permission);
      });
      
      // Garantir que a categoria 'conteudo' exista
      if (!permissionsByCategory['conteudo']) {
        permissionsByCategory['conteudo'] = [];
      }
      
      // Ordenar as categorias
      const orderedCategories = Object.entries(permissionsByCategory).sort(([catA], [catB]) => {
        // Ordem desejada das categorias
        const order = [
          'dashboard', 'conteudo', 'questionario', 'diagnostico', 'plano', 
          'conquista', 'user', 'empresa', 'relatorio', 'auditoria',
          'gamificacao', 'notification', 'perfil', 'permissao', 'sistema',
          'config', 'financeiro', 'backup', 'teste', 'outros'
        ];
        
        const indexA = order.indexOf(catA);
        const indexB = order.indexOf(catB);
        
        // Se ambas as categorias estiverem na lista de ordenação, ordenar de acordo
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        // Se apenas A estiver na lista, A vem primeiro
        if (indexA !== -1) return -1;
        // Se apenas B estiver na lista, B vem primeiro
        if (indexB !== -1) return 1;
        // Se nenhuma estiver na lista, manter ordem alfabética
        return catA.localeCompare(catB);
      });
      
      // Converter de volta para objeto
      const sortedCategories = Object.fromEntries(orderedCategories);
      
      setPermissionsByCategory(sortedCategories);
      
      // Log detalhado das permissões de conteúdo
      const conteudoPermissions = permissionsData.filter((p: Permission) => p.category === 'conteudo');
      console.log('📚 Permissões de conteúdo encontradas:', conteudoPermissions);
      console.log('📊 Categorias ordenadas:', Object.keys(sortedCategories));
      
      // Carregar permissões de roles
      const rolePromises = ROLES.map(async (role) => {
        try {
          // Removendo o /api do início da rota pois já está incluído no baseURL
          const roleResponse = await axiosInstance.get(`/permissions/roles/${role.role}`);
          return { role: role.role, permissions: roleResponse.data.permissions };
        } catch (error) {
          console.error(`❌ Erro ao carregar role ${role.role}:`, error);
          return { role: role.role, permissions: [] };
        }
      });
      
      const roleResults = await Promise.all(rolePromises);
      const rolesData: Record<UserRole, Permission[]> = {
        master: [],
        admin: [],
        user: []
      };
      
      roleResults.forEach(({ role, permissions }) => {
        rolesData[role] = permissions;
      });
      
      setRolesPermissions(rolesData);
      setDataLoaded(true);
    } catch (error: unknown) {
      console.error('❌ Erro:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data && typeof error.response.data.message === 'string' ? error.response.data.message : (error instanceof Error ? error.message : 'Erro ao carregar permissões.');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isMaster && token && !dataLoaded) {
      loadPermissionsData();
    }
  }, [isMaster, token, dataLoaded, loadPermissionsData]);

  const refreshData = () => {
    setDataLoaded(false);
    setAllPermissions([]);
    setPermissionsByCategory({});
    setRolesPermissions({
      master: [],
      admin: [],
      user: []
    });
    setRolePermissionsChanges({
      master: [],
      admin: [],
      user: []
    });
    setHasUnsavedChanges(false);
    setError(null);
    setLoading(false);
    
    setTimeout(() => {
      loadPermissionsData();
    }, 100);
  };

  const toggleDropdown = (role: UserRole) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [role]: !prev[role]
    }));
  };

  const toggleRolePermission = (role: UserRole, permissionKey: string) => {
    setRolePermissionsChanges(prev => {
      const currentChanges = [...(prev[role] || [])];
      const hasChange = currentChanges.includes(permissionKey);
      
      // Atualiza a lista de mudanças
      const newChanges = hasChange
        ? currentChanges.filter(key => key !== permissionKey)
        : [...currentChanges, permissionKey];
      
      // Atualiza o estado de mudanças
      const updated = {
        ...prev,
        [role]: newChanges
      };
      
      // Atualiza o estado de alterações não salvas
      const hasUnsaved = Object.values(updated).some(changes => changes.length > 0);
      setHasUnsavedChanges(hasUnsaved);
      
      return updated;
    });
  };

  const isPermissionEnabled = (role: UserRole, permissionKey: string) => {
    const rolePermissions = rolesPermissions[role] || [];
    const isInDatabase = rolePermissions.some(p => p.key === permissionKey);
    
    const pendingChanges = rolePermissionsChanges[role] || [];
    const hasPendingChange = pendingChanges.includes(permissionKey);
    
    // Se há uma mudança pendente, ela sobrescreve o estado atual
    if (pendingChanges.length > 0) {
      return hasPendingChange ? !isInDatabase : isInDatabase;
    }
    
    // Se não há mudanças pendentes, retorna o estado atual do banco
    return isInDatabase;
  };

  const saveRoleChanges = async (role: UserRole) => {
    try {
      setLoading(true);
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }
      
      const currentPermissions = rolesPermissions[role] || [];
      const pendingChanges = rolePermissionsChanges[role] || [];
      
      const currentPermissionKeys = currentPermissions.map(p => p.key);
      
      // Calcular as permissões finais
      const finalPermissions = [
        ...currentPermissionKeys.filter(key => !pendingChanges.includes(key)),
        ...pendingChanges.filter(key => !currentPermissionKeys.includes(key))
      ];
      
      // Enviar para a API
      await axiosInstance.put(`/permissions/roles/${role}`, {
        permissions: finalPermissions
      });
      
      // Atualizar o estado local para refletir as mudanças
      const updatedPermissions = allPermissions.filter(p => 
        finalPermissions.includes(p.key)
      );
      
      // Atualizar o estado de permissões
      setRolesPermissions(prev => ({
        ...prev,
        [role]: updatedPermissions
      }));
      
      // Limpar mudanças pendentes para este role
      setRolePermissionsChanges(prev => {
        const updated = {
          ...prev,
          [role]: []
        };
        
        // Verificar se ainda há mudanças em outros roles
        const hasOtherChanges = Object.entries(updated)
          .filter(([r]) => r !== role)
          .some(([_, changes]) => changes.length > 0);
        
        setHasUnsavedChanges(hasOtherChanges);
        
        return updated;
      });
      
      // Atualizar permissões do usuário atual se necessário
      if (user && user.role === role) {
        await refreshUserPermissions();
      }
      
      // Recarregar os dados para garantir sincronização
      await loadPermissionsData();
      
    } catch (error: unknown) {
      console.error('❌ Erro ao salvar:', error);
      toast.error('Erro ao salvar permissões. Tente novamente.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Funções auxiliares para nova interface
  const getRoleStats = () => {
    const totalPermissions = allPermissions.length;
    const totalCategories = Object.keys(permissionsByCategory).length;
    const pendingChanges = Object.values(rolePermissionsChanges).reduce((sum, changes) => sum + changes.length, 0);
    
    return {
      totalPermissions,
      totalCategories,
      pendingChanges,
      rolesConfigured: Object.keys(rolesPermissions).length
    };
  };

  const getRoleColorScheme = (role: UserRole) => {
    const schemes = {
      master: {
        bg: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200',
        icon: 'text-red-600',
        text: 'text-red-800',
        badge: 'bg-red-200 text-red-800',
        button: 'bg-red-600 hover:bg-red-700'
      },
      admin: {
        bg: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
        icon: 'text-blue-600',
        text: 'text-blue-800',
        badge: 'bg-blue-200 text-blue-800',
        button: 'bg-blue-600 hover:bg-blue-700'
      },
      user: {
        bg: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200',
        icon: 'text-green-600',
        text: 'text-green-800',
        badge: 'bg-green-200 text-green-800',
        button: 'bg-green-600 hover:bg-green-700'
      }
    };
    return schemes[role];
  };

  const toggleCategoryForRole = (role: UserRole, category: string) => {
    const categoryPermissions = permissionsByCategory[category] || [];
    const categoryKeys = categoryPermissions.map(p => p.key);
    const currentPermissions = rolePermissionsChanges[role] || [];
    const rolePermissions = rolesPermissions[role] || [];
    
    // Verificar se todas as permissões da categoria estão ativas
    const allActive = categoryKeys.every(key => 
      rolePermissions.some(p => p.key === key) && !currentPermissions.includes(key)
    );
    
    if (allActive) {
      // Desativar todas as permissões da categoria
      setRolePermissionsChanges(prev => ({
        ...prev,
        [role]: [...(prev[role] || []), ...categoryKeys]
      }));
    } else {
      // Ativar todas as permissões da categoria
      setRolePermissionsChanges(prev => ({
        ...prev,
        [role]: (prev[role] || []).filter(key => !categoryKeys.includes(key))
      }));
    }
    setHasUnsavedChanges(true);
  };

  const saveAllChanges = async () => {
    try {
      setLoading(true);
      
      // Salvar mudanças de todos os roles que têm alterações
      const rolesWithChanges = Object.entries(rolePermissionsChanges)
        .filter(([_, changes]) => changes.length > 0)
        .map(([role, _]) => role as UserRole);
      
      for (const role of rolesWithChanges) {
        await saveRoleChanges(role);
      }
      
      setSelectedRole(null);
    } catch (error) {
      console.error('❌ Erro ao salvar todas as mudanças:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelAllChanges = () => {
    setRolePermissionsChanges({
      master: [],
      admin: [],
      user: []
    });
    setHasUnsavedChanges(false);
    setSelectedRole(null);
  };

  // Funções para gerenciamento de usuários
  const getStatusBadge = (status: string) => {
    return status === 'Ativo' ? 
      <Badge variant="default" className="bg-green-100 text-green-800">Ativo</Badge> :
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inativo</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      master: 'bg-red-100 text-red-800',
      admin: 'bg-blue-100 text-blue-800',
      user: 'bg-green-100 text-green-800'
    };
    const roleNames = {
      master: 'Master',
      admin: 'Admin',
      user: 'Usuário'
    };
    return (
      <Badge variant="secondary" className={roleColors[role as keyof typeof roleColors]}>
        {roleNames[role as keyof typeof roleNames]}
      </Badge>
    );
  };

  const filteredUsuarios = usuarios.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "todos" || user.status.toLowerCase() === filter;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsuarios = filteredUsuarios.slice(startIndex, endIndex);

  // Funções para edição de permissões de usuário
  const startEditingUser = (usuario: FormattedUser) => {
    setEditingUser(usuario);
    setUserPermissionsError(null);
    
    // Inicializar permissões do usuário
    const initialPermissions: Record<string, boolean> = {};
    allPermissions.forEach(permission => {
      // Verificar se a permissão está ativa para o usuário
      const isActive = usuario.permissions.includes(permission.key);
      initialPermissions[permission.key] = isActive;
    });
    
    setUserPermissions(initialPermissions);
  };

  const toggleUserPermission = (permissionKey: string) => {
    setUserPermissions(prev => ({
      ...prev,
      [permissionKey]: !prev[permissionKey]
    }));
  };

  const saveUserPermissions = async () => {
    if (!editingUser) return;

    try {
      setUserPermissionsLoading(true);
      setUserPermissionsError(null);

      // Obter permissões ativas
      const activePermissions = Object.entries(userPermissions)
        .filter(([_, isActive]) => isActive)
        .map(([key, _]) => key);

      // Fazer requisição para atualizar permissões
      const response = await api.put(`/auth/users/${editingUser.id}/permissions`, {
        permissions: activePermissions
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar permissões');
      }

      // Atualizar lista de usuários
      await fetchUsuarios(true);
      
      // Se foi o próprio usuário que teve permissões atualizadas, refresh
      if (editingUser.id === user?.id) {
        console.log('🔄 [saveUserPermissions] Atualizando permissões do usuário atual...');
        await refreshUserPermissions();
      }
      
      // Fechar edição
      setEditingUser(null);
      setUserPermissions({});
      
    } catch (err) {
      console.error('Erro ao salvar permissões do usuário:', err);
      setUserPermissionsError(err instanceof Error ? err.message : 'Erro ao salvar permissões');
    } finally {
      setUserPermissionsLoading(false);
    }
  };

  const cancelUserPermissionsEdit = () => {
    setEditingUser(null);
    setUserPermissions({});
    setUserPermissionsError(null);
  };

  if (!hasPermission('permissao.manage')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Acesso Negado</h3>
          <p className="text-muted-foreground">Você não tem permissão para gerenciar permissões.</p>
        </div>
      </div>
    );
  }

  if (loading && !dataLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando permissões...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erro ao carregar permissões</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={refreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  const stats = getRoleStats();

  return (
    <div className="space-y-8">
      {/* Header com KPIs Executivos */}
      <PageHeader
        title="Gerenciar Permissões"
        description="Configure permissões de roles e usuários do sistema WorkChoque"
        icon={Shield}
        badges={[
          { label: "Apenas MASTER pode editar", icon: UserCheck },
          { label: `${stats.rolesConfigured} roles configurados`, icon: Database },
          { label: "Sistema RBAC Ativo", icon: ShieldCheck }
        ]}
        actions={[
          { 
            label: "Atualizar", 
            icon: RefreshCw, 
            onClick: refreshData,
            variant: 'primary' as const,
            disabled: loading
          }
        ]}
        stats={[
          {
            label: "Total de Permissões",
            value: stats.totalPermissions,
            description: "Permissões no sistema",
            icon: Shield
          },
          {
            label: "Categorias Ativas",
            value: stats.totalCategories,
            description: "Categorias disponíveis",
            icon: Database
          },
          {
            label: "Roles Configurados",
            value: stats.rolesConfigured,
            description: "Roles do sistema",
            icon: Crown
          },
          {
            label: "Mudanças Pendentes",
            value: stats.pendingChanges,
            description: stats.pendingChanges > 0 ? "Aguardando salvamento" : "Tudo salvo",
            icon: Save,
            color: stats.pendingChanges > 0 ? "bg-orange-500" : "bg-green-500"
          }
        ]}
      />

      <div className="container mx-auto px-4">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-muted rounded-xl border border-border shadow-sm p-2 mb-6">
            <TabsList className="grid w-full grid-cols-2 bg-transparent h-12">
              <TabsTrigger 
                value="roles" 
                className="flex items-center gap-3 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg"
              >
                <Crown className="w-5 h-5" />
                <span className="font-semibold">Gerenciar por Role</span>
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="flex items-center gap-3 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg"
              >
                <Users className="w-5 h-5" />
                <span className="font-semibold">Gerenciar por Usuários</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: Gerenciar por Role */}
          <TabsContent value="roles" className="space-y-6">
            {/* Cards de Roles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ROLES.map((roleInfo) => {
                const rolePermissions = rolesPermissions[roleInfo.role];
                const hasChanges = (rolePermissionsChanges[roleInfo.role] || []).length > 0;
                const isSelected = selectedRole === roleInfo.role;
                
                return (
                  <Card 
                    key={roleInfo.role} 
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'ring-2 ring-primary border-primary shadow-lg' 
                        : 'hover:shadow-md border-border'
                    }`}
                    onClick={() => setSelectedRole(isSelected ? null : roleInfo.role)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${roleInfo.color} text-white`}>
                            {roleInfo.icon}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{roleInfo.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {rolePermissions?.length || 0} permissões
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {isSelected && (
                            <Badge variant="default" className="text-xs">
                              Selecionado
                            </Badge>
                          )}
                          {hasChanges && (
                            <Badge variant="destructive" className="text-xs">
                              {rolePermissionsChanges[roleInfo.role].length} mudanças
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Área de Permissões - Aparece quando um role é selecionado */}
            {selectedRole && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${ROLES.find(r => r.role === selectedRole)?.color} text-white`}>
                        {ROLES.find(r => r.role === selectedRole)?.icon}
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          Permissões do {ROLES.find(r => r.role === selectedRole)?.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Configure as permissões para este role
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="px-3 py-1">
                        {(rolePermissionsChanges[selectedRole] || []).length > 0 ? 'Mudanças pendentes' : 'Salvo'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Permissões organizadas por categoria */}
                  {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getCategoryColors(category)}`}>
                            {getCategoryIcon(category)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{formatCategoryName(category)}</h4>
                            <p className="text-sm text-muted-foreground">
                              {(permissions as Permission[]).length} permissões
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleCategoryForRole(selectedRole, category)}
                          className="hover:bg-primary hover:text-white transition-colors duration-200"
                        >
                          {(() => {
                            const categoryKeys = (permissions as Permission[]).map(p => p.key);
                            const rolePermissions = rolesPermissions[selectedRole] || [];
                            const currentPermissions = rolePermissionsChanges[selectedRole] || [];
                            const allActive = categoryKeys.every(key => 
                              rolePermissions.some(p => p.key === key) && !currentPermissions.includes(key)
                            );
                            return allActive ? 'Desmarcar Todas' : 'Marcar Todas';
                          })()}
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(permissions as Permission[]).map(permission => {
                          const isEnabled = isPermissionEnabled(selectedRole, permission.key);
                          return (
                            <div 
                              key={permission.key} 
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                                isEnabled 
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-border bg-background hover:bg-muted/50'
                              }`}
                            >
                              <Checkbox
                                checked={isEnabled}
                                onCheckedChange={() => toggleRolePermission(selectedRole, permission.key)}
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <div className="flex-1">
                                <div className={`font-medium text-sm ${
                                  isEnabled ? 'text-primary' : 'text-foreground'
                                }`}>
                                  {formatPermissionName(permission.key, permission.name)}
                                </div>
                                {permission.description && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {permission.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Botão Flutuante de Salvar */}
            {hasUnsavedChanges && (
              <div className="fixed bottom-6 right-6 z-50">
                <Button
                  onClick={saveAllChanges}
                  disabled={loading}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full px-6 py-3"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {loading ? 'Salvando...' : `Salvar ${stats.pendingChanges} Mudanças`}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: Gerenciar por Usuários */}
          <TabsContent value="users" className="space-y-6">
            {/* Controles */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                {/* Campo de busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar usuários..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>

                {/* Filtro por status */}
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                {/* Modos de visualização */}
                <div className="flex items-center border rounded-lg p-1">
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="h-8 w-8 p-0"
                  >
                    <Table className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 w-8 p-0"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 w-8 p-0"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>

                {/* Botão de atualizar */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsuarios(true)}
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {usersLoading && (
              <Card>
                <CardContent className="p-12">
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin mr-3" />
                    <span>Carregando usuários...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {usersError && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <h4 className="font-semibold text-red-800">Erro ao carregar usuários</h4>
                      <p className="text-sm text-red-600">{usersError}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lista de Usuários */}
            {!usersLoading && !usersError && (
              <>
                {/* Modo Tabela */}
                {viewMode === 'table' && (
                  <Card>
                    <CardContent className="p-0">
                      <TableComponent>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Último Login</TableHead>
                            <TableHead>Permissões</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentUsuarios.map((usuario) => (
                            <TableRow key={usuario.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                      {usuario.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{usuario.name}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-gray-400" />
                                  {usuario.email}
                                </div>
                              </TableCell>
                              <TableCell>{getRoleBadge(usuario.role)}</TableCell>
                              <TableCell>{getStatusBadge(usuario.status)}</TableCell>
                              <TableCell>{usuario.lastLogin}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {usuario.permissions.length} permissões
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => startEditingUser(usuario)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Editar Permissões
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Eye className="mr-2 h-4 w-4" />
                                      Visualizar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600">
                                      <UserX className="mr-2 h-4 w-4" />
                                      Desativar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </TableComponent>
                    </CardContent>
                  </Card>
                )}

                {/* Modo Grid */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentUsuarios.map((usuario) => (
                      <Card key={usuario.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {usuario.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-semibold">{usuario.name}</h4>
                                <p className="text-sm text-muted-foreground">{usuario.email}</p>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => startEditingUser(usuario)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar Permissões
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <UserX className="mr-2 h-4 w-4" />
                                  Desativar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Role:</span>
                              {getRoleBadge(usuario.role)}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Status:</span>
                              {getStatusBadge(usuario.status)}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Último Login:</span>
                              <span className="text-sm">{usuario.lastLogin}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Permissões:</span>
                              <Badge variant="outline" className="text-xs">
                                {usuario.permissions.length}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Modo Lista */}
                {viewMode === 'list' && (
                  <div className="space-y-3">
                    {currentUsuarios.map((usuario) => (
                      <Card key={usuario.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {usuario.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <h4 className="font-semibold">{usuario.name}</h4>
                                  {getRoleBadge(usuario.role)}
                                  {getStatusBadge(usuario.status)}
                                </div>
                                <p className="text-sm text-muted-foreground">{usuario.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">Último Login</div>
                                <div className="text-sm font-medium">{usuario.lastLogin}</div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {usuario.permissions.length} permissões
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => startEditingUser(usuario)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar Permissões
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Visualizar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    <UserX className="mr-2 h-4 w-4" />
                                    Desativar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {startIndex + 1} a {Math.min(endIndex, filteredUsuarios.length)} de {filteredUsuarios.length} usuários
                    </div>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      totalItems={filteredUsuarios.length}
                      itemsPerPage={itemsPerPage}
                      onItemsPerPageChange={setItemsPerPage}
                    />
                  </div>
                )}

                {/* Área de Edição de Permissões do Usuário */}
                {editingUser && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary text-white">
                            <UserCog className="w-5 h-5" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">
                              Editando Permissões: {editingUser.name}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Role: {getRoleBadge(editingUser.role)} | Email: {editingUser.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="px-3 py-1">
                            {Object.values(userPermissions).filter(Boolean).length} permissões ativas
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      {/* Error State */}
                      {userPermissionsError && (
                        <Card className="border-red-200 bg-red-50">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <AlertCircle className="w-5 h-5 text-red-600" />
                              <div>
                                <h4 className="font-semibold text-red-800">Erro ao Salvar</h4>
                                <p className="text-sm text-red-600">{userPermissionsError}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Permissões organizadas por categoria */}
                      {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                        <div key={category} className="space-y-3">
                          <div className="flex items-center justify-between border-b border-border pb-2">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${getCategoryColors(category)}`}>
                                {getCategoryIcon(category)}
                              </div>
                              <div>
                                <h4 className="font-semibold text-lg">{formatCategoryName(category)}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {(permissions as Permission[]).length} permissões
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const categoryKeys = (permissions as Permission[]).map(p => p.key);
                                const allActive = categoryKeys.every(key => userPermissions[key]);
                                
                                // Toggle all permissions in this category
                                const newPermissions = { ...userPermissions };
                                categoryKeys.forEach(key => {
                                  newPermissions[key] = !allActive;
                                });
                                setUserPermissions(newPermissions);
                              }}
                              className="hover:bg-primary hover:text-white transition-colors duration-200"
                            >
                              {(() => {
                                const categoryKeys = (permissions as Permission[]).map(p => p.key);
                                const allActive = categoryKeys.every(key => userPermissions[key]);
                                return allActive ? 'Desmarcar Todas' : 'Marcar Todas';
                              })()}
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {(permissions as Permission[]).map(permission => {
                              const isEnabled = userPermissions[permission.key] || false;
                              return (
                                <div 
                                  key={permission.key} 
                                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                                    isEnabled 
                                      ? 'border-primary bg-primary/5' 
                                      : 'border-border bg-background hover:bg-muted/50'
                                  }`}
                                >
                                  <Checkbox
                                    checked={isEnabled}
                                    onCheckedChange={() => toggleUserPermission(permission.key)}
                                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                  />
                                  <div className="flex-1">
                                    <div className={`font-medium text-sm ${
                                      isEnabled ? 'text-primary' : 'text-foreground'
                                    }`}>
                                      {formatPermissionName(permission.key, permission.name)}
                                    </div>
                                    {permission.description && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {permission.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {/* Ações */}
                      <div className="flex items-center justify-between pt-6 border-t border-border">
                        <div className="text-sm text-muted-foreground">
                          {Object.values(userPermissions).filter(Boolean).length} de {Object.keys(userPermissions).length} permissões ativas
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            onClick={cancelUserPermissionsEdit}
                            disabled={userPermissionsLoading}
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={saveUserPermissions}
                            disabled={userPermissionsLoading}
                            className="bg-primary hover:bg-primary/90 text-white"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {userPermissionsLoading ? 'Salvando...' : 'Salvar Permissões'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
