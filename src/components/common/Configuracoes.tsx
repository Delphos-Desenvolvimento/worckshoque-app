import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { usePermissions } from '@/contexts/PermissionsContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PageHeader from './PageHeader';
import { Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  Database, 
  Monitor, 
  Plug, 
  Wrench,
  Save, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Upload,
  Download,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  TestTube,
  Lock,
  Key,
  Globe,
  Palette,
  Building,
  Users,
  BarChart3,
  HardDrive,
  Activity,
  Zap,
  LayoutGrid
} from 'lucide-react';

// ==================== INTERFACES ====================

interface ConfigMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  text: string;
}

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  avatar?: string;
}

interface UserPreferences {
  language: string;
  timezone: string;
  theme: string;
  dashboardLayout: string;
  interfaceDensity: string;
  sidebarPosition: string;
  sidebarMode: string;
  animations: boolean;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  inApp: boolean;
  sms: boolean;
  questionnaireReminders: boolean;
  weeklyReports: boolean;
  securityAlerts: boolean;
  achievements: boolean;
  teamMessages: boolean;
  actionPlanReminders: boolean;
  frequency: string;
  preferredTime: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  previewEnabled: boolean;
  groupingEnabled: boolean;
}

interface PrivacySettings {
  profileVisibility: string;
  activityTracking: boolean;
  dataSharing: boolean;
  analytics: boolean;
  includeInReports: boolean;
  allowBenchmarking: boolean;
  shareFeedbackWithManagers: boolean;
}

// ==================== CONTEXTO DE REGISTRO DE ABAS ====================
type TabRegistryEntry = {
  isDirty: boolean;
  save: () => Promise<void> | void;
  reset: () => void;
  requiredPermission?: string;
};

type ConfigTabsContextType = {
  registerTab: (tabKey: string, entry: TabRegistryEntry) => void;
  updateDirty: (tabKey: string, isDirty: boolean) => void;
  unregisterTab: (tabKey: string) => void;
};

const ConfigTabsContext = createContext<ConfigTabsContextType | null>(null);

// ==================== COMPONENTE PRINCIPAL ====================

