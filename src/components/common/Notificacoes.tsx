import React, { useState, useEffect } from 'react';
import ModalLayout from '@/components/common/ModalLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  BellRing,
  Search,
  Filter,
  Check,
  CheckCheck,
  Trash2,
  Plus,
  Send,
  MoreHorizontal,
  AlertTriangle,
  Info,
  AlertCircle,
  CheckCircle,
  Shield,
  Loader2,
  RefreshCw,
  Eye,
  Calendar,
  Clock,
  User,
  Users,
  Crown,
  Globe,
  UserCheck,
  FileText,
  Settings,
  Rocket,
  Wrench,
  Trophy,
  TrendingUp,
  Lock,
  Lightbulb,
  Target,
  Zap,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { usePermissions } from '@/contexts/PermissionsContext';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import { api, SessionExpiredError } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'security';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  is_global: boolean;
  action_url: string | null;
  created_at: string;
  read_at: string | null;
  user_id: string | null;
  role: string | null;
  expires_at?: string | null;
}

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'security';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  icon: React.ComponentType<{ className?: string }>;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'master' | 'admin' | 'user';
}

interface CreateNotificationData {
  recipients: 'global' | 'role' | 'users';
  selectedRole?: 'master' | 'admin' | 'user';
  selectedUsers?: string[];
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'security';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: string;
  actionUrl?: string;
}

