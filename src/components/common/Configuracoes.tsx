import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { usePermissions } from '@/contexts/PermissionsContext';
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
  const [profileData, setProfileData] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    department: '',
    position: ''
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
    // TODO: Implementar carregamento real dos dados
    const initial = {
      name: 'João Silva',
      email: 'joao@empresa.com',
      phone: '+55 11 99999-9999',
      department: 'Recursos Humanos',
      position: 'Analista'
    };
    setProfileData(initial);
    initialProfileRef.current = initial;
    const timer = setTimeout(() => setIsInitialLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSaveProfile = useCallback(async () => {
    if (!canEdit) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      // TODO: Implementar chamada real para API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
      
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil' });
    } finally {
      setIsLoading(false);
    }
  }, [canEdit, setMessage]);

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
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-10 h-10 text-gray-500" />
              </div>
              <Button size="sm" variant="outline" className="absolute -bottom-1 -right-1 h-8 w-8 p-0">
                <Upload className="w-4 h-4" />
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
  }, [canEdit, setMessage]);

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

  const handleCreateUser = () => {
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
    setSelectedUser(user);
    setShowUserModal(true);
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
      save: async () => {},
      reset: () => setIsDirty(false),
      requiredPermission: 'users.manage'
    });
    return () => tabsCtx?.unregisterTab('usuarios');
  }, [isDirty, tabsCtx]);

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
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
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
  }, [canEdit, setMessage]);

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
      twoFactor: true,
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
  }, [canEdit, setMessage]);

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Configurações de Segurança
          </CardTitle>
          <CardDescription>
            Configure as políticas de segurança do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="twoFactor">Autenticação 2FA</Label>
                  <p className="text-sm text-muted-foreground">
                    Exigir autenticação de dois fatores
                  </p>
                </div>
                <Switch
                  id="twoFactor"
                  checked={securitySettings.authentication.twoFactor}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({
                    ...prev,
                    authentication: { ...prev.authentication, twoFactor: checked }
                  }))}
                  disabled={!canEdit}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="encryption">Criptografia</Label>
                  <p className="text-sm text-muted-foreground">
                    Criptografar dados sensíveis
                  </p>
                </div>
                <Switch
                  id="encryption"
                  checked={securitySettings.encryption.enabled}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({
                    ...prev,
                    encryption: { ...prev.encryption, enabled: checked }
                  }))}
                  disabled={!canEdit}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="monitoring">Monitoramento</Label>
                  <p className="text-sm text-muted-foreground">
                    Monitorar atividades suspeitas
                  </p>
                </div>
                <Switch
                  id="monitoring"
                  checked={securitySettings.monitoring.suspiciousActivity}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({
                    ...prev,
                    monitoring: { ...prev.monitoring, suspiciousActivity: checked }
                  }))}
                  disabled={!canEdit}
                />
              </div>
            </div>
          </div>

          {canEdit && (
            <div className="flex justify-end pt-4">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MasterBackupContent({ canEdit, setMessage }: { canEdit: boolean; setMessage: (msg: ConfigMessage | null) => void }) {
  const [backupSettings, setBackupSettings] = useState({
    automatic: true,
    frequency: 'daily',
    retention: 30,
    location: 'cloud'
  });

  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Configurações de Backup
          </CardTitle>
          <CardDescription>
            Gerencie os backups do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequência do Backup</Label>
              <Select 
                value={backupSettings.frequency} 
                onValueChange={(value) => setBackupSettings(prev => ({ ...prev, frequency: value }))}
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
                onChange={(e) => setBackupSettings(prev => ({ ...prev, retention: parseInt(e.target.value) }))}
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
              onCheckedChange={(checked) => setBackupSettings(prev => ({ ...prev, automatic: checked }))}
              disabled={!canEdit}
            />
          </div>

          {canEdit && (
            <div className="flex justify-end pt-4">
              <Button onClick={handleBackupNow} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fazendo Backup...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Backup Agora
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

function MasterMonitoringContent({ canEdit, setMessage }: { canEdit: boolean; setMessage: (msg: ConfigMessage | null) => void }) {
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

  const handleSaveMonitoring = async () => {
    if (!canEdit) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Configurações de monitoramento salvas com sucesso!' });
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações de monitoramento' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Monitoramento do Sistema
          </CardTitle>
          <CardDescription>
            Configure o monitoramento de performance e alertas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cpuThreshold">Limite de CPU (%)</Label>
                <Input
                  id="cpuThreshold"
                  type="number"
                  value={monitoringSettings.alerts.cpu}
                  onChange={(e) => setMonitoringSettings(prev => ({
                    ...prev,
                    alerts: { ...prev.alerts, cpu: parseInt(e.target.value) }
                  }))}
                  disabled={!canEdit}
                  placeholder="80"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="memoryThreshold">Limite de Memória (%)</Label>
                <Input
                  id="memoryThreshold"
                  type="number"
                  value={monitoringSettings.alerts.memory}
                  onChange={(e) => setMonitoringSettings(prev => ({
                    ...prev,
                    alerts: { ...prev.alerts, memory: parseInt(e.target.value) }
                  }))}
                  disabled={!canEdit}
                  placeholder="85"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="diskThreshold">Limite de Disco (%)</Label>
                <Input
                  id="diskThreshold"
                  type="number"
                  value={monitoringSettings.alerts.disk}
                  onChange={(e) => setMonitoringSettings(prev => ({
                    ...prev,
                    alerts: { ...prev.alerts, disk: parseInt(e.target.value) }
                  }))}
                  disabled={!canEdit}
                  placeholder="90"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="errorAlerts">Alertas de Erro</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber alertas sobre erros
                  </p>
                </div>
                <Switch
                  id="errorAlerts"
                  checked={monitoringSettings.alerts.errors}
                  onCheckedChange={(checked) => setMonitoringSettings(prev => ({
                    ...prev,
                    alerts: { ...prev.alerts, errors: checked }
                  }))}
                  disabled={!canEdit}
                />
              </div>
            </div>
          </div>

          {canEdit && (
            <div className="flex justify-end pt-4">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MasterIntegrationsContent({ canEdit, setMessage }: { canEdit: boolean; setMessage: (msg: ConfigMessage | null) => void }) {
  const [integrations, setIntegrations] = useState({
    email: { enabled: true, smtp: '' },
    api: { enabled: true, rateLimit: 1000 }
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSaveIntegrations = async () => {
    if (!canEdit) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Integrações salvas com sucesso!' });
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao salvar integrações' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="w-5 h-5" />
            Integrações do Sistema
          </CardTitle>
          <CardDescription>
            Configure integrações com serviços externos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emailIntegration">Email</Label>
                <p className="text-sm text-muted-foreground">
                  Integração com serviço de email
                </p>
              </div>
              <Switch
                id="emailIntegration"
                checked={integrations.email.enabled}
                onCheckedChange={(checked) => setIntegrations(prev => ({
                  ...prev,
                  email: { ...prev.email, enabled: checked }
                }))}
                disabled={!canEdit}
              />
            </div>
          </div>

          {canEdit && (
            <div className="flex justify-end pt-4">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MasterMaintenanceContent({ canEdit, setMessage }: { canEdit: boolean; setMessage: (msg: ConfigMessage | null) => void }) {
  const [maintenanceSettings, setMaintenanceSettings] = useState({
    autoUpdate: true,
    maintenanceMode: false,
    logCleanup: true,
    cacheClear: false
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleClearCache = async () => {
    if (!canEdit) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setMessage({ type: 'success', text: 'Cache limpo com sucesso!' });
    } catch (error: unknown) {
      setMessage({ type: 'error', text: 'Erro ao limpar cache' });
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Manutenção do Sistema
          </CardTitle>
          <CardDescription>
            Ferramentas de manutenção e administração do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoUpdate">Atualização Automática</Label>
                <p className="text-sm text-muted-foreground">
                  Atualizar sistema automaticamente
                </p>
              </div>
              <Switch
                id="autoUpdate"
                checked={maintenanceSettings.autoUpdate}
                onCheckedChange={(checked) => setMaintenanceSettings(prev => ({ ...prev, autoUpdate: checked }))}
                disabled={!canEdit}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="maintenanceMode">Modo de Manutenção</Label>
                <p className="text-sm text-muted-foreground">
                  Bloquear acesso durante manutenção
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
                  Limpar logs antigos automaticamente
                </p>
              </div>
              <Switch
                id="logCleanup"
                checked={maintenanceSettings.logCleanup}
                onCheckedChange={(checked) => setMaintenanceSettings(prev => ({ ...prev, logCleanup: checked }))}
                disabled={!canEdit}
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex gap-4">
              <Button variant="outline" onClick={handleClearCache} disabled={isLoading || !canEdit}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Limpando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Limpar Cache
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