export default function Configuracoes() {
  const { user } = useAuthStore();
  const { hasPermission } = usePermissions();
  
  // Estados principais
  const [activeTab, setActiveTab] = useState('perfil');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<ConfigMessage | null>(null);
  const registryRef = useRef<Record<string, TabRegistryEntry>>({});
  const [dirtyCount, setDirtyCount] = useState(0);
  const [savingAll, setSavingAll] = useState(false);

  // Verificar permissões
  const canView = hasPermission('config.view');
  const canEdit = hasPermission('config.edit');

  // Função para obter tabs baseadas no role
  const getTabsForRole = (role: string) => {
    switch(role) {
      case 'user':
        return [
          { key: 'perfil', label: 'Perfil', icon: User },
          { key: 'preferencias', label: 'Preferências', icon: Settings },
          { key: 'notificacoes', label: 'Notificações', icon: Bell },
          { key: 'privacidade', label: 'Privacidade', icon: Shield }
        ];
      case 'admin':
        return [
          { key: 'empresa', label: 'Empresa', icon: Building },
          { key: 'usuarios', label: 'Usuários', icon: Users },
          { key: 'notificacoes', label: 'Notificações', icon: Bell },
          { key: 'analytics', label: 'Analytics', icon: BarChart3 }
        ];
      case 'master':
        return [
          { key: 'seguranca', label: 'Segurança', icon: Shield },
          { key: 'backup', label: 'Backup', icon: Database },
          { key: 'monitoramento', label: 'Monitoramento', icon: Monitor },
          { key: 'integracoes', label: 'Integrações', icon: Plug },
          { key: 'manutencao', label: 'Manutenção', icon: Wrench }
        ];
      default:
        return [];
    }
  };

  const tabs = getTabsForRole(user?.role || 'user');
  const defaultTab = tabs[0]?.key || 'perfil';

  // Definir aba padrão se não houver uma ativa
  useEffect(() => {
    if (!activeTab || !tabs.find(tab => tab.key === activeTab)) {
      setActiveTab(defaultTab);
    }
  }, [activeTab, defaultTab, tabs]);

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
          <p className="text-muted-foreground">Você não tem permissão para acessar as configurações.</p>
        </div>
      </div>
    );
  }

  const recalcDirty = () => {
    const count = Object.values(registryRef.current).filter(e => e.isDirty).length;
    setDirtyCount(count);
  };

  const registerTab = (tabKey: string, entry: TabRegistryEntry) => {
    registryRef.current[tabKey] = entry;
    recalcDirty();
  };

  const updateDirty = (tabKey: string, isDirty: boolean) => {
    if (registryRef.current[tabKey]) {
      registryRef.current[tabKey].isDirty = isDirty;
      recalcDirty();
    }
  };

  const unregisterTab = (tabKey: string) => {
    delete registryRef.current[tabKey];
    recalcDirty();
  };

  const saveAllChanges = async () => {
    if (!dirtyCount) return;
    setSavingAll(true);
    try {
      const dirtyEntries = Object.values(registryRef.current).filter(e => e.isDirty);
      await Promise.all(dirtyEntries.map(e => Promise.resolve(e.save())));
      dirtyEntries.forEach(e => { e.isDirty = false; });
      recalcDirty();
      setMessage({ type: 'success', text: 'Alterações salvas com sucesso.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao salvar alterações.' });
    } finally {
      setSavingAll(false);
    }
  };

  const discardAllChanges = () => {
    const dirtyEntries = Object.values(registryRef.current).filter(e => e.isDirty);
    dirtyEntries.forEach(e => {
      e.reset();
      e.isDirty = false;
    });
    recalcDirty();
  };

  // Função para renderizar conteúdo da aba
  const renderTabContent = (tabKey: string) => {
    switch(user?.role) {
      case 'user':
        switch(tabKey) {
          case 'perfil': return <UserProfileContent canEdit={canEdit} setMessage={setMessage} />;
          case 'preferencias': return <UserPreferencesContent canEdit={canEdit} setMessage={setMessage} />;
          case 'notificacoes': return <UserNotificationsContent canEdit={canEdit} setMessage={setMessage} />;
          case 'privacidade': return <UserPrivacyContent canEdit={canEdit} setMessage={setMessage} />;
        }
        break;
      case 'admin':
        switch(tabKey) {
          case 'empresa': return <AdminCompanyContent canEdit={canEdit} setMessage={setMessage} />;
          case 'usuarios': return <AdminUsersContent canEdit={canEdit} setMessage={setMessage} />;
          case 'notificacoes': return <AdminNotificationsContent canEdit={canEdit} setMessage={setMessage} />;
          case 'analytics': return <AdminAnalyticsContent canEdit={canEdit} setMessage={setMessage} />;
        }
        break;
      case 'master':
        switch(tabKey) {
          case 'seguranca': return <MasterSecurityContent canEdit={canEdit} setMessage={setMessage} />;
          case 'backup': return <MasterBackupContent canEdit={canEdit} setMessage={setMessage} />;
          case 'monitoramento': return <MasterMonitoringContent canEdit={canEdit} setMessage={setMessage} />;
          case 'integracoes': return <MasterIntegrationsContent canEdit={canEdit} setMessage={setMessage} />;
          case 'manutencao': return <MasterMaintenanceContent canEdit={canEdit} setMessage={setMessage} />;
        }
        break;
    }
    return null;
  };

  return (
    <ConfigTabsContext.Provider value={{ registerTab, updateDirty, unregisterTab }}>
    <div className="space-y-6">
      {/* Header */}
      <PageHeader 
        title="Configurações" 
        description={`Configure as opções do sistema para ${user?.role === 'user' ? 'seu perfil' : user?.role === 'admin' ? 'sua empresa' : 'o sistema'}`}
        icon={user?.role === 'user' ? User : user?.role === 'admin' ? Building2 : Settings}
      />

      {/* Mensagem de feedback */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : message.type === 'error' ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full ${tabs.length === 4 ? 'grid-cols-4' : tabs.length === 5 ? 'grid-cols-5' : 'grid-cols-3'}`}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger 
                key={tab.key} 
                value={tab.key}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Conteúdo das tabs */}
        {tabs.map((tab) => (
          <TabsContent key={tab.key} value={tab.key} className="space-y-6">
            {renderTabContent(tab.key)}
          </TabsContent>
        ))}
      </Tabs>

      {dirtyCount > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="flex items-center gap-2">
            <Button
              onClick={discardAllChanges}
              variant="outline"
              size="sm"
              className="rounded-full px-4 py-2 shadow-lg"
              title={!canEdit ? 'Requer permissão: config.edit' : undefined}
              disabled={!canEdit || savingAll}
            >
              Descartar
            </Button>
            <Button
              onClick={saveAllChanges}
              disabled={savingAll || !canEdit}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full px-6 py-3"
              title={!canEdit ? 'Requer permissão: config.edit' : undefined}
            >
              <Save className="w-5 h-5 mr-2" />
              {savingAll ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </div>
      )}
    </div>
    </ConfigTabsContext.Provider>
  );
}

// ==================== COMPONENTES DE CONTEÚDO - USER ====================

function UserProfileContent({ canEdit, setMessage }: { canEdit: boolean; setMessage: (msg: ConfigMessage | null) => void }) {
  const tabsCtx = useContext(ConfigTabsContext);
  const { user, setUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState<UserProfile>({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    department: '',
    position: '',
    avatar: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const initialProfileRef = useRef<UserProfile | null>(null);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Carregar dados do perfil
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const response = await api.get('/auth/profile');
        const data = await response.json();
        
        const profile = data.profile || {};
        
        const initial = {
          name: data.name || user.name,
          email: data.email || user.email,
          phone: profile.phone || '',
          department: profile.department || '',
          position: profile.position || '',
          avatar: profile.avatar || ''
        };
        
        setProfileData(initial);
        initialProfileRef.current = initial;
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        // Fallback to basic user data if API fails
        const initial = {
          name: user.name,
          email: user.email,
          phone: '',
          department: '',
          position: '',
          avatar: ''
        };
        setProfileData(initial);
        initialProfileRef.current = initial;
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error('O arquivo deve ter no máximo 2MB');
      return;
    }

    try {
      setIsLoading(true);
      
      // Convert to Base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64String = reader.result as string;
        
        const response = await api.post('/auth/profile/avatar', {
          avatar: base64String
        });

        if (!response.ok) {
          throw new Error('Falha no upload');
        }
        
        // Update form data with new avatar
        setProfileData(prev => ({ ...prev, avatar: base64String }));
        
        // Update user store if needed
        if (user) {
          // Note: user store might not have avatar field, but we can try to update it if it does
          // or trigger a refresh
        }
        
        toast.success('Foto atualizada com sucesso');
        setIsLoading(false);
      };

      reader.onerror = () => {
        toast.error('Erro ao ler arquivo');
        setIsLoading(false);
      };

    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao atualizar foto');
      setIsLoading(false);
    }
  };

  const handleSaveProfile = useCallback(async () => {
    if (!canEdit) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      const payload = {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        department: profileData.department,
        position: profileData.position,
        // bio and hireDate are missing in UserProfile interface but present in backend
      };

      const response = await api.put('/auth/profile', payload);
      
      if (!response.ok) {
        throw new Error('Erro ao salvar perfil');
      }
      
      const data = await response.json();
      
      // Update local user store
      if (user) {
        setUser({
          ...user,
          name: data.name || user.name,
          email: data.email || user.email,
        });
      }

      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      initialProfileRef.current = profileData;
      setIsDirty(false);
    } catch (error: unknown) {
      console.error('Erro ao salvar perfil:', error);
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil' });
    } finally {
      setIsLoading(false);
    }
  }, [canEdit, setMessage, profileData, user, setUser]);

  // Registrar tab no contexto pai
  useEffect(() => {
    tabsCtx?.registerTab('perfil', {
      isDirty,
      save: async () => { await handleSaveProfile(); },
      reset: () => {
        if (initialProfileRef.current) {
          setProfileData(initialProfileRef.current);
        }
        setIsDirty(false);
      },
      requiredPermission: 'profile.edit'
    });
    return () => tabsCtx?.unregisterTab('perfil');
  }, [isDirty, tabsCtx, handleSaveProfile]);

  const handleChangePassword = async () => {
    if (!canEdit) return;
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' });
      return;
    }

    setIsPasswordLoading(true);
    setMessage(null);
    
    try {
      // TODO: Implementar chamada real para API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
      
      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao alterar senha' });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Informações Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>
            Atualize suas informações de perfil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profileData.avatar || ""} />
                <AvatarFallback className="text-2xl bg-gray-200 flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-500" />
                </AvatarFallback>
              </Avatar>
              
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              
              <Button 
                size="sm" 
                variant="outline" 
                className="absolute -bottom-1 -right-1 h-8 w-8 p-0"
                onClick={handleAvatarClick}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{profileData.name}</h3>
              <p className="text-sm text-muted-foreground">{profileData.email}</p>
              <Badge variant="secondary" className="mt-1">{profileData.position}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => { setProfileData(prev => ({ ...prev, name: e.target.value })); setIsDirty(true); }}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profileData.email}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={profileData.phone || ''}
                onChange={(e) => { setProfileData(prev => ({ ...prev, phone: e.target.value })); setIsDirty(true); }}
                disabled={!canEdit}
                placeholder="+55 11 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <Input
                id="department"
                value={profileData.department || ''}
                onChange={(e) => { setProfileData(prev => ({ ...prev, department: e.target.value })); setIsDirty(true); }}
                disabled={!canEdit}
                placeholder="Recursos Humanos"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Cargo</Label>
              <Input
                id="position"
                value={profileData.position || ''}
                onChange={(e) => { setProfileData(prev => ({ ...prev, position: e.target.value })); setIsDirty(true); }}
                disabled={!canEdit}
                placeholder="Analista"
              />
            </div>
          </div>

          {/* Ações inline removidas para usar botão flutuante */}
        </CardContent>
      </Card>

      {/* Banner de alterações não salvas */}
      {isDirty && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900">
          Há alterações não salvas neste formulário.
        </div>
      )}

      {/* Contatos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Contatos
          </CardTitle>
          <CardDescription>
            Gerencie seus e-mails e telefones principais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Emails */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-sm font-medium">E-mails</h4>
                <p className="text-sm text-muted-foreground">Seu e-mail principal é usado para login e notificações</p>
              </div>
              <Button size="sm" variant="outline" disabled={!canEdit} title={!canEdit ? 'Requer permissão: profile.edit' : undefined}>
                Adicionar e-mail
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-md border">
                <div>
                  <div className="text-sm font-medium">{profileData.email || 'usuario@exemplo.com'}</div>
                  <div className="text-xs text-muted-foreground mt-1">Principal • Verificado</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" disabled title="E-mail principal não pode ser removido">Remover</Button>
                </div>
              </div>
              {/* Itens adicionais podem ser renderizados aqui (placeholders) */}
            </div>
          </div>

          {/* Telefones */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-sm font-medium">Telefones</h4>
                <p className="text-sm text-muted-foreground">Use um número verificado para recuperar sua conta</p>
              </div>
              <Button size="sm" variant="outline" disabled={!canEdit} title={!canEdit ? 'Requer permissão: profile.edit' : undefined}>
                Adicionar telefone
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-md border">
                <div>
                  <div className="text-sm font-medium">{profileData.phone || '+55 11 99999-9999'}</div>
                  <div className="text-xs text-muted-foreground mt-1">Principal • Não verificado</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" disabled={!canEdit} title={!canEdit ? 'Requer permissão: profile.edit' : undefined}>Definir como principal</Button>
                  <Button size="sm" variant="ghost" disabled={!canEdit} title={!canEdit ? 'Requer permissão: profile.edit' : undefined}>Remover</Button>
                </div>
              </div>
              {/* Placeholders de outros números */}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endereços */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Endereços
          </CardTitle>
          <CardDescription>
            Cadastre e mantenha seus endereços atualizados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-sm font-medium">Lista de endereços</h4>
              <p className="text-sm text-muted-foreground">Defina um endereço principal para entregas e correspondências</p>
            </div>
            <Button size="sm" variant="outline" disabled={!canEdit} title={!canEdit ? 'Requer permissão: profile.edit' : undefined}>
              Adicionar endereço
            </Button>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-md border">
              <div className="flex items-start justify-between gap-4">
                <div className="text-sm">
                  <div className="font-medium">Rua Exemplo, 123</div>
                  <div className="text-muted-foreground">Bairro Centro • São Paulo/SP • 01000-000</div>
                  <div className="mt-1 text-xs text-primary">Principal</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" disabled={!canEdit} title={!canEdit ? 'Requer permissão: profile.edit' : undefined}>Definir como principal</Button>
                  <Button size="sm" variant="ghost" disabled={!canEdit} title={!canEdit ? 'Requer permissão: profile.edit' : undefined}>Editar</Button>
                  <Button size="sm" variant="ghost" disabled={!canEdit} title={!canEdit ? 'Requer permissão: profile.edit' : undefined}>Remover</Button>
                </div>
              </div>
            </div>
            {/* Outros endereços (placeholders) */}
          </div>
        </CardContent>
      </Card>

      {/* Alterar Senha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Mantenha sua conta segura com uma senha forte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha atual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  disabled={!canEdit}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  disabled={!canEdit}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  disabled={!canEdit}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {canEdit && (
            <div className="flex justify-end">
              <Button onClick={handleChangePassword} disabled={isPasswordLoading}>
                {isPasswordLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Alterando...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Alterar Senha
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UserPreferencesContent({ canEdit, setMessage }: { canEdit: boolean; setMessage: (msg: ConfigMessage | null) => void }) {
  const tabsCtx = useContext(ConfigTabsContext);
  const [preferences, setPreferences] = useState<UserPreferences>({
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    theme: 'light',
    dashboardLayout: 'default',
    interfaceDensity: 'comfortable',
    sidebarPosition: 'left',
    sidebarMode: 'expanded',
    animations: true
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const initialPreferencesRef = useRef<UserPreferences | null>(null);

  // Carregar preferências
  useEffect(() => {
    // TODO: Implementar carregamento real das preferências
    const initial = {
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      theme: 'light',
      dashboardLayout: 'default',
      interfaceDensity: 'comfortable',
      sidebarPosition: 'left',
      sidebarMode: 'expanded',
      animations: true
    };
    setPreferences(initial);
    initialPreferencesRef.current = initial;
    const t = setTimeout(() => setIsInitialLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const handleSavePreferences = useCallback(async () => {
    if (!canEdit) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      // TODO: Implementar chamada real para API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
      
      setMessage({ type: 'success', text: 'Preferências salvas com sucesso!' });
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao salvar preferências' });
    } finally {
      setIsLoading(false);
    }
  }, [canEdit, setMessage]);

  // Registrar tab no contexto pai
  useEffect(() => {
    tabsCtx?.registerTab('preferencias', {
      isDirty,
      save: async () => { await handleSavePreferences(); },
      reset: () => {
        if (initialPreferencesRef.current) {
          setPreferences(initialPreferencesRef.current);
        }
        setIsDirty(false);
      },
      requiredPermission: 'preferences.edit'
    });
    return () => tabsCtx?.unregisterTab('preferencias');
  }, [isDirty, tabsCtx, handleSavePreferences]);

  const handleResetPreferences = useCallback(async () => {
    if (!canEdit) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      // TODO: Implementar chamada real para API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
      
      setPreferences({
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        theme: 'light',
        dashboardLayout: 'default',
        interfaceDensity: 'comfortable',
        sidebarPosition: 'left',
        sidebarMode: 'expanded',
        animations: true
      });
      
      setMessage({ type: 'success', text: 'Preferências resetadas para o padrão!' });
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao resetar preferências' });
    } finally {
      setIsLoading(false);
    }
  }, [canEdit, setMessage]);

  return (
    <div className="space-y-6">
      {/* Idioma e Localização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Idioma e Localização
          </CardTitle>
          <CardDescription>
            Configure o idioma e fuso horário da interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Idioma da Interface</Label>
              <Select 
                value={preferences.language} 
                onValueChange={(value) => { setPreferences(prev => ({ ...prev, language: value })); setIsDirty(true); }}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="es-ES">Español</SelectItem>
                  <SelectItem value="fr-FR">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Fuso Horário</Label>
              <Select 
                value={preferences.timezone} 
                onValueChange={(value) => { setPreferences(prev => ({ ...prev, timezone: value })); setIsDirty(true); }}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fuso horário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                  <SelectItem value="America/New_York">Nova York (GMT-5)</SelectItem>
                  <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tóquio (GMT+9)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aparência e Tema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Aparência e Tema
          </CardTitle>
          <CardDescription>
            Personalize a aparência da interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Tema</Label>
              <Select 
                value={preferences.theme} 
                onValueChange={(value) => { setPreferences(prev => ({ ...prev, theme: value })); setIsDirty(true); }}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Escuro</SelectItem>
                  <SelectItem value="auto">Automático</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="interfaceDensity">Densidade da Interface</Label>
              <Select 
                value={preferences.interfaceDensity} 
                onValueChange={(value) => { setPreferences(prev => ({ ...prev, interfaceDensity: value })); setIsDirty(true); }}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a densidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compacta</SelectItem>
                  <SelectItem value="comfortable">Confortável</SelectItem>
                  <SelectItem value="spacious">Espaçosa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="animations">Animações</Label>
                <p className="text-sm text-muted-foreground">
                  Habilitar transições e animações na interface
                </p>
              </div>
              <Switch
                id="animations"
                checked={preferences.animations}
                onCheckedChange={(checked) => { setPreferences(prev => ({ ...prev, animations: checked })); setIsDirty(true); }}
                disabled={!canEdit}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layout do Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Layout do Dashboard
          </CardTitle>
          <CardDescription>
            Configure como o dashboard é exibido
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dashboardLayout">Layout Padrão</Label>
              <Select 
                value={preferences.dashboardLayout} 
                onValueChange={(value) => setPreferences(prev => ({ ...prev, dashboardLayout: value }))}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Padrão</SelectItem>
                  <SelectItem value="compact">Compacto</SelectItem>
                  <SelectItem value="detailed">Detalhado</SelectItem>
                  <SelectItem value="minimal">Minimalista</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sidebarPosition">Posição da Sidebar</Label>
              <Select 
                value={preferences.sidebarPosition} 
                onValueChange={(value) => setPreferences(prev => ({ ...prev, sidebarPosition: value }))}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a posição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Esquerda</SelectItem>
                  <SelectItem value="right">Direita</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sidebarMode">Modo da Sidebar</Label>
            <Select 
              value={preferences.sidebarMode} 
              onValueChange={(value) => setPreferences(prev => ({ ...prev, sidebarMode: value }))}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o modo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expanded">Expandida</SelectItem>
                <SelectItem value="collapsed">Recolhida</SelectItem>
                <SelectItem value="auto">Automática</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Navegação e Sidebar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" />
            Navegação e Sidebar
          </CardTitle>
          <CardDescription>
            Personalize a posição e o comportamento da sidebar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sidebarPosition">Posição da Sidebar</Label>
              <Select 
                value={preferences.sidebarPosition}
                onValueChange={(value) => { setPreferences(prev => ({ ...prev, sidebarPosition: value as typeof prev.sidebarPosition })); setIsDirty(true); }}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a posição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Esquerda</SelectItem>
                  <SelectItem value="right">Direita</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sidebarMode">Modo da Sidebar</Label>
              <Select 
                value={preferences.sidebarMode}
                onValueChange={(value) => { setPreferences(prev => ({ ...prev, sidebarMode: value as typeof prev.sidebarMode })); setIsDirty(true); }}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expanded">Expandida</SelectItem>
                  <SelectItem value="collapsed">Recolhida</SelectItem>
                  <SelectItem value="auto">Automática</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      {isDirty && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900">
          Há alterações não salvas nas preferências.
        </div>
      )}

      {/* Botão flutuante removido em favor do global */}

      {/* Ações duplicadas removidas: manter apenas o rodapé acima */}
    </div>
  );
}

function UserNotificationsContent({ canEdit, setMessage }: { canEdit: boolean; setMessage: (msg: ConfigMessage | null) => void }) {
  const tabsCtx = useContext(ConfigTabsContext);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    push: true,
    inApp: true,
    sms: false,
    questionnaireReminders: true,
    weeklyReports: false,
    securityAlerts: true,
    achievements: true,
    teamMessages: true,
    actionPlanReminders: true,
    frequency: 'immediate',
    preferredTime: '09:00',
    soundEnabled: true,
    vibrationEnabled: true,
    previewEnabled: true,
    groupingEnabled: true
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Carregar configurações de notificação
  useEffect(() => {
    // TODO: Implementar carregamento real das configurações
    setNotifications({
      email: true,
      push: true,
      inApp: true,
      sms: false,
      questionnaireReminders: true,
      weeklyReports: false,
      securityAlerts: true,
      achievements: true,
      teamMessages: true,
      actionPlanReminders: true,
      frequency: 'immediate',
      preferredTime: '09:00',
      soundEnabled: true,
      vibrationEnabled: true,
      previewEnabled: true,
      groupingEnabled: true
    });
  }, []);

  const handleSaveNotifications = useCallback(async () => {
    if (!canEdit) return;

    setIsLoading(true);
    setMessage(null);
    
    try {
      // TODO: Implementar chamada real para API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
      
      setMessage({ type: 'success', text: 'Configurações de notificação salvas com sucesso!' });
      setIsDirty(false);
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações de notificação' });
    } finally {
      setIsLoading(false);
    }
  }, [canEdit, setMessage]);

  // Registrar no orquestrador
  useEffect(() => {
    tabsCtx?.registerTab('notificacoes', {
      isDirty,
      save: async () => { await handleSaveNotifications(); },
      reset: () => {
        // Reset visual simples
        setIsDirty(false);
      },
      requiredPermission: 'notifications.manage'
    });
    return () => tabsCtx?.unregisterTab('notificacoes');
  }, [isDirty, tabsCtx, handleSaveNotifications]);

  const handleTestNotification = async () => {
    if (!canEdit) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      // TODO: Implementar chamada real para API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
      
      setMessage({ type: 'success', text: 'Notificação de teste enviada!' });
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao enviar notificação de teste' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Canais de Notificação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Canais de Notificação
          </CardTitle>
          <CardDescription>
            Configure como você deseja receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email">Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações por email
                  </p>
                </div>
                <Switch
                  id="email"
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email: checked }))}
                  disabled={!canEdit}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificações push no navegador
                  </p>
                </div>
                <Switch
                  id="push"
                  checked={notifications.push}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, push: checked }))}
                  disabled={!canEdit}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="inApp">No Aplicativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificações dentro da plataforma
                  </p>
                </div>
                <Switch
                  id="inApp"
                  checked={notifications.inApp}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, inApp: checked }))}
                  disabled={!canEdit}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sms">SMS</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificações por SMS (apenas urgente)
                  </p>
                </div>
                <Switch
                  id="sms"
                  checked={notifications.sms}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, sms: checked }))}
                  disabled={!canEdit}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequência de Notificações</Label>
                <Select 
                  value={notifications.frequency} 
                  onValueChange={(value) => setNotifications(prev => ({ ...prev, frequency: value }))}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Imediato</SelectItem>
                    <SelectItem value="hourly">A cada hora</SelectItem>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredTime">Horário Preferido</Label>
                <Input
                  id="preferredTime"
                  type="time"
                  value={notifications.preferredTime}
                  onChange={(e) => setNotifications(prev => ({ ...prev, preferredTime: e.target.value }))}
                  disabled={!canEdit}
                />
                <p className="text-sm text-muted-foreground">
                  Para notificações agrupadas
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="soundEnabled">Som</Label>
                    <p className="text-sm text-muted-foreground">
                      Tocar som nas notificações
                    </p>
                  </div>
                  <Switch
                    id="soundEnabled"
                    checked={notifications.soundEnabled}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, soundEnabled: checked }))}
                    disabled={!canEdit}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="vibrationEnabled">Vibração</Label>
                    <p className="text-sm text-muted-foreground">
                      Vibração em dispositivos móveis
                    </p>
                  </div>
                  <Switch
                    id="vibrationEnabled"
                    checked={notifications.vibrationEnabled}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, vibrationEnabled: checked }))}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tipos de Notificação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Tipos de Notificação
          </CardTitle>
          <CardDescription>
            Configure quais tipos de notificação você deseja receber
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="questionnaireReminders">Lembretes de Questionário</Label>
                  <p className="text-sm text-muted-foreground">
                    Lembretes para responder questionários
                  </p>
                </div>
                <Switch
                  id="questionnaireReminders"
                  checked={notifications.questionnaireReminders}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, questionnaireReminders: checked }))}
                  disabled={!canEdit}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weeklyReports">Relatórios Semanais</Label>
                  <p className="text-sm text-muted-foreground">
                    Resumos semanais de atividades
                  </p>
                </div>
                <Switch
                  id="weeklyReports"
                  checked={notifications.weeklyReports}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, weeklyReports: checked }))}
                  disabled={!canEdit}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="securityAlerts">Alertas de Segurança</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificações sobre segurança da conta
                  </p>
                </div>
                <Switch
                  id="securityAlerts"
                  checked={notifications.securityAlerts}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, securityAlerts: checked }))}
                  disabled={!canEdit}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="achievements">Conquistas</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificações sobre conquistas e badges
                  </p>
                </div>
                <Switch
                  id="achievements"
                  checked={notifications.achievements}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, achievements: checked }))}
                  disabled={!canEdit}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="teamMessages">Mensagens da Equipe</Label>
                  <p className="text-sm text-muted-foreground">
                    Mensagens e comunicados da equipe
                  </p>
                </div>
                <Switch
                  id="teamMessages"
                  checked={notifications.teamMessages}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, teamMessages: checked }))}
                  disabled={!canEdit}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="actionPlanReminders">Lembretes de Plano de Ação</Label>
                  <p className="text-sm text-muted-foreground">
                    Lembretes sobre planos de ação pendentes
                  </p>
                </div>
                <Switch
                  id="actionPlanReminders"
                  checked={notifications.actionPlanReminders}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, actionPlanReminders: checked }))}
                  disabled={!canEdit}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="previewEnabled">Preview Habilitado</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar preview do conteúdo nas notificações
                  </p>
                </div>
                <Switch
                  id="previewEnabled"
                  checked={notifications.previewEnabled}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, previewEnabled: checked }))}
                  disabled={!canEdit}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="groupingEnabled">Agrupamento</Label>
                  <p className="text-sm text-muted-foreground">
                    Agrupar notificações similares
                  </p>
                </div>
                <Switch
                  id="groupingEnabled"
                  checked={notifications.groupingEnabled}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, groupingEnabled: checked }))}
                  disabled={!canEdit}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
            <CardDescription>
              Salvar configurações ou testar notificações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={handleSaveNotifications} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
              
              <Button variant="outline" onClick={handleTestNotification} disabled={isLoading}>
                <TestTube className="mr-2 h-4 w-4" />
                Testar Notificação
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function UserPrivacyContent({ canEdit, setMessage }: { canEdit: boolean; setMessage: (msg: ConfigMessage | null) => void }) {
  const tabsCtx = useContext(ConfigTabsContext);
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: 'company',
    activityTracking: true,
    dataSharing: false,
    analytics: true,
    includeInReports: true,
    allowBenchmarking: false,
    shareFeedbackWithManagers: true
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Carregar configurações de privacidade
  useEffect(() => {
    // TODO: Implementar carregamento real das configurações
    setPrivacy({
      profileVisibility: 'company',
      activityTracking: true,
      dataSharing: false,
      analytics: true,
      includeInReports: true,
      allowBenchmarking: false,
      shareFeedbackWithManagers: true
    });
  }, []);

  const handleSavePrivacy = useCallback(async () => {
    if (!canEdit) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      // TODO: Implementar chamada real para API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
      
      setMessage({ type: 'success', text: 'Configurações de privacidade salvas com sucesso!' });
      setIsDirty(false);
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações de privacidade' });
    } finally {
      setIsLoading(false);
    }
  }, [canEdit, setMessage]);

  // Registrar no orquestrador
  useEffect(() => {
    tabsCtx?.registerTab('privacidade', {
      isDirty,
      save: async () => { await handleSavePrivacy(); },
      reset: () => {
        setIsDirty(false);
      },
      requiredPermission: 'privacy.manage'
    });
    return () => tabsCtx?.unregisterTab('privacidade');
  }, [isDirty, tabsCtx, handleSavePrivacy]);

  const handleExportData = async () => {
    if (!canEdit) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      // TODO: Implementar chamada real para API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
      
      setMessage({ type: 'success', text: 'Solicitação de exportação de dados enviada! Você receberá um email em breve.' });
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao solicitar exportação de dados' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!canEdit) return;
    
    // TODO: Implementar confirmação e chamada real para API
    const confirmed = window.confirm(
      'ATENÇÃO: Esta ação é irreversível!\n\n' +
      'Ao excluir sua conta, todos os seus dados serão permanentemente removidos, incluindo:\n' +
      '• Histórico de questionários\n' +
      '• Relatórios e análises\n' +
      '• Conquistas e badges\n' +
      '• Configurações pessoais\n\n' +
      'Tem certeza que deseja continuar?'
    );
    
    if (confirmed) {
      setIsLoading(true);
      setMessage(null);
      
      try {
        // TODO: Implementar chamada real para API
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simular delay
        
        setMessage({ type: 'warning', text: 'Solicitação de exclusão de conta enviada. Você receberá um email de confirmação em breve.' });
      } catch (error: unknown) {
        setMessage({ type: 'error', text: 'Erro ao solicitar exclusão de conta' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Visibilidade do Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Visibilidade do Perfil
          </CardTitle>
          <CardDescription>
            Configure quem pode ver suas informações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profileVisibility">Visibilidade do Perfil</Label>
            <Select 
              value={privacy.profileVisibility} 
              onValueChange={(value) => setPrivacy(prev => ({ ...prev, profileVisibility: value }))}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a visibilidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Público</SelectItem>
                <SelectItem value="company">Apenas Empresa</SelectItem>
                <SelectItem value="team">Apenas Equipe</SelectItem>
                <SelectItem value="private">Privado</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Controla quem pode ver seu perfil e informações básicas
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Rastreamento e Análise */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Rastreamento e Análise
          </CardTitle>
          <CardDescription>
            Configure como seus dados são coletados e analisados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="activityTracking">Rastreamento de Atividade</Label>
                <p className="text-sm text-muted-foreground">
                  Permitir rastreamento de suas atividades na plataforma
                </p>
              </div>
              <Switch
                id="activityTracking"
                checked={privacy.activityTracking}
                onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, activityTracking: checked }))}
                disabled={!canEdit}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="analytics">Análise de Dados</Label>
                <p className="text-sm text-muted-foreground">
                  Permitir análise de seus dados para melhorar o serviço
                </p>
              </div>
              <Switch
                id="analytics"
                checked={privacy.analytics}
                onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, analytics: checked }))}
                disabled={!canEdit}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="includeInReports">Incluir em Relatórios</Label>
                <p className="text-sm text-muted-foreground">
                  Incluir seus dados nos relatórios da empresa
                </p>
              </div>
              <Switch
                id="includeInReports"
                checked={privacy.includeInReports}
                onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, includeInReports: checked }))}
                disabled={!canEdit}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allowBenchmarking">Benchmarking</Label>
                <p className="text-sm text-muted-foreground">
                  Permitir comparação com outros usuários (dados anonimizados)
                </p>
              </div>
              <Switch
                id="allowBenchmarking"
                checked={privacy.allowBenchmarking}
                onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, allowBenchmarking: checked }))}
                disabled={!canEdit}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compartilhamento de Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Compartilhamento de Dados
          </CardTitle>
          <CardDescription>
            Configure como seus dados são compartilhados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dataSharing">Compartilhamento com Terceiros</Label>
                <p className="text-sm text-muted-foreground">
                  Permitir compartilhamento de dados com parceiros (quando necessário)
                </p>
              </div>
              <Switch
                id="dataSharing"
                checked={privacy.dataSharing}
                onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, dataSharing: checked }))}
                disabled={!canEdit}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="shareFeedbackWithManagers">Compartilhar Feedback com Gestores</Label>
                <p className="text-sm text-muted-foreground">
                  Permitir que gestores vejam seu feedback e resultados
                </p>
              </div>
              <Switch
                id="shareFeedbackWithManagers"
                checked={privacy.shareFeedbackWithManagers}
                onCheckedChange={(checked) => setPrivacy(prev => ({ ...prev, shareFeedbackWithManagers: checked }))}
                disabled={!canEdit}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controle de Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Controle de Dados
          </CardTitle>
          <CardDescription>
            Gerencie seus dados pessoais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">📋 Seus Direitos</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              De acordo com a LGPD, você tem o direito de:
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 ml-4">
              <li>• Acessar seus dados pessoais</li>
              <li>• Corrigir dados incompletos ou incorretos</li>
              <li>• Solicitar a exclusão de dados</li>
              <li>• Exportar seus dados em formato legível</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium">Exportar Dados</h4>
                <p className="text-sm text-muted-foreground">
                  Baixe uma cópia de todos os seus dados pessoais
                </p>
              </div>
              <Button variant="outline" onClick={handleExportData} disabled={isLoading || !canEdit}>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg border-red-200 dark:border-red-800">
              <div className="space-y-1">
                <h4 className="font-medium text-red-700 dark:text-red-400">Excluir Conta</h4>
                <p className="text-sm text-muted-foreground">
                  Excluir permanentemente sua conta e todos os dados
                </p>
              </div>
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={isLoading || !canEdit}>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
            <CardDescription>
              Salvar suas configurações de privacidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSavePrivacy} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Configurações de Privacidade
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ==================== COMPONENTES DE CONTEÚDO - ADMIN ====================

function AdminCompanyContent({ canEdit, setMessage }: { canEdit: boolean; setMessage: (msg: ConfigMessage | null) => void }) {
  const tabsCtx = useContext(ConfigTabsContext);
  const [companyData, setCompanyData] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    website: '',
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    },
    settings: {
      timezone: 'America/Sao_Paulo',
      language: 'pt-BR',
      currency: 'BRL',
      dateFormat: 'DD/MM/YYYY',
      workingHours: {
        start: '09:00',
        end: '18:00'
      },
      businessDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Carregar dados da empresa
  useEffect(() => {
    // TODO: Implementar carregamento real dos dados
    setCompanyData({
      name: 'WorkChoque Ltda',
      cnpj: '12.345.678/0001-90',
      email: 'contato@workchoque.com',
      phone: '+55 11 3456-7890',
      website: 'https://workchoque.com',
      address: {
        street: 'Rua das Empresas',
        number: '123',
        complement: 'Sala 456',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567'
      },
      settings: {
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR',
        currency: 'BRL',
        dateFormat: 'DD/MM/YYYY',
        workingHours: {
          start: '09:00',
          end: '18:00'
        },
        businessDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      }
    });
  }, []);

  const handleSaveCompany = useCallback(async () => {
    if (!canEdit) return;

    if (!companyData.name || !companyData.cnpj || !companyData.email) {
      setMessage({ type: 'error', text: 'Preencha todos os campos obrigatórios.' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyData.email)) {
      setMessage({ type: 'error', text: 'Email inválido.' });
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      // TODO: Implementar chamada real para API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
      
      setMessage({ type: 'success', text: 'Configurações da empresa salvas com sucesso!' });
      setIsDirty(false);
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações da empresa' });
    } finally {
      setIsLoading(false);
    }
  }, [canEdit, setMessage, companyData]);

  useEffect(() => {
    tabsCtx?.registerTab('empresa', {
      isDirty,
      save: async () => { await handleSaveCompany(); },
      reset: () => { setIsDirty(false); },
      requiredPermission: 'company.manage'
    });
    return () => tabsCtx?.unregisterTab('empresa');
  }, [isDirty, tabsCtx, handleSaveCompany]);

  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Informações Básicas
          </CardTitle>
          <CardDescription>
            Dados principais da empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da Empresa</Label>
              <Input
                id="companyName"
                value={companyData.name}
                onChange={(e) => { setCompanyData(prev => ({ ...prev, name: e.target.value })); setIsDirty(true); }}
                disabled={!canEdit}
                placeholder="Nome da empresa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={companyData.cnpj}
                onChange={(e) => { setCompanyData(prev => ({ ...prev, cnpj: e.target.value })); setIsDirty(true); }}
                disabled={!canEdit}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyEmail">Email</Label>
              <Input
                id="companyEmail"
                type="email"
                value={companyData.email}
                onChange={(e) => { setCompanyData(prev => ({ ...prev, email: e.target.value })); setIsDirty(true); }}
                disabled={!canEdit}
                placeholder="contato@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyPhone">Telefone</Label>
              <Input
                id="companyPhone"
                value={companyData.phone}
                onChange={(e) => { setCompanyData(prev => ({ ...prev, phone: e.target.value })); setIsDirty(true); }}
                disabled={!canEdit}
                placeholder="+55 11 3456-7890"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={companyData.website}
                onChange={(e) => { setCompanyData(prev => ({ ...prev, website: e.target.value })); setIsDirty(true); }}
                disabled={!canEdit}
                placeholder="https://empresa.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Endereço
          </CardTitle>
          <CardDescription>
            Localização da empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="street">Rua</Label>
              <Input
                id="street"
                value={companyData.address.street}
                onChange={(e) => { setCompanyData(prev => ({ ...prev, address: { ...prev.address, street: e.target.value } })); setIsDirty(true); }}
                disabled={!canEdit}
                placeholder="Rua das Empresas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                value={companyData.address.number}
                onChange={(e) => { setCompanyData(prev => ({ ...prev, address: { ...prev.address, number: e.target.value } })); setIsDirty(true); }}
                disabled={!canEdit}
                placeholder="123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                value={companyData.address.complement}
                onChange={(e) => { setCompanyData(prev => ({ ...prev, address: { ...prev.address, complement: e.target.value } })); setIsDirty(true); }}
                disabled={!canEdit}
                placeholder="Sala 456"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                value={companyData.address.neighborhood}
                onChange={(e) => { setCompanyData(prev => ({ ...prev, address: { ...prev.address, neighborhood: e.target.value } })); setIsDirty(true); }}
                disabled={!canEdit}
                placeholder="Centro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={companyData.address.city}
                onChange={(e) => { setCompanyData(prev => ({ ...prev, address: { ...prev.address, city: e.target.value } })); setIsDirty(true); }}
                disabled={!canEdit}
                placeholder="São Paulo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={companyData.address.state}
                onChange={(e) => { setCompanyData(prev => ({ ...prev, address: { ...prev.address, state: e.target.value } })); setIsDirty(true); }}
                disabled={!canEdit}
                placeholder="SP"
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">CEP</Label>
              <Input
                id="zipCode"
                value={companyData.address.zipCode}
                onChange={(e) => { setCompanyData(prev => ({ ...prev, address: { ...prev.address, zipCode: e.target.value } })); setIsDirty(true); }}
                disabled={!canEdit}
                placeholder="01234-567"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações Regionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Configurações Regionais
          </CardTitle>
          <CardDescription>
            Configurações de idioma, moeda e fuso horário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <Select 
                value={companyData.settings.language} 
                onValueChange={(value) => { setCompanyData(prev => ({ ...prev, settings: { ...prev.settings, language: value } })); setIsDirty(true); }}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="es-ES">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Moeda</Label>
              <Select 
                value={companyData.settings.currency} 
                onValueChange={(value) => { setCompanyData(prev => ({ ...prev, settings: { ...prev.settings, currency: value } })); setIsDirty(true); }}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a moeda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">Real (R$)</SelectItem>
                  <SelectItem value="USD">Dólar ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Fuso Horário</Label>
              <Select 
                value={companyData.settings.timezone} 
                onValueChange={(value) => { setCompanyData(prev => ({ ...prev, settings: { ...prev.settings, timezone: value } })); setIsDirty(true); }}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fuso horário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                  <SelectItem value="America/New_York">Nova York (GMT-5)</SelectItem>
                  <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Formato de Data</Label>
              <Select 
                value={companyData.settings.dateFormat} 
                onValueChange={(value) => { setCompanyData(prev => ({ ...prev, settings: { ...prev.settings, dateFormat: value } })); setIsDirty(true); }}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/AAAA</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/AAAA</SelectItem>
                  <SelectItem value="YYYY-MM-DD">AAAA-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
            <CardDescription>
              Salvar as configurações da empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSaveCompany} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Configurações da Empresa
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AdminUsersContent({ canEdit, setMessage }: { canEdit: boolean; setMessage: (msg: ConfigMessage | null) => void }) {
  const tabsCtx = useContext(ConfigTabsContext);
  const [isDirty, setIsDirty] = useState(false);
  const [users, setUsers] = useState([
    {
      id: '1',
      name: 'João Silva',
      email: 'joao@empresa.com',
      role: 'user',
      department: 'RH',
      position: 'Analista',
      status: 'active',
      lastLogin: '2025-01-25T10:30:00Z'
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria@empresa.com',
      role: 'admin',
      department: 'TI',
      position: 'Gerente',
      status: 'active',
      lastLogin: '2025-01-25T09:15:00Z'
    },
    {
      id: '3',
      name: 'Pedro Costa',
      email: 'pedro@empresa.com',
      role: 'user',
      department: 'Vendas',
      position: 'Vendedor',
      status: 'inactive',
      lastLogin: '2025-01-20T14:45:00Z'
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    [key: string]: unknown;
  } | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    department: '',
    position: '',
    status: 'active'
  });

  const handleCreateUser = () => {
    setFormData({
      name: '',
      email: '',
      role: 'user',
      department: '',
      position: '',
      status: 'active'
    });
    setSelectedUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user: {
    id: string;
    name: string;
    email: string;
    role: string;
    [key: string]: unknown;
  }) => {
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role as string,
      department: user.department as string,
      position: user.position as string,
      status: user.status as string
    });
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Nome e Email são obrigatórios');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Email inválido');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (selectedUser) {
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...formData } : u));
        toast.success('Usuário atualizado com sucesso!');
      } else {
        setUsers(prev => [...prev, { 
          id: Date.now().toString(), 
          ...formData, 
          lastLogin: new Date().toISOString() 
        }]);
        toast.success('Usuário criado com sucesso!');
      }
      setShowUserModal(false);
    } catch (error) {
      toast.error('Erro ao salvar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!canEdit) return;
    
    const confirmed = window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.');
    if (!confirmed) return;

    setIsLoading(true);
    setMessage(null);
    
    try {
      // TODO: Implementar chamada real para API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
      
      setUsers(prev => prev.filter(user => user.id !== userId));
      setMessage({ type: 'success', text: 'Usuário excluído com sucesso!' });
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao excluir usuário' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    if (!canEdit) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      // TODO: Implementar chamada real para API
      await new Promise(resolve => setTimeout(resolve, 500)); // Simular delay
      
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
          : user
      ));
      
      const user = users.find(u => u.id === userId);
      setMessage({ 
        type: 'success', 
        text: `Usuário ${user?.status === 'active' ? 'desativado' : 'ativado'} com sucesso!` 
      });
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao alterar status do usuário' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveUserSettings = useCallback(async () => {
    if (!canEdit) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      // TODO: Implementar chamada real para API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
      
      setMessage({ type: 'success', text: 'Configurações de usuário salvas com sucesso!' });
      setIsDirty(false);
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações de usuário' });
    } finally {
      setIsLoading(false);
    }
  }, [canEdit, setMessage]);

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'master': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'admin': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'user': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora mesmo';
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d atrás`;
  };

  // Registrar no orquestrador
  useEffect(() => {
    tabsCtx?.registerTab('usuarios', {
      isDirty,
      save: async () => { await handleSaveUserSettings(); },
      reset: () => setIsDirty(false),
      requiredPermission: 'users.manage'
    });
    return () => tabsCtx?.unregisterTab('usuarios');
  }, [isDirty, tabsCtx, handleSaveUserSettings]);

  return (
    <div className="space-y-6" onChange={() => setIsDirty(true)}>
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Usuários</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuários Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.status === 'active').length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Administradores</p>
                <p className="text-2xl font-bold text-blue-600">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuários Inativos</p>
                <p className="text-2xl font-bold text-red-600">
                  {users.filter(u => u.status === 'inactive').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Usuários da Empresa
              </CardTitle>
              <CardDescription>
                Gerencie os usuários da sua empresa
              </CardDescription>
            </div>
            {canEdit && (
              <Button onClick={handleCreateUser}>
                <Users className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="font-medium">{user.name}</h4>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role === 'master' ? 'Master' : 
                         user.role === 'admin' ? 'Admin' : 'Usuário'}
                      </Badge>
                      <Badge className={getStatusBadgeColor(user.status)}>
                        {user.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {user.department} • {user.position}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Último login: {formatLastLogin(user.lastLogin)}
                  </p>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleUserStatus(user.id)}
                      disabled={isLoading}
                    >
                      {user.status === 'active' ? (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações de Usuário
          </CardTitle>
          <CardDescription>
            Configurações globais para novos usuários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoActivate">Ativação Automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Novos usuários são ativados automaticamente
                  </p>
                </div>
                <Switch id="autoActivate" defaultChecked disabled={!canEdit} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="requireEmailVerification">Verificação de Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Exigir verificação de email para novos usuários
                  </p>
                </div>
                <Switch id="requireEmailVerification" defaultChecked disabled={!canEdit} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allowSelfRegistration">Auto-cadastro</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir que usuários se cadastrem sozinhos
                  </p>
                </div>
                <Switch id="allowSelfRegistration" disabled={!canEdit} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sendWelcomeEmail">Email de Boas-vindas</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar email de boas-vindas para novos usuários
                  </p>
                </div>
                <Switch id="sendWelcomeEmail" defaultChecked disabled={!canEdit} />
              </div>
            </div>
          </div>

          {canEdit && (
            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveUserSettings} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Usuário */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
            <DialogDescription>
              {selectedUser ? 'Edite as informações do usuário.' : 'Preencha os dados para criar um novo usuário.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userName">Nome</Label>
              <Input 
                id="userName" 
                placeholder="Nome completo" 
                value={formData.name} 
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userEmail">Email</Label>
              <Input 
                id="userEmail" 
                type="email" 
                placeholder="email@empresa.com" 
                value={formData.email} 
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="userRole">Função</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="master">Master</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="userStatus">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="userDepartment">Departamento</Label>
              <Input 
                id="userDepartment" 
                placeholder="Ex: TI" 
                value={formData.department} 
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userPosition">Cargo</Label>
              <Input 
                id="userPosition" 
                placeholder="Ex: Desenvolvedor" 
                value={formData.position} 
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserModal(false)}>Cancelar</Button>
            <Button onClick={handleSaveUser} disabled={isLoading}>
              {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminNotificationsContent({ canEdit, setMessage }: { canEdit: boolean; setMessage: (msg: ConfigMessage | null) => void }) {
  const tabsCtx = useContext(ConfigTabsContext);
  const [isDirty, setIsDirty] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      enabled: true,
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: 'noreply@empresa.com',
      fromName: 'WorkChoque'
    },
    push: {
      enabled: true,
      vapidPublicKey: '',
      vapidPrivateKey: ''
    },
    sms: {
      enabled: false,
      provider: 'twilio',
      accountSid: '',
      authToken: '',
      fromNumber: ''
    },
    templates: {
      welcome: true,
      questionnaireReminder: true,
      weeklyReport: true,
      securityAlert: true,
      userInvitation: true
    },
    schedules: {
      questionnaireReminders: 'daily',
      weeklyReports: 'monday',
      maintenanceAlerts: 'immediate'
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSaveNotifications = useCallback(async () => {
    if (!canEdit) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      // TODO: Implementar chamada real para API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
      
      setMessage({ type: 'success', text: 'Configurações de notificação salvas com sucesso!' });
      setIsDirty(false);
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações de notificação' });
    } finally {
      setIsLoading(false);
    }
  }, [canEdit, setMessage]);

  // Registrar no orquestrador (admin)
  useEffect(() => {
    tabsCtx?.registerTab('admin_notificacoes', {
      isDirty,
      save: async () => { await handleSaveNotifications(); },
      reset: () => setIsDirty(false),
      requiredPermission: 'notifications.templates'
    });
    return () => tabsCtx?.unregisterTab('admin_notificacoes');
  }, [isDirty, tabsCtx, handleSaveNotifications]);

  const handleTestEmail = async () => {
    if (!canEdit) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      // TODO: Implementar chamada real para API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
      
      setMessage({ type: 'success', text: 'Email de teste enviado com sucesso!' });
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao enviar email de teste' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6" onChange={() => setIsDirty(true)}>
      {/* Configurações de Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Configurações de Email
          </CardTitle>
          <CardDescription>
            Configure o envio de emails da empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailEnabled">Habilitar Email</Label>
              <p className="text-sm text-muted-foreground">
                Ativar envio de emails para usuários
              </p>
            </div>
            <Switch
              id="emailEnabled"
              checked={notificationSettings.email.enabled}
              onCheckedChange={(checked) => setNotificationSettings(prev => ({
                ...prev,
                email: { ...prev.email, enabled: checked }
              }))}
              disabled={!canEdit}
            />
          </div>

          {notificationSettings.email.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="smtpHost">Servidor SMTP</Label>
                <Input
                  id="smtpHost"
                  value={notificationSettings.email.smtpHost}
                  onChange={(e) => setNotificationSettings(prev => ({
                    ...prev,
                    email: { ...prev.email, smtpHost: e.target.value }
                  }))}
                  disabled={!canEdit}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPort">Porta SMTP</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  value={notificationSettings.email.smtpPort}
                  onChange={(e) => setNotificationSettings(prev => ({
                    ...prev,
                    email: { ...prev.email, smtpPort: parseInt(e.target.value) }
                  }))}
                  disabled={!canEdit}
                  placeholder="587"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpUser">Usuário SMTP</Label>
                <Input
                  id="smtpUser"
                  value={notificationSettings.email.smtpUser}
                  onChange={(e) => setNotificationSettings(prev => ({
                    ...prev,
                    email: { ...prev.email, smtpUser: e.target.value }
                  }))}
                  disabled={!canEdit}
                  placeholder="seu-email@gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromEmail">Email Remetente</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  value={notificationSettings.email.fromEmail}
                  onChange={(e) => setNotificationSettings(prev => ({
                    ...prev,
                    email: { ...prev.email, fromEmail: e.target.value }
                  }))}
                  disabled={!canEdit}
                  placeholder="noreply@empresa.com"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="fromName">Nome do Remetente</Label>
                <Input
                  id="fromName"
                  value={notificationSettings.email.fromName}
                  onChange={(e) => setNotificationSettings(prev => ({
                    ...prev,
                    email: { ...prev.email, fromName: e.target.value }
                  }))}
                  disabled={!canEdit}
                  placeholder="WorkChoque"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações de Push */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificações Push
          </CardTitle>
          <CardDescription>
            Configure notificações push no navegador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pushEnabled">Habilitar Push</Label>
              <p className="text-sm text-muted-foreground">
                Ativar notificações push no navegador
              </p>
            </div>
            <Switch
              id="pushEnabled"
              checked={notificationSettings.push.enabled}
              onCheckedChange={(checked) => setNotificationSettings(prev => ({
                ...prev,
                push: { ...prev.push, enabled: checked }
              }))}
              disabled={!canEdit}
            />
          </div>

          {notificationSettings.push.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="vapidPublicKey">Chave Pública VAPID</Label>
                <Input
                  id="vapidPublicKey"
                  value={notificationSettings.push.vapidPublicKey}
                  onChange={(e) => setNotificationSettings(prev => ({
                    ...prev,
                    push: { ...prev.push, vapidPublicKey: e.target.value }
                  }))}
                  disabled={!canEdit}
                  placeholder="Chave pública VAPID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vapidPrivateKey">Chave Privada VAPID</Label>
                <Input
                  id="vapidPrivateKey"
                  type="password"
                  value={notificationSettings.push.vapidPrivateKey}
                  onChange={(e) => setNotificationSettings(prev => ({
                    ...prev,
                    push: { ...prev.push, vapidPrivateKey: e.target.value }
                  }))}
                  disabled={!canEdit}
                  placeholder="Chave privada VAPID"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Templates de Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Templates de Email
          </CardTitle>
          <CardDescription>
            Configure quais tipos de email são enviados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="welcomeTemplate">Email de Boas-vindas</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar quando usuário é criado
                  </p>
                </div>
                <Switch
                  id="welcomeTemplate"
                  checked={notificationSettings.templates.welcome}
                  onCheckedChange={(checked) => setNotificationSettings(prev => ({
                    ...prev,
                    templates: { ...prev.templates, welcome: checked }
                  }))}
                  disabled={!canEdit}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="questionnaireTemplate">Lembrete de Questionário</Label>
                  <p className="text-sm text-muted-foreground">
                    Lembretes para responder questionários
                  </p>
                </div>
                <Switch
                  id="questionnaireTemplate"
                  checked={notificationSettings.templates.questionnaireReminder}
                  onCheckedChange={(checked) => setNotificationSettings(prev => ({
                    ...prev,
                    templates: { ...prev.templates, questionnaireReminder: checked }
                  }))}
                  disabled={!canEdit}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weeklyReportTemplate">Relatório Semanal</Label>
                  <p className="text-sm text-muted-foreground">
                    Resumos semanais de atividades
                  </p>
                </div>
                <Switch
                  id="weeklyReportTemplate"
                  checked={notificationSettings.templates.weeklyReport}
                  onCheckedChange={(checked) => setNotificationSettings(prev => ({
                    ...prev,
                    templates: { ...prev.templates, weeklyReport: checked }
                  }))}
                  disabled={!canEdit}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="securityTemplate">Alerta de Segurança</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificações sobre segurança
                  </p>
                </div>
                <Switch
                  id="securityTemplate"
                  checked={notificationSettings.templates.securityAlert}
                  onCheckedChange={(checked) => setNotificationSettings(prev => ({
                    ...prev,
                    templates: { ...prev.templates, securityAlert: checked }
                  }))}
                  disabled={!canEdit}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="invitationTemplate">Convite de Usuário</Label>
                  <p className="text-sm text-muted-foreground">
                    Convites para novos usuários
                  </p>
                </div>
                <Switch
                  id="invitationTemplate"
                  checked={notificationSettings.templates.userInvitation}
                  onCheckedChange={(checked) => setNotificationSettings(prev => ({
                    ...prev,
                    templates: { ...prev.templates, userInvitation: checked }
                  }))}
                  disabled={!canEdit}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
            <CardDescription>
              Salvar configurações ou testar notificações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={handleSaveNotifications} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
              
              <Button variant="outline" onClick={handleTestEmail} disabled={isLoading}>
                <TestTube className="mr-2 h-4 w-4" />
                Testar Email
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AdminAnalyticsContent({ canEdit, setMessage }: { canEdit: boolean; setMessage: (msg: ConfigMessage | null) => void }) {
  const tabsCtx = useContext(ConfigTabsContext);
  const [isDirty, setIsDirty] = useState(false);
  const [analyticsSettings, setAnalyticsSettings] = useState({
    tracking: {
      enabled: true,
      anonymizeIP: true,
      trackUserBehavior: true,
      trackPerformance: true,
      trackErrors: true
    },
    reports: {
      dailyReports: true,
      weeklyReports: true,
      monthlyReports: true,
      customReports: true,
      emailReports: true
    },
    dataRetention: {
      userData: 365,
      analyticsData: 730,
      errorLogs: 90,
      performanceData: 180
    },
    integrations: {
      googleAnalytics: false,
      mixpanel: false,
      hotjar: false,
      sentry: true
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSaveAnalytics = useCallback(async () => {
    if (!canEdit) return;

    if (analyticsSettings.dataRetention.userData < 0 ||
        analyticsSettings.dataRetention.analyticsData < 0 ||
        analyticsSettings.dataRetention.errorLogs < 0 ||
        analyticsSettings.dataRetention.performanceData < 0) {
      setMessage({ type: 'error', text: 'Períodos de retenção não podem ser negativos.' });
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      // TODO: Implementar chamada real para API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
      
      setMessage({ type: 'success', text: 'Configurações de analytics salvas com sucesso!' });
      setIsDirty(false);
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações de analytics' });
    } finally {
      setIsLoading(false);
    }
  }, [canEdit, setMessage, analyticsSettings]);

  useEffect(() => {
    tabsCtx?.registerTab('analytics', {
      isDirty,
      save: async () => { await handleSaveAnalytics(); },
      reset: () => setIsDirty(false),
      requiredPermission: 'reports.manage'
    });
    return () => tabsCtx?.unregisterTab('analytics');
  }, [isDirty, tabsCtx, handleSaveAnalytics]);

  const handleExportData = async () => {
    if (!canEdit) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      // TODO: Implementar chamada real para API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular delay
      
      setMessage({ type: 'success', text: 'Relatório de analytics exportado com sucesso!' });
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao exportar dados de analytics' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6" onChange={() => setIsDirty(true)}>
      {/* Configurações de Rastreamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Configurações de Rastreamento
          </CardTitle>
          <CardDescription>
            Configure o que é rastreado e analisado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="trackingEnabled">Habilitar Rastreamento</Label>
              <p className="text-sm text-muted-foreground">
                Ativar coleta de dados de analytics
              </p>
            </div>
            <Switch
              id="trackingEnabled"
              checked={analyticsSettings.tracking.enabled}
              onCheckedChange={(checked) => setAnalyticsSettings(prev => ({
                ...prev,
                tracking: { ...prev.tracking, enabled: checked }
              }))}
              disabled={!canEdit}
            />
          </div>

          {analyticsSettings.tracking.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="anonymizeIP">Anonimizar IPs</Label>
                    <p className="text-sm text-muted-foreground">
                      Remover informações de IP dos dados
                    </p>
                  </div>
                  <Switch
                    id="anonymizeIP"
                    checked={analyticsSettings.tracking.anonymizeIP}
                    onCheckedChange={(checked) => setAnalyticsSettings(prev => ({
                      ...prev,
                      tracking: { ...prev.tracking, anonymizeIP: checked }
                    }))}
                    disabled={!canEdit}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="trackUserBehavior">Comportamento do Usuário</Label>
                    <p className="text-sm text-muted-foreground">
                      Rastrear cliques e navegação
                    </p>
                  </div>
                  <Switch
                    id="trackUserBehavior"
                    checked={analyticsSettings.tracking.trackUserBehavior}
                    onCheckedChange={(checked) => setAnalyticsSettings(prev => ({
                      ...prev,
                      tracking: { ...prev.tracking, trackUserBehavior: checked }
                    }))}
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="trackPerformance">Performance</Label>
                    <p className="text-sm text-muted-foreground">
                      Monitorar velocidade e performance
                    </p>
                  </div>
                  <Switch
                    id="trackPerformance"
                    checked={analyticsSettings.tracking.trackPerformance}
                    onCheckedChange={(checked) => setAnalyticsSettings(prev => ({
                      ...prev,
                      tracking: { ...prev.tracking, trackPerformance: checked }
                    }))}
                    disabled={!canEdit}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="trackErrors">Logs de Erro</Label>
                    <p className="text-sm text-muted-foreground">
                      Capturar erros e exceções
                    </p>
                  </div>
                  <Switch
                    id="trackErrors"
                    checked={analyticsSettings.tracking.trackErrors}
                    onCheckedChange={(checked) => setAnalyticsSettings(prev => ({
                      ...prev,
                      tracking: { ...prev.tracking, trackErrors: checked }
                    }))}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Retenção de Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Retenção de Dados
          </CardTitle>
          <CardDescription>
            Configure o período de retenção dos dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="userDataRetention">Dados de Usuário (dias)</Label>
              <Input
                id="userDataRetention"
                type="number"
                value={analyticsSettings.dataRetention.userData}
                onChange={(e) => {
                  setAnalyticsSettings(prev => ({
                    ...prev,
                    dataRetention: { ...prev.dataRetention, userData: parseInt(e.target.value) }
                  }));
                  setIsDirty(true);
                }}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="analyticsDataRetention">Dados de Analytics (dias)</Label>
              <Input
                id="analyticsDataRetention"
                type="number"
                value={analyticsSettings.dataRetention.analyticsData}
                onChange={(e) => {
                  setAnalyticsSettings(prev => ({
                    ...prev,
                    dataRetention: { ...prev.dataRetention, analyticsData: parseInt(e.target.value) }
                  }));
                  setIsDirty(true);
                }}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="errorLogsRetention">Logs de Erro (dias)</Label>
              <Input
                id="errorLogsRetention"
                type="number"
                value={analyticsSettings.dataRetention.errorLogs}
                onChange={(e) => {
                  setAnalyticsSettings(prev => ({
                    ...prev,
                    dataRetention: { ...prev.dataRetention, errorLogs: parseInt(e.target.value) }
                  }));
                  setIsDirty(true);
                }}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="performanceDataRetention">Dados de Performance (dias)</Label>
              <Input
                id="performanceDataRetention"
                type="number"
                value={analyticsSettings.dataRetention.performanceData}
                onChange={(e) => {
                  setAnalyticsSettings(prev => ({
                    ...prev,
                    dataRetention: { ...prev.dataRetention, performanceData: parseInt(e.target.value) }
                  }));
                  setIsDirty(true);
                }}
                disabled={!canEdit}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="w-5 h-5" />
            Integrações
          </CardTitle>
          <CardDescription>
            Configure integrações com ferramentas de terceiros
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="googleAnalytics">Google Analytics</Label>
                <p className="text-sm text-muted-foreground">Rastreamento web</p>
              </div>
              <Switch
                id="googleAnalytics"
                checked={analyticsSettings.integrations.googleAnalytics}
                onCheckedChange={(checked) => {
                  setAnalyticsSettings(prev => ({
                    ...prev,
                    integrations: { ...prev.integrations, googleAnalytics: checked }
                  }));
                  setIsDirty(true);
                }}
                disabled={!canEdit}
              />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="mixpanel">Mixpanel</Label>
                <p className="text-sm text-muted-foreground">Analytics de produto</p>
              </div>
              <Switch
                id="mixpanel"
                checked={analyticsSettings.integrations.mixpanel}
                onCheckedChange={(checked) => {
                  setAnalyticsSettings(prev => ({
                    ...prev,
                    integrations: { ...prev.integrations, mixpanel: checked }
                  }));
                  setIsDirty(true);
                }}
                disabled={!canEdit}
              />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="hotjar">Hotjar</Label>
                <p className="text-sm text-muted-foreground">Mapas de calor</p>
              </div>
              <Switch
                id="hotjar"
                checked={analyticsSettings.integrations.hotjar}
                onCheckedChange={(checked) => {
                  setAnalyticsSettings(prev => ({
                    ...prev,
                    integrations: { ...prev.integrations, hotjar: checked }
                  }));
                  setIsDirty(true);
                }}
                disabled={!canEdit}
              />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="sentry">Sentry</Label>
                <p className="text-sm text-muted-foreground">Monitoramento de erros</p>
              </div>
              <Switch
                id="sentry"
                checked={analyticsSettings.integrations.sentry}
                onCheckedChange={(checked) => {
                  setAnalyticsSettings(prev => ({
                    ...prev,
                    integrations: { ...prev.integrations, sentry: checked }
                  }));
                  setIsDirty(true);
                }}
                disabled={!canEdit}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Relatórios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Relatórios Automáticos
          </CardTitle>
          <CardDescription>
            Configure o envio automático de relatórios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dailyReports">Relatórios Diários</Label>
                  <p className="text-sm text-muted-foreground">Resumo diário de atividades</p>
                </div>
                <Switch
                  id="dailyReports"
                  checked={analyticsSettings.reports.dailyReports}
                  onCheckedChange={(checked) => {
                    setAnalyticsSettings(prev => ({
                      ...prev,
                      reports: { ...prev.reports, dailyReports: checked }
                    }));
                    setIsDirty(true);
                  }}
                  disabled={!canEdit}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weeklyReports">Relatórios Semanais</Label>
                  <p className="text-sm text-muted-foreground">Análise semanal consolidada</p>
                </div>
                <Switch
                  id="weeklyReports"
                  checked={analyticsSettings.reports.weeklyReports}
                  onCheckedChange={(checked) => {
                    setAnalyticsSettings(prev => ({
                      ...prev,
                      reports: { ...prev.reports, weeklyReports: checked }
                    }));
                    setIsDirty(true);
                  }}
                  disabled={!canEdit}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="monthlyReports">Relatórios Mensais</Label>
                  <p className="text-sm text-muted-foreground">Visão geral mensal</p>
                </div>
                <Switch
                  id="monthlyReports"
                  checked={analyticsSettings.reports.monthlyReports}
                  onCheckedChange={(checked) => {
                    setAnalyticsSettings(prev => ({
                      ...prev,
                      reports: { ...prev.reports, monthlyReports: checked }
                    }));
                    setIsDirty(true);
                  }}
                  disabled={!canEdit}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailReports">Enviar por Email</Label>
                  <p className="text-sm text-muted-foreground">Receber relatórios no email</p>
                </div>
                <Switch
                  id="emailReports"
                  checked={analyticsSettings.reports.emailReports}
                  onCheckedChange={(checked) => {
                    setAnalyticsSettings(prev => ({
                      ...prev,
                      reports: { ...prev.reports, emailReports: checked }
                    }));
                    setIsDirty(true);
                  }}
                  disabled={!canEdit}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
            <CardDescription>
              Salvar configurações ou exportar dados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={handleSaveAnalytics} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
              
              <Button variant="outline" onClick={handleExportData} disabled={isLoading}>
                <Download className="mr-2 h-4 w-4" />
                Exportar Dados
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ==================== COMPONENTES DE CONTEÚDO - MASTER ====================

function MasterSecurityContent({ canEdit, setMessage }: { canEdit: boolean; setMessage: (msg: ConfigMessage | null) => void }) {
  const tabsCtx = useContext(ConfigTabsContext);
  const [isDirty, setIsDirty] = useState(false);
  const [securitySettings, setSecuritySettings] = useState({
    authentication: {
      sessionTimeout: 30,
      passwordPolicy: 'strong',
      loginAttempts: 5
    },
    encryption: {
      enabled: true,
      algorithm: 'AES-256',
      keyRotation: 90
    },
    monitoring: {
      failedLogins: true,
      suspiciousActivity: true,
      adminActions: true
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSaveSecurity = useCallback(async () => {
    if (!canEdit) return;

    if (securitySettings.authentication.sessionTimeout < 5) {
      setMessage({ type: 'error', text: 'Timeout de sessão deve ser no mínimo 5 minutos.' });
      return;
    }
    if (securitySettings.authentication.loginAttempts < 3 || securitySettings.authentication.loginAttempts > 10) {
      setMessage({ type: 'error', text: 'Tentativas de login devem ser entre 3 e 10.' });
      return;
    }
    if (securitySettings.encryption.enabled && securitySettings.encryption.keyRotation < 30) {
      setMessage({ type: 'error', text: 'Rotação de chaves deve ser no mínimo 30 dias.' });
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Configurações de segurança salvas com sucesso!' });
      setIsDirty(false);
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações de segurança' });
    } finally {
      setIsLoading(false);
    }
  }, [canEdit, setMessage, securitySettings]);

  useEffect(() => {
    tabsCtx?.registerTab('seguranca', {
      isDirty,
      save: async () => { await handleSaveSecurity(); },
      reset: () => setIsDirty(false),
      requiredPermission: 'policy.manage'
    });
    return () => tabsCtx?.unregisterTab('seguranca');
  }, [isDirty, tabsCtx, handleSaveSecurity]);

  return (
    <div className="space-y-6" onChange={() => setIsDirty(true)}>
      {/* Políticas de Autenticação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Políticas de Autenticação
          </CardTitle>
          <CardDescription>
            Configure as regras de acesso e senhas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Timeout de Sessão (minutos)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={securitySettings.authentication.sessionTimeout}
                onChange={(e) => {
                  setSecuritySettings(prev => ({
                    ...prev,
                    authentication: { ...prev.authentication, sessionTimeout: parseInt(e.target.value) }
                  }));
                  setIsDirty(true);
                }}
                disabled={!canEdit}
                min={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordPolicy">Força da Senha</Label>
              <Select 
                value={securitySettings.authentication.passwordPolicy} 
                onValueChange={(value) => {
                  setSecuritySettings(prev => ({
                    ...prev,
                    authentication: { ...prev.authentication, passwordPolicy: value }
                  }));
                  setIsDirty(true);
                }}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a política" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weak">Básica (8+ caracteres)</SelectItem>
                  <SelectItem value="medium">Média (Letras + Números)</SelectItem>
                  <SelectItem value="strong">Forte (Letras + Números + Símbolos)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="loginAttempts">Tentativas de Login</Label>
              <Input
                id="loginAttempts"
                type="number"
                value={securitySettings.authentication.loginAttempts}
                onChange={(e) => {
                  setSecuritySettings(prev => ({
                    ...prev,
                    authentication: { ...prev.authentication, loginAttempts: parseInt(e.target.value) }
                  }));
                  setIsDirty(true);
                }}
                disabled={!canEdit}
                min={3}
                max={10}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Criptografia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Criptografia de Dados
          </CardTitle>
          <CardDescription>
            Configure a proteção dos dados em repouso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="encryptionEnabled">Habilitar Criptografia</Label>
              <p className="text-sm text-muted-foreground">
                Criptografar dados sensíveis no banco de dados
              </p>
            </div>
            <Switch
              id="encryptionEnabled"
              checked={securitySettings.encryption.enabled}
              onCheckedChange={(checked) => {
                setSecuritySettings(prev => ({
                  ...prev,
                  encryption: { ...prev.encryption, enabled: checked }
                }));
                setIsDirty(true);
              }}
              disabled={!canEdit}
            />
          </div>

          {securitySettings.encryption.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="encryptionAlgorithm">Algoritmo</Label>
                <Select 
                  value={securitySettings.encryption.algorithm} 
                  onValueChange={(value) => {
                    setSecuritySettings(prev => ({
                      ...prev,
                      encryption: { ...prev.encryption, algorithm: value }
                    }));
                    setIsDirty(true);
                  }}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o algoritmo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AES-256">AES-256 (Padrão)</SelectItem>
                    <SelectItem value="AES-128">AES-128 (Mais rápido)</SelectItem>
                    <SelectItem value="ChaCha20">ChaCha20 (Mobile)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="keyRotation">Rotação de Chaves (dias)</Label>
                <Input
                  id="keyRotation"
                  type="number"
                  value={securitySettings.encryption.keyRotation}
                  onChange={(e) => {
                    setSecuritySettings(prev => ({
                      ...prev,
                      encryption: { ...prev.encryption, keyRotation: parseInt(e.target.value) }
                    }));
                    setIsDirty(true);
                  }}
                  disabled={!canEdit}
                  min={30}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monitoramento de Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Monitoramento de Segurança
          </CardTitle>
          <CardDescription>
            Alertas e logs de segurança
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="monitorFailedLogins">Log de Falhas de Login</Label>
                <p className="text-sm text-muted-foreground">Registrar tentativas de acesso inválidas</p>
              </div>
              <Switch
                id="monitorFailedLogins"
                checked={securitySettings.monitoring.failedLogins}
                onCheckedChange={(checked) => {
                  setSecuritySettings(prev => ({
                    ...prev,
                    monitoring: { ...prev.monitoring, failedLogins: checked }
                  }));
                  setIsDirty(true);
                }}
                disabled={!canEdit}
              />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="monitorSuspicious">Atividade Suspeita</Label>
                <p className="text-sm text-muted-foreground">Detectar padrões anômalos de uso</p>
              </div>
              <Switch
                id="monitorSuspicious"
                checked={securitySettings.monitoring.suspiciousActivity}
                onCheckedChange={(checked) => {
                  setSecuritySettings(prev => ({
                    ...prev,
                    monitoring: { ...prev.monitoring, suspiciousActivity: checked }
                  }));
                  setIsDirty(true);
                }}
                disabled={!canEdit}
              />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="monitorAdminActions">Ações Administrativas</Label>
                <p className="text-sm text-muted-foreground">Auditoria completa de ações de admin</p>
              </div>
              <Switch
                id="monitorAdminActions"
                checked={securitySettings.monitoring.adminActions}
                onCheckedChange={(checked) => {
                  setSecuritySettings(prev => ({
                    ...prev,
                    monitoring: { ...prev.monitoring, adminActions: checked }
                  }));
                  setIsDirty(true);
                }}
                disabled={!canEdit}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
            <CardDescription>
              Salvar configurações de segurança
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={handleSaveSecurity} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MasterBackupContent({ canEdit, setMessage }: { canEdit: boolean; setMessage: (msg: ConfigMessage | null) => void }) {
  const tabsCtx = useContext(ConfigTabsContext);
  const [isDirty, setIsDirty] = useState(false);
  const [backupSettings, setBackupSettings] = useState({
    automatic: true,
    frequency: 'daily',
    retention: 30,
    location: 'local',
    s3: { bucket: '', region: 'us-east-1', accessKey: '', secretKey: '' },
    gcs: { bucket: '', projectId: '', credentialsFile: '' },
    azure: { container: '', connectionString: '' }
  });

  const [recentBackups] = useState([
    { id: '1', date: '2025-02-27 02:00', size: '1.2 GB', status: 'success', type: 'automatic' },
    { id: '2', date: '2025-02-26 02:00', size: '1.2 GB', status: 'success', type: 'automatic' },
    { id: '3', date: '2025-02-25 15:30', size: '1.1 GB', status: 'success', type: 'manual' },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const handleSaveBackup = useCallback(async () => {
    if (!canEdit) return;

    if (backupSettings.retention < 1) {
      setMessage({ type: 'error', text: 'Retenção deve ser no mínimo 1 dia.' });
      return;
    }

    if (backupSettings.location === 's3') {
      if (!backupSettings.s3.bucket || !backupSettings.s3.region || !backupSettings.s3.accessKey || !backupSettings.s3.secretKey) {
        setMessage({ type: 'error', text: 'Preencha todos os campos do S3.' });
        return;
      }
    } else if (backupSettings.location === 'gcs') {
      if (!backupSettings.gcs.bucket || !backupSettings.gcs.projectId || !backupSettings.gcs.credentialsFile) {
        setMessage({ type: 'error', text: 'Preencha todos os campos do Google Cloud.' });
        return;
      }
    } else if (backupSettings.location === 'azure') {
      if (!backupSettings.azure.container || !backupSettings.azure.connectionString) {
        setMessage({ type: 'error', text: 'Preencha todos os campos do Azure.' });
        return;
      }
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Configurações de backup salvas com sucesso!' });
      setIsDirty(false);
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações de backup' });
    } finally {
      setIsLoading(false);
    }
  }, [canEdit, setMessage, backupSettings]);

  useEffect(() => {
    tabsCtx?.registerTab('backup', {
      isDirty,
      save: async () => { await handleSaveBackup(); },
      reset: () => setIsDirty(false),
      requiredPermission: 'backup.manage'
    });
    return () => tabsCtx?.unregisterTab('backup');
  }, [isDirty, tabsCtx, handleSaveBackup]);

  const handleBackupNow = async () => {
    if (!canEdit) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      setMessage({ type: 'success', text: 'Backup realizado com sucesso!' });
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao realizar backup' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    if (!canEdit) return;
    const confirmed = window.confirm('Tem certeza? Isso irá substituir todos os dados atuais pelos dados do backup.');
    if (!confirmed) return;

    setIsLoading(true);
    setMessage(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 5000));
      setMessage({ type: 'success', text: 'Sistema restaurado com sucesso!' });
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao restaurar sistema' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6" onChange={() => setIsDirty(true)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Configurações de Backup
          </CardTitle>
          <CardDescription>
            Gerencie a frequência e retenção dos backups
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequência do Backup</Label>
              <Select 
                value={backupSettings.frequency} 
                onValueChange={(value) => {
                  setBackupSettings(prev => ({ ...prev, frequency: value }));
                  setIsDirty(true);
                }}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">A cada hora</SelectItem>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="retention">Retenção (dias)</Label>
              <Input
                id="retention"
                type="number"
                value={backupSettings.retention}
                onChange={(e) => {
                  setBackupSettings(prev => ({ ...prev, retention: parseInt(e.target.value) }));
                  setIsDirty(true);
                }}
                disabled={!canEdit}
                placeholder="30"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="automatic">Backup Automático</Label>
              <p className="text-sm text-muted-foreground">
                Realizar backups automaticamente
              </p>
            </div>
            <Switch
              id="automatic"
              checked={backupSettings.automatic}
              onCheckedChange={(checked) => {
                setBackupSettings(prev => ({ ...prev, automatic: checked }));
                setIsDirty(true);
              }}
              disabled={!canEdit}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Armazenamento
          </CardTitle>
          <CardDescription>
            Configure onde os backups serão armazenados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location">Local de Armazenamento</Label>
            <Select 
              value={backupSettings.location} 
              onValueChange={(value) => {
                setBackupSettings(prev => ({ ...prev, location: value }));
                setIsDirty(true);
              }}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o local" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">Local (Servidor)</SelectItem>
                <SelectItem value="s3">Amazon S3</SelectItem>
                <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                <SelectItem value="azure">Azure Blob Storage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {backupSettings.location === 's3' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="s3Bucket">Bucket Name</Label>
                <Input
                  id="s3Bucket"
                  value={backupSettings.s3.bucket}
                  onChange={(e) => {
                    setBackupSettings(prev => ({ ...prev, s3: { ...prev.s3, bucket: e.target.value } }));
                    setIsDirty(true);
                  }}
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s3Region">Region</Label>
                <Input
                  id="s3Region"
                  value={backupSettings.s3.region}
                  onChange={(e) => {
                    setBackupSettings(prev => ({ ...prev, s3: { ...prev.s3, region: e.target.value } }));
                    setIsDirty(true);
                  }}
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s3AccessKey">Access Key</Label>
                <Input
                  id="s3AccessKey"
                  type="password"
                  value={backupSettings.s3.accessKey}
                  onChange={(e) => {
                    setBackupSettings(prev => ({ ...prev, s3: { ...prev.s3, accessKey: e.target.value } }));
                    setIsDirty(true);
                  }}
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s3SecretKey">Secret Key</Label>
                <Input
                  id="s3SecretKey"
                  type="password"
                  value={backupSettings.s3.secretKey}
                  onChange={(e) => {
                    setBackupSettings(prev => ({ ...prev, s3: { ...prev.s3, secretKey: e.target.value } }));
                    setIsDirty(true);
                  }}
                  disabled={!canEdit}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Histórico de Backups
              </CardTitle>
              <CardDescription>
                Visualize e restaure backups anteriores
              </CardDescription>
            </div>
            {canEdit && (
              <Button onClick={handleBackupNow} disabled={isLoading} size="sm">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
                Backup Agora
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Data</th>
                  <th className="p-3 text-left font-medium">Tipo</th>
                  <th className="p-3 text-left font-medium">Tamanho</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {recentBackups.map((backup) => (
                  <tr key={backup.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-3">{backup.date}</td>
                    <td className="p-3">
                      <Badge variant="outline">{backup.type === 'automatic' ? 'Automático' : 'Manual'}</Badge>
                    </td>
                    <td className="p-3">{backup.size}</td>
                    <td className="p-3">
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Sucesso</Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestore(backup.id)}
                        disabled={!canEdit || isLoading}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        Restaurar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Ações Gerais */}
      {canEdit && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-end">
              <Button onClick={handleSaveBackup} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MasterMonitoringContent({ canEdit, setMessage }: { canEdit: boolean; setMessage: (msg: ConfigMessage | null) => void }) {
  const tabsCtx = useContext(ConfigTabsContext);
  const [isDirty, setIsDirty] = useState(false);
  const [monitoringSettings, setMonitoringSettings] = useState({
    alerts: {
      cpu: 80,
      memory: 85,
      disk: 90,
      errors: true
    },
    logging: {
      level: 'info',
      retention: 30,
      enabled: true
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSaveMonitoring = useCallback(async () => {
    if (!canEdit) return;

    if (monitoringSettings.alerts.cpu < 0 || monitoringSettings.alerts.cpu > 100 ||
        monitoringSettings.alerts.memory < 0 || monitoringSettings.alerts.memory > 100 ||
        monitoringSettings.alerts.disk < 0 || monitoringSettings.alerts.disk > 100) {
      setMessage({ type: 'error', text: 'Limites devem estar entre 0 e 100%.' });
      return;
    }

    if (monitoringSettings.logging.enabled && monitoringSettings.logging.retention < 1) {
      setMessage({ type: 'error', text: 'Retenção de logs deve ser no mínimo 1 dia.' });
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Configurações de monitoramento salvas com sucesso!' });
      setIsDirty(false);
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações de monitoramento' });
    } finally {
      setIsLoading(false);
    }
  }, [canEdit, setMessage, monitoringSettings]);

  useEffect(() => {
    tabsCtx?.registerTab('monitoramento', {
      isDirty,
      save: async () => { await handleSaveMonitoring(); },
      reset: () => setIsDirty(false),
      requiredPermission: 'monitoring.manage'
    });
    return () => tabsCtx?.unregisterTab('monitoramento');
  }, [isDirty, tabsCtx, handleSaveMonitoring]);

  return (
    <div className="space-y-6" onChange={() => setIsDirty(true)}>
      {/* Alertas de Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Alertas de Performance
          </CardTitle>
          <CardDescription>
            Defina os limites para alertas de uso de recursos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpuThreshold">Limite de CPU (%)</Label>
              <Input
                id="cpuThreshold"
                type="number"
                value={monitoringSettings.alerts.cpu}
                onChange={(e) => {
                  setMonitoringSettings(prev => ({
                    ...prev,
                    alerts: { ...prev.alerts, cpu: parseInt(e.target.value) }
                  }));
                  setIsDirty(true);
                }}
                disabled={!canEdit}
                min={0}
                max={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memoryThreshold">Limite de Memória (%)</Label>
              <Input
                id="memoryThreshold"
                type="number"
                value={monitoringSettings.alerts.memory}
                onChange={(e) => {
                  setMonitoringSettings(prev => ({
                    ...prev,
                    alerts: { ...prev.alerts, memory: parseInt(e.target.value) }
                  }));
                  setIsDirty(true);
                }}
                disabled={!canEdit}
                min={0}
                max={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diskThreshold">Limite de Disco (%)</Label>
              <Input
                id="diskThreshold"
                type="number"
                value={monitoringSettings.alerts.disk}
                onChange={(e) => {
                  setMonitoringSettings(prev => ({
                    ...prev,
                    alerts: { ...prev.alerts, disk: parseInt(e.target.value) }
                  }));
                  setIsDirty(true);
                }}
                disabled={!canEdit}
                min={0}
                max={100}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-0.5">
              <Label htmlFor="errorAlerts">Alertas de Erro</Label>
              <p className="text-sm text-muted-foreground">
                Receber notificações imediatas sobre erros críticos
              </p>
            </div>
            <Switch
              id="errorAlerts"
              checked={monitoringSettings.alerts.errors}
              onCheckedChange={(checked) => {
                setMonitoringSettings(prev => ({
                  ...prev,
                  alerts: { ...prev.alerts, errors: checked }
                }));
                setIsDirty(true);
              }}
              disabled={!canEdit}
            />
          </div>
        </CardContent>
      </Card>

      {/* Configuração de Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Configuração de Logs
          </CardTitle>
          <CardDescription>
            Gerencie o nível de detalhe e retenção dos logs do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="loggingEnabled">Habilitar Logs</Label>
              <p className="text-sm text-muted-foreground">
                Registrar atividades do sistema
              </p>
            </div>
            <Switch
              id="loggingEnabled"
              checked={monitoringSettings.logging.enabled}
              onCheckedChange={(checked) => {
                setMonitoringSettings(prev => ({
                  ...prev,
                  logging: { ...prev.logging, enabled: checked }
                }));
                setIsDirty(true);
              }}
              disabled={!canEdit}
            />
          </div>

          {monitoringSettings.logging.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="logLevel">Nível de Log</Label>
                <Select 
                  value={monitoringSettings.logging.level} 
                  onValueChange={(value) => {
                    setMonitoringSettings(prev => ({
                      ...prev,
                      logging: { ...prev.logging, level: value }
                    }));
                    setIsDirty(true);
                  }}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debug">Debug (Detalhado)</SelectItem>
                    <SelectItem value="info">Info (Padrão)</SelectItem>
                    <SelectItem value="warn">Warning (Apenas alertas)</SelectItem>
                    <SelectItem value="error">Error (Apenas erros)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="logRetention">Retenção (dias)</Label>
                <Input
                  id="logRetention"
                  type="number"
                  value={monitoringSettings.logging.retention}
                  onChange={(e) => {
                    setMonitoringSettings(prev => ({
                      ...prev,
                      logging: { ...prev.logging, retention: parseInt(e.target.value) }
                    }));
                    setIsDirty(true);
                  }}
                  disabled={!canEdit}
                  min={1}
                  max={365}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações */}
      {canEdit && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-end">
              <Button onClick={handleSaveMonitoring} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MasterIntegrationsContent({ canEdit, setMessage }: { canEdit: boolean; setMessage: (msg: ConfigMessage | null) => void }) {
  const tabsCtx = useContext(ConfigTabsContext);
  const [isDirty, setIsDirty] = useState(false);
  const [integrations, setIntegrations] = useState({
    api: { 
      enabled: true, 
      rateLimit: 1000, 
      publicAccess: false 
    },
    webhooks: { 
      enabled: false, 
      maxRetries: 3,
      secretKey: ''
    },
    sso: { 
      enabled: false, 
      google: false, 
      microsoft: false,
      okta: false
    },
    storage: { 
      provider: 'local', 
      region: 'us-east-1', 
      bucket: '' 
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSaveIntegrations = useCallback(async () => {
    if (!canEdit) return;

    if (integrations.api.enabled && integrations.api.rateLimit <= 0) {
      setMessage({ type: 'error', text: 'Limite de requisições deve ser maior que 0.' });
      return;
    }

    if (integrations.webhooks.enabled) {
      if (integrations.webhooks.maxRetries < 0 || integrations.webhooks.maxRetries > 10) {
        setMessage({ type: 'error', text: 'Tentativas de reenvio devem ser entre 0 e 10.' });
        return;
      }
      if (!integrations.webhooks.secretKey) {
        setMessage({ type: 'error', text: 'Chave secreta do Webhook é obrigatória.' });
        return;
      }
    }

    if (integrations.storage.provider !== 'local') {
      if (!integrations.storage.bucket) {
        setMessage({ type: 'error', text: 'Nome do Bucket é obrigatório.' });
        return;
      }
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Integrações salvas com sucesso!' });
      setIsDirty(false);
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao salvar integrações' });
    } finally {
      setIsLoading(false);
    }
  }, [canEdit, setMessage, integrations]);

  useEffect(() => {
    tabsCtx?.registerTab('integracoes', {
      isDirty,
      save: async () => { await handleSaveIntegrations(); },
      reset: () => setIsDirty(false),
      requiredPermission: 'integrations.manage'
    });
    return () => tabsCtx?.unregisterTab('integracoes');
  }, [isDirty, tabsCtx, handleSaveIntegrations]);

  return (
    <div className="space-y-6" onChange={() => setIsDirty(true)}>
      {/* API e Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="w-5 h-5" />
            API e Webhooks
          </CardTitle>
          <CardDescription>
            Gerencie o acesso à API e integrações via Webhook
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="apiEnabled">Habilitar API</Label>
              <p className="text-sm text-muted-foreground">
                Permitir acesso externo via API REST
              </p>
            </div>
            <Switch
              id="apiEnabled"
              checked={integrations.api.enabled}
              onCheckedChange={(checked) => {
                setIntegrations(prev => ({
                  ...prev,
                  api: { ...prev.api, enabled: checked }
                }));
                setIsDirty(true);
              }}
              disabled={!canEdit}
            />
          </div>

          {integrations.api.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="rateLimit">Limite de Requisições (minuto)</Label>
                <Input
                  id="rateLimit"
                  type="number"
                  value={integrations.api.rateLimit}
                  onChange={(e) => {
                    setIntegrations(prev => ({
                      ...prev,
                      api: { ...prev.api, rateLimit: parseInt(e.target.value) }
                    }));
                    setIsDirty(true);
                  }}
                  disabled={!canEdit}
                />
              </div>
              <div className="flex items-center justify-between h-full pt-6">
                <div className="space-y-0.5">
                  <Label htmlFor="publicAccess">Acesso Público</Label>
                  <p className="text-sm text-muted-foreground">
                    Endpoints públicos sem autenticação
                  </p>
                </div>
                <Switch
                  id="publicAccess"
                  checked={integrations.api.publicAccess}
                  onCheckedChange={(checked) => {
                    setIntegrations(prev => ({
                      ...prev,
                      api: { ...prev.api, publicAccess: checked }
                    }));
                    setIsDirty(true);
                  }}
                  disabled={!canEdit}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-0.5">
              <Label htmlFor="webhooksEnabled">Webhooks</Label>
              <p className="text-sm text-muted-foreground">
                Enviar eventos para URLs externas
              </p>
            </div>
            <Switch
              id="webhooksEnabled"
              checked={integrations.webhooks.enabled}
              onCheckedChange={(checked) => {
                setIntegrations(prev => ({
                  ...prev,
                  webhooks: { ...prev.webhooks, enabled: checked }
                }));
                setIsDirty(true);
              }}
              disabled={!canEdit}
            />
          </div>

          {integrations.webhooks.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="webhookRetries">Tentativas de Reenvio</Label>
                <Input
                  id="webhookRetries"
                  type="number"
                  value={integrations.webhooks.maxRetries}
                  onChange={(e) => {
                    setIntegrations(prev => ({
                      ...prev,
                      webhooks: { ...prev.webhooks, maxRetries: parseInt(e.target.value) }
                    }));
                    setIsDirty(true);
                  }}
                  disabled={!canEdit}
                  max={10}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhookSecret">Chave Secreta (Assinatura)</Label>
                <div className="relative">
                  <Input
                    id="webhookSecret"
                    type="password"
                    value={integrations.webhooks.secretKey}
                    onChange={(e) => {
                      setIntegrations(prev => ({
                        ...prev,
                        webhooks: { ...prev.webhooks, secretKey: e.target.value }
                      }));
                      setIsDirty(true);
                    }}
                    disabled={!canEdit}
                    placeholder="Chave para validar payloads"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Autenticação SSO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Autenticação SSO
          </CardTitle>
          <CardDescription>
            Configure login único com provedores externos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ssoEnabled">Habilitar SSO</Label>
              <p className="text-sm text-muted-foreground">
                Permitir login com contas corporativas
              </p>
            </div>
            <Switch
              id="ssoEnabled"
              checked={integrations.sso.enabled}
              onCheckedChange={(checked) => {
                setIntegrations(prev => ({
                  ...prev,
                  sso: { ...prev.sso, enabled: checked }
                }));
                setIsDirty(true);
              }}
              disabled={!canEdit}
            />
          </div>

          {integrations.sso.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <Label htmlFor="ssoGoogle" className="cursor-pointer">Google</Label>
                </div>
                <Switch
                  id="ssoGoogle"
                  checked={integrations.sso.google}
                  onCheckedChange={(checked) => {
                    setIntegrations(prev => ({
                      ...prev,
                      sso: { ...prev.sso, google: checked }
                    }));
                    setIsDirty(true);
                  }}
                  disabled={!canEdit}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <Label htmlFor="ssoMicrosoft" className="cursor-pointer">Microsoft</Label>
                </div>
                <Switch
                  id="ssoMicrosoft"
                  checked={integrations.sso.microsoft}
                  onCheckedChange={(checked) => {
                    setIntegrations(prev => ({
                      ...prev,
                      sso: { ...prev.sso, microsoft: checked }
                    }));
                    setIsDirty(true);
                  }}
                  disabled={!canEdit}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <Label htmlFor="ssoOkta" className="cursor-pointer">Okta</Label>
                </div>
                <Switch
                  id="ssoOkta"
                  checked={integrations.sso.okta}
                  onCheckedChange={(checked) => {
                    setIntegrations(prev => ({
                      ...prev,
                      sso: { ...prev.sso, okta: checked }
                    }));
                    setIsDirty(true);
                  }}
                  disabled={!canEdit}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Armazenamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Armazenamento de Arquivos
          </CardTitle>
          <CardDescription>
            Configure onde os arquivos do sistema são armazenados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storageProvider">Provedor</Label>
              <Select 
                value={integrations.storage.provider} 
                onValueChange={(value) => {
                  setIntegrations(prev => ({
                    ...prev,
                    storage: { ...prev.storage, provider: value }
                  }));
                  setIsDirty(true);
                }}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o provedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local (Servidor)</SelectItem>
                  <SelectItem value="s3">Amazon S3</SelectItem>
                  <SelectItem value="azure">Azure Blob Storage</SelectItem>
                  <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {integrations.storage.provider !== 'local' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="storageRegion">Região</Label>
                  <Input
                    id="storageRegion"
                    value={integrations.storage.region}
                    onChange={(e) => {
                      setIntegrations(prev => ({
                        ...prev,
                        storage: { ...prev.storage, region: e.target.value }
                      }));
                      setIsDirty(true);
                    }}
                    disabled={!canEdit}
                    placeholder="us-east-1"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="storageBucket">Bucket / Container</Label>
                  <Input
                    id="storageBucket"
                    value={integrations.storage.bucket}
                    onChange={(e) => {
                      setIntegrations(prev => ({
                        ...prev,
                        storage: { ...prev.storage, bucket: e.target.value }
                      }));
                      setIsDirty(true);
                    }}
                    disabled={!canEdit}
                    placeholder="nome-do-bucket"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
            <CardDescription>
              Salvar configurações de integração
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={handleSaveIntegrations} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Integrações
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MasterMaintenanceContent({ canEdit, setMessage }: { canEdit: boolean; setMessage: (msg: ConfigMessage | null) => void }) {
  const tabsCtx = useContext(ConfigTabsContext);
  const [isDirty, setIsDirty] = useState(false);
  const [maintenanceSettings, setMaintenanceSettings] = useState({
    autoUpdate: true,
    maintenanceMode: false,
    logCleanup: true,
    cacheClear: false
  });

  const [healthStatus, setHealthStatus] = useState({
    api: 'ok',
    database: 'ok',
    storage: 'ok',
    cache: 'warning'
  });

  const [activeSessions, setActiveSessions] = useState(42);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const handleSaveMaintenance = useCallback(async () => {
    if (!canEdit) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Configurações de manutenção salvas com sucesso!' });
      setIsDirty(false);
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações de manutenção' });
    } finally {
      setIsLoading(false);
    }
  }, [canEdit, setMessage]);

  useEffect(() => {
    tabsCtx?.registerTab('manutencao', {
      isDirty,
      save: async () => { await handleSaveMaintenance(); },
      reset: () => setIsDirty(false),
      requiredPermission: 'maintenance.manage'
    });
    return () => tabsCtx?.unregisterTab('manutencao');
  }, [isDirty, tabsCtx, handleSaveMaintenance]);

  const handleClearCache = async () => {
    if (!canEdit) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setMessage({ type: 'success', text: 'Cache limpo com sucesso!' });
      setHealthStatus(prev => ({ ...prev, cache: 'ok' }));
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao limpar cache' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunDiagnostics = async () => {
    setIsCheckingHealth(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setHealthStatus({
        api: Math.random() > 0.1 ? 'ok' : 'error',
        database: 'ok',
        storage: 'ok',
        cache: 'ok'
      });
      toast.success('Diagnóstico concluído');
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleKillSessions = async () => {
    if (!canEdit) return;
    if (!window.confirm('Isso irá desconectar todos os usuários (exceto você). Continuar?')) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setActiveSessions(1); // Only current user
      setMessage({ type: 'success', text: 'Todas as sessões foram encerradas.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao encerrar sessões.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMaintenanceMode = async () => {
    if (!canEdit) return;
    
    const confirmed = window.confirm(
      `Tem certeza que deseja ${maintenanceSettings.maintenanceMode ? 'desativar' : 'ativar'} o modo de manutenção?\n\n` +
      `Isso ${maintenanceSettings.maintenanceMode ? 'permitirá' : 'bloqueará'} o acesso de usuários ao sistema.`
    );
    
    if (!confirmed) return;

    setIsLoading(true);
    setMessage(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMaintenanceSettings(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }));
      setMessage({ 
        type: 'success', 
        text: `Modo de manutenção ${maintenanceSettings.maintenanceMode ? 'desativado' : 'ativado'} com sucesso!` 
      });
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao alterar modo de manutenção' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6" onChange={() => setIsDirty(true)}>
      {/* Status do Sistema */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Status do Sistema
              </CardTitle>
              <CardDescription>
                Visão geral da saúde dos serviços
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRunDiagnostics} disabled={isCheckingHealth}>
              {isCheckingHealth ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Diagnóstico
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-sm font-medium text-muted-foreground">API</span>
              {healthStatus.api === 'ok' ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-500" />
              )}
              <span className={`text-xs px-2 py-1 rounded-full ${healthStatus.api === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {healthStatus.api === 'ok' ? 'Operacional' : 'Erro'}
              </span>
            </div>
            <div className="p-4 border rounded-lg flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Banco de Dados</span>
              {healthStatus.database === 'ok' ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-500" />
              )}
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">Operacional</span>
            </div>
            <div className="p-4 border rounded-lg flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Storage</span>
              {healthStatus.storage === 'ok' ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-500" />
              )}
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">Operacional</span>
            </div>
            <div className="p-4 border rounded-lg flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Cache</span>
              {healthStatus.cache === 'ok' ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <AlertCircle className="w-8 h-8 text-yellow-500" />
              )}
              <span className={`text-xs px-2 py-1 rounded-full ${healthStatus.cache === 'ok' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {healthStatus.cache === 'ok' ? 'Otimizado' : 'Limpeza Necessária'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controle de Manutenção */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Controle de Manutenção
          </CardTitle>
          <CardDescription>
            Ferramentas de administração do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoUpdate">Atualização Automática</Label>
                <p className="text-sm text-muted-foreground">
                  Aplicar patches de segurança automaticamente
                </p>
              </div>
              <Switch
                id="autoUpdate"
                checked={maintenanceSettings.autoUpdate}
                onCheckedChange={(checked) => {
                  setMaintenanceSettings(prev => ({ ...prev, autoUpdate: checked }));
                  setIsDirty(true);
                }}
                disabled={!canEdit}
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="maintenanceMode" className="text-destructive font-semibold">Modo de Manutenção</Label>
                <p className="text-sm text-destructive/80">
                  Bloqueia o acesso de todos os usuários (exceto admins)
                </p>
              </div>
              <Switch
                id="maintenanceMode"
                checked={maintenanceSettings.maintenanceMode}
                onCheckedChange={handleToggleMaintenanceMode}
                disabled={!canEdit || isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="logCleanup">Limpeza de Logs</Label>
                <p className="text-sm text-muted-foreground">
                  Arquivar logs antigos automaticamente após 30 dias
                </p>
              </div>
              <Switch
                id="logCleanup"
                checked={maintenanceSettings.logCleanup}
                onCheckedChange={(checked) => {
                  setMaintenanceSettings(prev => ({ ...prev, logCleanup: checked }));
                  setIsDirty(true);
                }}
                disabled={!canEdit}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>Cache do Sistema</Label>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={handleClearCache} 
                disabled={isLoading || !canEdit}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Limpar Cache Redis
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Sessões Ativas ({activeSessions})</Label>
              <Button 
                variant="outline" 
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" 
                onClick={handleKillSessions}
                disabled={isLoading || !canEdit}
              >
                <Users className="mr-2 h-4 w-4" />
                Encerrar Todas as Sessões
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      {canEdit && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-end">
              <Button onClick={handleSaveMaintenance} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