export default function Notificacoes() {
  const { user } = useAuthStore();
  const { hasPermission } = usePermissions();
  
  // Estados principais
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("todas");
  const [filterPriority, setFilterPriority] = useState("todas");
  const [filterStatus, setFilterStatus] = useState("nao_lidas");

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Estados de seleção
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  // Estados para envio de notificações
  const [activeTab, setActiveTab] = useState<'received' | 'send'>('received');
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [createNotificationData, setCreateNotificationData] = useState<CreateNotificationData>({
    recipients: 'global',
    title: '',
    message: '',
    type: 'info',
    priority: 'medium'
  });
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [sentNotifications, setSentNotifications] = useState<Notification[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  // Estados para confirmação e sucesso
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Estados para modal de detalhes
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Estados para notificações enviadas
  const [sentNotificationsLoading, setSentNotificationsLoading] = useState(false);
  const [sentNotificationsSearch, setSentNotificationsSearch] = useState('');
  const [sentNotificationsFilter, setSentNotificationsFilter] = useState('all');
  const [sentNotificationsPage, setSentNotificationsPage] = useState(1);
  const [sentNotificationsTotal, setSentNotificationsTotal] = useState(0);
  const sentNotificationsPerPage = 10;

  // Templates de notificações
  const notificationTemplates: NotificationTemplate[] = [
    {
      id: 'system_update',
      name: 'Novo Sistema',
      title: 'Sistema atualizado com sucesso',
      message: 'Uma nova versão do sistema foi implementada com melhorias e correções. Recomendamos que você faça logout e login novamente para aproveitar as novas funcionalidades.',
      type: 'success',
      priority: 'medium',
      icon: Rocket
    },
    {
      id: 'maintenance',
      name: 'Manutenção',
      title: 'Manutenção programada',
      message: 'Informamos que será realizada uma manutenção programada no sistema. Durante este período, algumas funcionalidades podem estar temporariamente indisponíveis.',
      type: 'warning',
      priority: 'high',
      icon: Wrench
    },
    {
      id: 'goal_achieved',
      name: 'Meta Atingida',
      title: 'Meta atingida! Parabéns equipe',
      message: 'Parabéns! A equipe atingiu a meta estabelecida. Continue com o excelente trabalho e vamos em busca de novos desafios!',
      type: 'success',
      priority: 'medium',
      icon: Trophy
    },
    {
      id: 'security_alert',
      name: 'Segurança',
      title: 'Alerta de segurança detectado',
      message: 'Foi detectada uma atividade suspeita no sistema. Por favor, verifique sua conta e altere sua senha caso necessário.',
      type: 'security',
      priority: 'urgent',
      icon: Shield
    },
    {
      id: 'report_available',
      name: 'Relatório',
      title: 'Novo relatório disponível',
      message: 'Um novo relatório foi gerado e está disponível para visualização. Acesse a seção de relatórios para conferir os dados atualizados.',
      type: 'info',
      priority: 'medium',
      icon: FileText
    },
    {
      id: 'daily_tip',
      name: 'Dica do Dia',
      title: 'Dica do dia: Como usar o sistema',
      message: 'Você sabia que pode usar filtros avançados nos relatórios? Clique no ícone de filtro para descobrir novas funcionalidades.',
      type: 'info',
      priority: 'low',
      icon: Lightbulb
    }
  ];

  // Função para buscar usuários
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await api.get('/auth/users');
      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  // Função para buscar notificações enviadas
  const fetchSentNotifications = React.useCallback(async () => {
    setSentNotificationsLoading(true);
    try {
      const params = new URLSearchParams({
        page: sentNotificationsPage.toString(),
        limit: sentNotificationsPerPage.toString(),
        search: sentNotificationsSearch,
        filter: sentNotificationsFilter
      });

      const response = await api.get(`/api/notifications/sent?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSentNotifications(data.notifications || []);
        setSentNotificationsTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Erro ao buscar notificações enviadas:', error);
      setSentNotifications([]);
    } finally {
      setSentNotificationsLoading(false);
    }
  }, [sentNotificationsPage, sentNotificationsPerPage, sentNotificationsSearch, sentNotificationsFilter]);

  // Função para aplicar template
  const applyTemplate = (template: NotificationTemplate) => {
    setCreateNotificationData(prev => ({
      ...prev,
      title: template.title,
      message: template.message,
      type: template.type,
      priority: template.priority
    }));
    setSelectedTemplate(template.id);
  };

  // Função para mostrar modal de confirmação
  const handleSendClick = () => {
    setShowConfirmModal(true);
  };

  // Função para abrir modal de detalhes
  const handleViewDetails = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDetailsModal(true);
  };

  // Função para enviar notificação (após confirmação)
  const sendNotification = async () => {
    try {
      setSendingNotification(true);
      setNotificationError(null);
      setShowConfirmModal(false); // Fechar modal de confirmação

      const { recipients, selectedRole, selectedUsers, title, message, type, priority, expiresAt, actionUrl } = createNotificationData;

      if (!title.trim() || !message.trim()) {
        throw new Error('Título e mensagem são obrigatórios');
      }

      let response;

      if (recipients === 'global') {
        // Enviar notificação global
        response = await api.post('/notifications/broadcast', {
          title,
          message,
          type
        });
      } else if (recipients === 'role') {
        // Enviar notificação por role
        response = await api.post('/notifications', {
          role: selectedRole,
          title,
          message,
          type,
          priority,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          action_url: actionUrl
        });
      } else {
        // Enviar notificação para usuários específicos
        if (!selectedUsers || selectedUsers.length === 0) {
          throw new Error('Selecione pelo menos um usuário');
        }

        // Criar notificação para cada usuário selecionado
        const promises = selectedUsers.map(userId => 
          api.post('/notifications', {
            userId,
            title,
            message,
            type,
            priority,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            action_url: actionUrl
          })
        );

        response = await Promise.all(promises);
      }

      // Limpar formulário
      setCreateNotificationData({
        recipients: 'global',
        title: '',
        message: '',
        type: 'info',
        priority: 'medium'
      });
      setSelectedTemplate(null);

      // Atualizar lista de notificações enviadas
      await fetchNotifications();
      await fetchSentNotifications();

      // Mostrar modal de sucesso
      setShowSuccessModal(true);

    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      setNotificationError(error instanceof Error ? error.message : 'Erro ao enviar notificação');
    } finally {
      setSendingNotification(false);
    }
  };

  // Buscar notificações
  const fetchNotifications = React.useCallback(async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await api.get('/notifications?limit=100');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar notificações');
      }

      const data: Notification[] = await response.json();
      setNotifications(data);
    } catch (err) {
      if (err instanceof SessionExpiredError) return;
      console.error('Erro ao buscar notificações:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar notificações');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Marcar como lida
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_read: true, read_at: new Date().toISOString() }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    try {
      const response = await api.put('/notifications/read-all');
      
      if (response.ok) {
        setNotifications([]);
        window.dispatchEvent(new CustomEvent('notifications:read-all'));
        fetchNotifications(true);
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  // Deletar notificação (apenas admins/masters)
  const deleteNotification = async (notificationId: string) => {
    if (!hasPermission('notification.manage')) return;

    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      
      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      }
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  };

  // Verificar permissão
  const canView = hasPermission('notification.view');

  // Carregar notificações ao montar
  useEffect(() => {
    if (canView) {
      fetchNotifications();
    }
  }, [canView, fetchNotifications]);

  useEffect(() => {
    const handler = () => {
      setNotifications([]);
      fetchNotifications();
    };

    window.addEventListener('notifications:read-all', handler);
    return () => {
      window.removeEventListener('notifications:read-all', handler);
    };
  }, [fetchNotifications]);

  // Carregar usuários quando a tab de envio for ativada
  useEffect(() => {
    if (canView && activeTab === 'send' && users.length === 0) {
      fetchUsers();
    }
  }, [canView, activeTab, users.length]);

  // Buscar notificações enviadas quando mudar para tab de envio
  useEffect(() => {
    if (canView && activeTab === 'send') {
      fetchSentNotifications();
    }
  }, [canView, activeTab, fetchSentNotifications]);

  if (!canView) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Acesso Negado"
          description="Você não tem permissão para visualizar notificações"
          icon={Bell}
        />
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
            <p className="text-muted-foreground">
              Entre em contato com o administrador para solicitar acesso.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filtrar notificações
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "todas" || notification.type === filterType;
    const matchesPriority = filterPriority === "todas" || notification.priority === filterPriority;
    const isArchivedView = filterStatus === "arquivadas";
    const visibleByStatus = isArchivedView ? notification.is_read : !notification.is_read;

    return matchesSearch && matchesType && matchesPriority && visibleByStatus;
  });

  // Calcular paginação
  const totalItems = filteredNotifications.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + itemsPerPage);

  // Contadores para badges
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const urgentCount = notifications.filter(n => n.priority === 'urgent' && !n.is_read).length;

  // Handlers de paginação
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Resetar página quando filtros mudam
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Obter configuração específica por role
  const getPageConfig = () => {
    switch (user?.role) {
      case 'user':
        return {
          title: "Minhas Notificações",
          description: "Acompanhe atualizações sobre seus diagnósticos e planos",
          icon: Bell,
          badges: [
            { label: `${totalItems} notificações`, icon: Bell },
            { label: `${unreadCount} não lidas`, icon: BellRing },
            { label: "Pessoal", icon: User }
          ]
        };
      case 'admin':
        return {
          title: "Notificações da Plataforma",
          description: "Monitore atividades e alertas operacionais",
          icon: BellRing,
          badges: [
            { label: `${totalItems} notificações`, icon: Bell },
            { label: `${unreadCount} não lidas`, icon: BellRing },
            { label: `${urgentCount} urgentes`, icon: AlertTriangle },
            { label: "Operacional", icon: Users }
          ]
        };
      case 'master':
        return {
          title: "Central de Notificações",
          description: "Gerencie todas as notificações e alertas do sistema",
          icon: Crown,
          badges: [
            { label: `${totalItems} notificações`, icon: Bell },
            { label: `${unreadCount} não lidas`, icon: BellRing },
            { label: `${urgentCount} urgentes`, icon: AlertTriangle },
            { label: "Executivo", icon: Crown }
          ]
        };
      default:
        return {
          title: "Notificações",
          description: "Centro de notificações",
          icon: Bell,
          badges: []
        };
    }
  };

  const config = getPageConfig();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'security': return <Shield className="w-5 h-5 text-purple-500" />;
      default: return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50/80 dark:bg-red-950/30';
      case 'high':
        return 'border-l-orange-500 bg-orange-50/80 dark:bg-orange-950/30';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50/80 dark:bg-blue-950/30';
      case 'low':
        return 'border-l-slate-400 bg-slate-50/80 dark:bg-slate-900/40';
      default:
        return 'border-l-border bg-card';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return `${Math.floor(diffInMinutes / 1440)}d atrás`;
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={config.title}
        description={config.description}
        icon={config.icon}
        badges={config.badges}
        actions={[
          { 
            label: refreshing ? "Atualizando..." : "Atualizar", 
            icon: refreshing ? Loader2 : RefreshCw, 
            onClick: () => fetchNotifications(true),
            variant: 'primary' as const,
            disabled: refreshing
          },
          ...(unreadCount > 0 ? [{
            label: "Marcar Todas como Lidas", 
            icon: CheckCheck, 
            onClick: markAllAsRead,
            variant: 'secondary' as const
          }] : [])
        ]}
      />

      {/* Tabs para Recebidas e Enviar */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'received' | 'send')}>
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="received" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Recebidas
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          {hasPermission('notification.create') && (
            <TabsTrigger value="send" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Enviar
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab: Recebidas */}
        <TabsContent value="received" className="space-y-6">
          <div className="container mx-auto px-4">
        {/* Controles de Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
                {/* Busca */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar notificações..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filtros */}
                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      <SelectItem value="nao_lidas">Não Lidas</SelectItem>
                      <SelectItem value="arquivadas">Arquivadas</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todos os Tipos</SelectItem>
                      <SelectItem value="info">Informação</SelectItem>
                      <SelectItem value="warning">Aviso</SelectItem>
                      <SelectItem value="error">Erro</SelectItem>
                      <SelectItem value="success">Sucesso</SelectItem>
                      <SelectItem value="security">Segurança</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Estatísticas rápidas */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Bell className="w-4 h-4" />
                  <span>{totalItems} total</span>
                </div>
                <div className="flex items-center gap-1">
                  <BellRing className="w-4 h-4" />
                  <span>{unreadCount} não lidas</span>
                </div>
                {urgentCount > 0 && (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{urgentCount} urgentes</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estados de Loading e Error */}
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="w-12 h-12 mx-auto text-muted-foreground mb-4 animate-spin" />
              <h3 className="text-lg font-semibold mb-2">Carregando notificações...</h3>
              <p className="text-muted-foreground">
                Por favor, aguarde enquanto buscamos suas notificações.
              </p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-red-600">Erro ao carregar notificações</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => fetchNotifications()} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        ) : totalItems > 0 ? (
          <>
            {/* Lista de Notificações */}
            <div className="space-y-3">
              {paginatedNotifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`border-l-4 hover:shadow-md transition-shadow cursor-pointer ${
                    getPriorityColor(notification.priority)
                  } ${!notification.is_read ? 'ring-1 ring-primary/10' : ''}`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Ícone do tipo */}
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className={`text-lg font-semibold ${
                              !notification.is_read ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                              {notification.title}
                            </h3>
                            
                            {!notification.is_read && (
                              <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                            )}

                            <Badge variant="outline" className="text-xs">
                              {notification.priority === 'urgent' ? 'Urgente' :
                               notification.priority === 'high' ? 'Alta' :
                               notification.priority === 'medium' ? 'Média' : 'Baixa'}
                            </Badge>

                            <Badge variant={
                              notification.type === 'error' ? 'destructive' :
                              notification.type === 'warning' ? 'secondary' :
                              notification.type === 'success' ? 'default' : 'outline'
                            }>
                              {notification.type === 'info' ? 'Info' :
                               notification.type === 'warning' ? 'Aviso' :
                               notification.type === 'error' ? 'Erro' :
                               notification.type === 'success' ? 'Sucesso' : 'Segurança'}
                            </Badge>
                          </div>

                          <p className={`text-sm leading-relaxed mb-3 ${
                            !notification.is_read ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatTimeAgo(notification.created_at)}</span>
                              </div>
                              
                              {notification.is_global && (
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span>Global</span>
                                </div>
                              )}
                              
                              {notification.role && (
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  <span>{notification.role}</span>
                                </div>
                              )}

                              {notification.read_at && (
                                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Lida em {new Date(notification.read_at).toLocaleDateString('pt-BR')}</span>
                                </div>
                              )}
                            </div>

                            {/* Ações */}
                            <div className="flex items-center gap-2">
                              {!notification.is_read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Marcar como Lida
                                </Button>
                              )}

                              {notification.action_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(notification.action_url!, '_blank');
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Ver Detalhes
                                </Button>
                              )}

                              {hasPermission('notification.manage') && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem
                                      onClick={() => deleteNotification(notification.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Deletar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  showPageSizeSelector={true}
                  pageSizeOptions={[10, 15, 25, 50]}
                  className="border-t pt-4"
                />
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma notificação encontrada</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterType !== "todas" || filterPriority !== "todas" || filterStatus !== "todas"
                  ? "Tente ajustar os filtros ou termo de busca."
                  : "Você não tem notificações no momento."
                }
              </p>
            </CardContent>
          </Card>
        )}
          </div>
        </TabsContent>

        {/* Tab: Enviar Notificações */}
        {hasPermission('notification.create') && (
          <TabsContent value="send" className="space-y-6">
            <div className="container mx-auto px-4">
              {/* Erro */}
              {notificationError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{notificationError}</AlertDescription>
                </Alert>
              )}

              {/* Formulário Principal */}
              <div className="space-y-8">
                {/* 1. Seleção de Destinatários */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Para quem enviar?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Global */}
                        <div 
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            createNotificationData.recipients === 'global' 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setCreateNotificationData(prev => ({
                            ...prev,
                            recipients: 'global',
                            selectedUsers: undefined,
                            selectedRole: undefined
                          }))}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              createNotificationData.recipients === 'global' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            }`}>
                              <Globe className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">🌍 Todos os usuários</div>
                              <div className="text-xs text-muted-foreground">Envio global</div>
                            </div>
                          </div>
                        </div>

                        {/* Por Role */}
                        <div 
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            createNotificationData.recipients === 'role' 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setCreateNotificationData(prev => ({
                            ...prev,
                            recipients: 'role',
                            selectedUsers: undefined
                          }))}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              createNotificationData.recipients === 'role' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            }`}>
                              <Users className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">👥 Por função</div>
                              <div className="text-xs text-muted-foreground">Selecionar role</div>
                            </div>
                          </div>
                        </div>

                        {/* Usuários Específicos */}
                        <div 
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            createNotificationData.recipients === 'users' 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setCreateNotificationData(prev => ({
                            ...prev,
                            recipients: 'users'
                          }))}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              createNotificationData.recipients === 'users' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            }`}>
                              <UserCheck className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">👤 Usuários específicos</div>
                              <div className="text-xs text-muted-foreground">Selecionar individual</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Seleção de Role */}
                      {createNotificationData.recipients === 'role' && (
                        <div className="mt-4">
                          <Label className="text-sm font-medium">Selecionar função:</Label>
                          <Select
                            value={createNotificationData.selectedRole}
                            onValueChange={(value) => setCreateNotificationData(prev => ({
                              ...prev,
                              selectedRole: value as 'master' | 'admin' | 'user'
                            }))}
                          >
                            <SelectTrigger className="w-48 mt-1">
                              <SelectValue placeholder="Escolha o role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="master">👑 Master</SelectItem>
                              <SelectItem value="admin">🛡️ Admin</SelectItem>
                              <SelectItem value="user">👤 User</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Seleção de Usuários Específicos */}
                      {createNotificationData.recipients === 'users' && (
                        <div className="mt-4 space-y-4">
                          {/* Busca */}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                              placeholder="Buscar usuários..."
                              className="pl-10"
                              onChange={(e) => {
                                // Implementar busca de usuários
                              }}
                            />
                          </div>

                          {/* Lista de usuários */}
                          <div className="max-h-48 overflow-y-auto border rounded-lg">
                            {users.map((user) => (
                              <div key={user.id} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                                <Checkbox
                                  checked={createNotificationData.selectedUsers?.includes(user.id) || false}
                                  onCheckedChange={(checked) => {
                                    const currentUsers = createNotificationData.selectedUsers || [];
                                    if (checked) {
                                      setCreateNotificationData(prev => ({
                                        ...prev,
                                        selectedUsers: [...currentUsers, user.id]
                                      }));
                                    } else {
                                      setCreateNotificationData(prev => ({
                                        ...prev,
                                        selectedUsers: currentUsers.filter(id => id !== user.id)
                                      }));
                                    }
                                  }}
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{user.name}</div>
                                  <div className="text-xs text-muted-foreground">{user.email}</div>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {user.role === 'master' ? '👑' : user.role === 'admin' ? '🛡️' : '👤'} {user.role}
                                </Badge>
                              </div>
                            ))}
                          </div>

                          {/* Usuários selecionados */}
                          {createNotificationData.selectedUsers && createNotificationData.selectedUsers.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {createNotificationData.selectedUsers.map(userId => {
                                const user = users.find(u => u.id === userId);
                                return user ? (
                                  <Badge key={userId} variant="secondary" className="gap-1">
                                    {user.name}
                                    <X 
                                      className="w-3 h-3 cursor-pointer" 
                                      onClick={() => setCreateNotificationData(prev => ({
                                        ...prev,
                                        selectedUsers: prev.selectedUsers?.filter(id => id !== userId)
                                      }))}
                                    />
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Conteúdo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Conteúdo da Notificação
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      
                      {/* Templates */}
                      <div className="space-y-4">
                        <div className="text-sm font-medium text-muted-foreground">Templates rápidos:</div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                          {notificationTemplates.map((template) => {
                            const isSelected = selectedTemplate === template.id;
                            return (
                              <div
                                key={template.id}
                                className={`group p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 relative ${
                                  isSelected 
                                    ? 'border-primary bg-primary/5 shadow-md' 
                                    : 'border-border hover:border-primary hover:shadow-sm'
                                }`}
                                onClick={() => applyTemplate(template)}
                              >
                                {/* Indicador de seleção */}
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                                  </div>
                                )}
                                
                                <div className="text-center space-y-2">
                                  <div className={`mx-auto w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                                    isSelected 
                                      ? 'bg-primary text-primary-foreground scale-110' 
                                      : 'bg-muted group-hover:scale-110'
                                  }`}>
                                    <template.icon className={`w-4 h-4 ${
                                      isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
                                    }`} />
                                  </div>
                                  <div className={`text-xs font-medium transition-colors duration-200 ${
                                    isSelected ? 'text-primary' : 'text-foreground'
                                  }`}>
                                    {template.name}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Campos de entrada */}
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="title" className="text-sm font-medium">Título:</Label>
                          <Input
                            id="title"
                            value={createNotificationData.title}
                            onChange={(e) => {
                              setCreateNotificationData(prev => ({
                                ...prev,
                                title: e.target.value
                              }));
                              // Se o usuário modificar manualmente, desmarcar template
                              if (selectedTemplate) {
                                setSelectedTemplate(null);
                              }
                            }}
                            placeholder="Digite o título da notificação..."
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="message" className="text-sm font-medium">Mensagem:</Label>
                          <Textarea
                            id="message"
                            value={createNotificationData.message}
                            onChange={(e) => {
                              setCreateNotificationData(prev => ({
                                ...prev,
                                message: e.target.value
                              }));
                              // Se o usuário modificar manualmente, desmarcar template
                              if (selectedTemplate) {
                                setSelectedTemplate(null);
                              }
                            }}
                            placeholder="Digite a mensagem..."
                            rows={4}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Configurações Avançadas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Configurações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="type" className="text-sm font-medium">Tipo:</Label>
                          <Select
                            value={createNotificationData.type}
                            onValueChange={(value) => setCreateNotificationData(prev => ({
                              ...prev,
                              type: value as 'info' | 'warning' | 'error' | 'success' | 'security'
                            }))}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="info">ℹ️ Info</SelectItem>
                              <SelectItem value="warning">⚠️ Aviso</SelectItem>
                              <SelectItem value="error">❌ Erro</SelectItem>
                              <SelectItem value="success">✅ Sucesso</SelectItem>
                              <SelectItem value="security">🔒 Segurança</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="priority" className="text-sm font-medium">Prioridade:</Label>
                          <Select
                            value={createNotificationData.priority}
                            onValueChange={(value) => setCreateNotificationData(prev => ({
                              ...prev,
                              priority: value as 'low' | 'medium' | 'high' | 'urgent'
                            }))}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">🟢 Baixa</SelectItem>
                              <SelectItem value="medium">🟡 Média</SelectItem>
                              <SelectItem value="high">🟠 Alta</SelectItem>
                              <SelectItem value="urgent">🔴 Urgente</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="expires" className="text-sm font-medium">Expira:</Label>
                          <Select
                            value={createNotificationData.expiresAt || '7d'}
                            onValueChange={(value) => setCreateNotificationData(prev => ({
                              ...prev,
                              expiresAt: value === 'never' ? undefined : value
                            }))}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1d">1 dia</SelectItem>
                              <SelectItem value="7d">7 dias</SelectItem>
                              <SelectItem value="30d">30 dias</SelectItem>
                              <SelectItem value="never">Nunca</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="actionUrl" className="text-sm font-medium">Link de ação:</Label>
                          <Input
                            id="actionUrl"
                            value={createNotificationData.actionUrl || ''}
                            onChange={(e) => setCreateNotificationData(prev => ({
                              ...prev,
                              actionUrl: e.target.value || undefined
                            }))}
                            placeholder="https://exemplo.com"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 4. Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Preview da Notificação
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      
                      <div className="bg-muted/30 rounded-lg border p-4">
                        <div className="flex items-start gap-3">
                          {getNotificationIcon(createNotificationData.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm">
                                {createNotificationData.title || 'Título da notificação'}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {createNotificationData.priority === 'urgent' ? '🔴 Urgente' :
                                 createNotificationData.priority === 'high' ? '🟠 Alta' :
                                 createNotificationData.priority === 'medium' ? '🟡 Média' : '🟢 Baixa'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {createNotificationData.message || 'Mensagem que será enviada...'}
                            </p>
                            <div className="text-xs text-muted-foreground">
                              Para: {
                                createNotificationData.recipients === 'global' ? '🌍 Todos os usuários' :
                                createNotificationData.recipients === 'role' ? `👥 Role: ${createNotificationData.selectedRole}` :
                                `👤 ${createNotificationData.selectedUsers?.length || 0} usuário(s) selecionado(s)`
                              }
                              {createNotificationData.expiresAt && createNotificationData.expiresAt !== 'never' && (
                                <> • Expira em: {createNotificationData.expiresAt}</>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 5. Ações */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCreateNotificationData({
                            recipients: 'global',
                            title: '',
                            message: '',
                            type: 'info',
                            priority: 'medium'
                          });
                          setSelectedTemplate(null);
                        }}
                        disabled={sendingNotification}
                        className="px-8"
                      >
                        Limpar
                      </Button>
                      <Button
                        onClick={handleSendClick}
                        disabled={sendingNotification || !createNotificationData.title || !createNotificationData.message}
                        className="px-8"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {sendingNotification ? 'Enviando...' : 'Enviar Notificação'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Espaçamento entre seções principais */}
              <div className="mt-12"></div>

              {/* Notificações Enviadas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Notificações Enviadas
                  </CardTitle>
                  <CardDescription>
                    Histórico de todas as notificações enviadas por você
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Filtros e Busca */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Buscar por título ou mensagem..."
                          value={sentNotificationsSearch}
                          onChange={(e) => setSentNotificationsSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select
                      value={sentNotificationsFilter}
                      onValueChange={(value) => setSentNotificationsFilter(value)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filtrar por tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="info">ℹ️ Informação</SelectItem>
                        <SelectItem value="warning">⚠️ Aviso</SelectItem>
                        <SelectItem value="error">❌ Erro</SelectItem>
                        <SelectItem value="success">✅ Sucesso</SelectItem>
                        <SelectItem value="security">🔒 Segurança</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tabela de Notificações Enviadas */}
                  {sentNotificationsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Carregando notificações...</p>
                      </div>
                    </div>
                  ) : sentNotifications.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma notificação enviada ainda</p>
                      <p className="text-sm">Suas notificações enviadas aparecerão aqui</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Título</TableHead>
                              <TableHead>Destinatários</TableHead>
                              <TableHead>Prioridade</TableHead>
                              <TableHead>Enviada em</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sentNotifications.map((notification) => (
                              <TableRow key={notification.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getNotificationIcon(notification.type)}
                                    <span className="capitalize text-sm">
                                      {notification.type === 'info' ? 'Info' : 
                                       notification.type === 'warning' ? 'Aviso' :
                                       notification.type === 'error' ? 'Erro' :
                                       notification.type === 'success' ? 'Sucesso' :
                                       notification.type === 'security' ? 'Segurança' : notification.type}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="max-w-xs">
                                    <p className="font-medium truncate">{notification.title}</p>
                                    <p className="text-sm text-muted-foreground truncate">
                                      {notification.message}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    {notification.is_global ? '🌍 Global' :
                                     notification.role ? `👥 ${notification.role}` :
                                     notification.user_id ? '👤 Usuário específico' : 'Indefinido'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={
                                      notification.priority === 'urgent' ? 'destructive' :
                                      notification.priority === 'high' ? 'default' :
                                      notification.priority === 'medium' ? 'secondary' : 'outline'
                                    }
                                  >
                                    {notification.priority === 'urgent' ? '🔴 Urgente' :
                                     notification.priority === 'high' ? '🟠 Alta' :
                                     notification.priority === 'medium' ? '🟡 Média' : '🟢 Baixa'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {new Date(notification.created_at).toLocaleDateString('pt-BR')}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(notification.created_at).toLocaleTimeString('pt-BR')}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-green-600 border-green-200">
                                    ✅ Enviada
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewDetails(notification)}
                                    className="h-8 px-3"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Ver Detalhes
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Paginação */}
                      {sentNotificationsTotal > sentNotificationsPerPage && (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            Mostrando {((sentNotificationsPage - 1) * sentNotificationsPerPage) + 1} a{' '}
                            {Math.min(sentNotificationsPage * sentNotificationsPerPage, sentNotificationsTotal)} de{' '}
                            {sentNotificationsTotal} notificações
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSentNotificationsPage(prev => Math.max(1, prev - 1))}
                              disabled={sentNotificationsPage === 1}
                            >
                              Anterior
                            </Button>
                            <span className="text-sm">
                              Página {sentNotificationsPage} de {Math.ceil(sentNotificationsTotal / sentNotificationsPerPage)}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSentNotificationsPage(prev => prev + 1)}
                              disabled={sentNotificationsPage >= Math.ceil(sentNotificationsTotal / sentNotificationsPerPage)}
                            >
                              Próxima
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Modal de Detalhes da Notificação */}
      <ModalLayout
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="📋 Detalhes da Notificação"
        size="lg"
      >
        {selectedNotification && (
          <div className="space-y-6">
            {/* Cabeçalho com tipo e prioridade */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                {getNotificationIcon(selectedNotification.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-foreground">
                    {selectedNotification.title}
                  </h3>
                  <Badge 
                    variant={
                      selectedNotification.priority === 'urgent' ? 'destructive' :
                      selectedNotification.priority === 'high' ? 'default' :
                      selectedNotification.priority === 'medium' ? 'secondary' : 'outline'
                    }
                  >
                    {selectedNotification.priority === 'urgent' ? '🔴 Urgente' :
                     selectedNotification.priority === 'high' ? '🟠 Alta' :
                     selectedNotification.priority === 'medium' ? '🟡 Média' : '🟢 Baixa'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedNotification.type === 'info' ? 'ℹ️ Informação' : 
                   selectedNotification.type === 'warning' ? '⚠️ Aviso' :
                   selectedNotification.type === 'error' ? '❌ Erro' :
                   selectedNotification.type === 'success' ? '✅ Sucesso' :
                   selectedNotification.type === 'security' ? '🔒 Segurança' : selectedNotification.type}
                </p>
              </div>
            </div>

            {/* Mensagem completa */}
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">💬 Mensagem:</h4>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedNotification.message}
                </p>
              </div>
            </div>

            {/* Informações detalhadas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">🎯 Destinatários:</h4>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-sm">
                    {selectedNotification.is_global ? '🌍 Todos os usuários' :
                     selectedNotification.role ? `👥 ${selectedNotification.role}` :
                     selectedNotification.user_id ? '👤 Usuário específico' : 'Indefinido'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">📅 Data de Envio:</h4>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-sm">
                    {new Date(selectedNotification.created_at).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(selectedNotification.created_at).toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">✅ Status:</h4>
                <div className="bg-muted/30 rounded-lg p-3">
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    ✅ Enviada com sucesso
                  </Badge>
                </div>
              </div>

              {selectedNotification.expires_at && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">⏰ Expira em:</h4>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-sm">
                      {new Date(selectedNotification.expires_at).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(selectedNotification.expires_at).toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Botão de fechar */}
            <div className="flex justify-end">
              <Button
                onClick={() => setShowDetailsModal(false)}
                className="px-6"
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </ModalLayout>

      {/* Modal de Confirmação */}
      <ModalLayout
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirmar Envio"
        size="md"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Enviar Notificação
              </h3>
              <p className="text-muted-foreground">
                Tem certeza que deseja enviar esta notificação?
              </p>
            </div>
          </div>
          
          {/* Preview da notificação */}
          <div className="bg-muted/30 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              {getNotificationIcon(createNotificationData.type)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm">
                    {createNotificationData.title}
                  </h4>
                  <Badge 
                    variant={
                      createNotificationData.priority === 'urgent' ? 'destructive' :
                      createNotificationData.priority === 'high' ? 'default' :
                      createNotificationData.priority === 'medium' ? 'secondary' : 'outline'
                    }
                    className="text-xs"
                  >
                    {createNotificationData.priority === 'urgent' ? '🔴 Urgente' :
                     createNotificationData.priority === 'high' ? '🟠 Alta' :
                     createNotificationData.priority === 'medium' ? '🟡 Média' : '🟢 Baixa'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {createNotificationData.message}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {createNotificationData.recipients === 'global' ? '🌍 Todos os usuários' :
                     createNotificationData.recipients === 'role' ? `👥 ${createNotificationData.selectedRole}` :
                     `👤 ${createNotificationData.selectedUsers?.length || 0} usuário(s) específico(s)`}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              disabled={sendingNotification}
            >
              Cancelar
            </Button>
            <Button
              onClick={sendNotification}
              disabled={sendingNotification}
              className="px-6"
            >
              <Send className="w-4 h-4 mr-2" />
              {sendingNotification ? 'Enviando...' : 'Confirmar Envio'}
            </Button>
          </div>
        </div>
      </ModalLayout>

      {/* Modal de Sucesso */}
      <ModalLayout
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="✅ Notificação Enviada!"
        size="md"
      >
        <div className="text-center space-y-6">
          <div className="mx-auto mb-4 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-green-600">
              Notificação Enviada com Sucesso!
            </h3>
            <p className="text-muted-foreground">
              Sua notificação foi enviada para os destinatários selecionados.
            </p>
          </div>

          {/* Resumo da notificação enviada */}
          <div className="bg-muted/50 rounded-lg p-4 text-left">
            <h4 className="font-semibold mb-2">Resumo da notificação:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Título:</span>
                <span className="font-medium">{createNotificationData.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Destinatários:</span>
                <span className="font-medium">
                  {createNotificationData.recipients === 'global' ? '🌍 Todos os usuários' :
                   createNotificationData.recipients === 'role' ? `👥 ${createNotificationData.selectedRole}` :
                   `👤 ${createNotificationData.selectedUsers?.length || 0} usuário(s)`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prioridade:</span>
                <span className="font-medium">
                  {createNotificationData.priority === 'urgent' ? '🔴 Urgente' :
                   createNotificationData.priority === 'high' ? '🟠 Alta' :
                   createNotificationData.priority === 'medium' ? '🟡 Média' : '🟢 Baixa'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => setShowSuccessModal(false)}
              className="w-full"
            >
              Fechar
            </Button>
            <p className="text-xs text-muted-foreground">
              A notificação aparecerá no histórico de notificações enviadas.
            </p>
          </div>
        </div>
      </ModalLayout>
    </div>
  );
}
