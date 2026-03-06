import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/common/PageHeader";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Mail, Building, Calendar, Save, X, Settings, LifeBuoy, Key } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Perfil() {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const hasLocalChangesRef = useRef(false);
  const [stats, setStats] = useState({
    diagnosticos: 0,
    planosAtivos: 0,
    conquistas: 0,
    nivel: 'Iniciante'
  });

  console.log('Perfil component rendering', { user }); // Debug log

  const [formData, setFormData] = useState({
    nome: user?.name || '',
    email: user?.email || '',
    cargo: '',
    departamento: '',
    dataContratacao: '',
    telefone: '',
    bio: '',
    empresa: user?.company || '',
    avatarUrl: ''
  });
  const [initialData, setInitialData] = useState(formData);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('As novas senhas não coincidem');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    try {
      setChangingPassword(true);
      const response = await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Erro ao alterar senha');
      }

      toast.success('Senha alterada com sucesso');
      setIsPasswordDialogOpen(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err.message || 'Erro ao alterar senha');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // Reduced to 2MB for base64 safety
      toast.error('O arquivo deve ter no máximo 2MB');
      return;
    }

    try {
      setLoading(true);
      
      // Convert to Base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64String = reader.result as string;
        
        // Use api wrapper which handles token automatically
        const response = await api.post('/auth/profile/avatar', {
          avatar: base64String
        });

        if (!response.ok) {
          throw new Error('Falha no upload');
        }

        const data = await response.json();
        
        // Update form data with new avatar (base64 directly)
        setFormData(prev => ({ ...prev, avatarUrl: base64String }));
        
        if (user) {
          setUser({ ...user }); 
        }
        
        toast.success('Foto atualizada com sucesso');
        setLoading(false);
        // No need to reload page since we update state directly
      };

      reader.onerror = () => {
        toast.error('Erro ao ler arquivo');
        setLoading(false);
      };

    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao atualizar foto');
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      user: 'Colaborador',
      admin: 'Administrador',
      master: 'Master',
      visitor: 'Visitante'
    };
    return roles[role] || role;
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        return;
      }
      
      setLoading(true);

      const baseData = {
        nome: user.name || '',
        email: user.email || '',
        cargo: '',
        departamento: '',
        dataContratacao: '',
        telefone: '',
        bio: '',
        empresa: '', // Will be updated from API
        avatarUrl: ''
      };

      try {
        const response = await api.get('/auth/profile');
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          const message =
            (data && typeof data === 'object' && 'message' in data
              ? (data as { message?: string }).message
              : undefined) || 'Não foi possível carregar o perfil.';
          throw new Error(message);
        }

        const data = await response.json();

        const profileBio =
          data && typeof data === 'object' && 'profile' in data
            ? ((data as { profile?: { bio?: string } }).profile?.bio ?? '')
            : '';
        const profilePhone =
          data && typeof data === 'object' && 'profile' in data
            ? ((data as { profile?: { phone?: string } }).profile?.phone ?? '')
            : '';
        const profileDept =
          data && typeof data === 'object' && 'profile' in data
            ? ((data as { profile?: { department?: string } }).profile?.department ?? '')
            : '';
        const profilePos =
          data && typeof data === 'object' && 'profile' in data
            ? ((data as { profile?: { position?: string } }).profile?.position ?? '')
            : '';
        const profileHireDateRaw =
          data && typeof data === 'object' && 'profile' in data
            ? ((data as { profile?: { hireDate?: string } }).profile?.hireDate ?? '')
            : '';
        const profileHireDate = profileHireDateRaw ? String(profileHireDateRaw).split('T')[0] : '';
        
        const profileAvatarUrl =
          data && typeof data === 'object' && 'profile' in data
            ? ((data as { profile?: { avatarUrl?: string } }).profile?.avatarUrl ?? '')
            : '';

        const merged = {
          ...baseData,
          nome: (data as { name?: string }).name || baseData.nome,
          email: (data as { email?: string }).email || baseData.email,
          telefone: profilePhone || baseData.telefone,
          bio: profileBio || baseData.bio,
          cargo: profilePos || baseData.cargo,
          departamento: profileDept || baseData.departamento,
          dataContratacao: profileHireDate || baseData.dataContratacao,
          empresa: (data as { company?: string }).company || baseData.empresa,
          avatarUrl: profileAvatarUrl || baseData.avatarUrl
        };

        setInitialData(merged);
        if (!hasLocalChangesRef.current) {
          setFormData(merged);
        }

        if (data.stats) {
          setStats({
            diagnosticos: data.stats.diagnosticos || 0,
            planosAtivos: data.stats.planosAtivos || 0,
            conquistas: data.stats.conquistas || 0,
            nivel: `Nível ${data.stats.nivel || 1}`
          });
        }
      } catch (error) {
        const err = error as { message?: string };
        toast.error(err.message || 'Erro ao carregar perfil.');
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user || saving) {
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: formData.nome,
        email: formData.email,
        phone: formData.telefone,
        bio: formData.bio,
        department: formData.departamento,
        position: formData.cargo,
        hireDate: formData.dataContratacao,
      };

      const response = await api.put('/auth/profile', payload);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message =
          (data && typeof data === 'object' && 'message' in data
            ? (data as { message?: string }).message
            : undefined) || 'Não foi possível salvar o perfil.';
        throw new Error(message);
      }

      const data = await response.json();

      const profileBio =
        data && typeof data === 'object' && 'profile' in data
          ? ((data as { profile?: { bio?: string } }).profile?.bio ?? '')
          : '';
      const profilePhone =
        data && typeof data === 'object' && 'profile' in data
          ? ((data as { profile?: { phone?: string } }).profile?.phone ?? '')
          : '';
      const profileDept =
        data && typeof data === 'object' && 'profile' in data
          ? ((data as { profile?: { department?: string } }).profile?.department ?? '')
          : '';
      const profilePos =
        data && typeof data === 'object' && 'profile' in data
          ? ((data as { profile?: { position?: string } }).profile?.position ?? '')
          : '';
      const profileHireDateRaw =
        data && typeof data === 'object' && 'profile' in data
          ? ((data as { profile?: { hireDate?: string } }).profile?.hireDate ?? '')
          : '';
      const profileHireDate = profileHireDateRaw ? String(profileHireDateRaw).split('T')[0] : '';

      const updatedForm = {
        ...formData,
        nome: (data as { name?: string }).name || formData.nome,
        email: (data as { email?: string }).email || formData.email,
        telefone: profilePhone || formData.telefone,
        bio: profileBio || formData.bio,
        cargo: profilePos || formData.cargo,
        departamento: profileDept || formData.departamento,
        dataContratacao: profileHireDate || formData.dataContratacao,
      };

      setFormData(updatedForm);
      setInitialData(updatedForm);

      if (user) {
        setUser({
          ...user,
          name: (data as { name?: string }).name || user.name,
          email: (data as { email?: string }).email || user.email,
        });
      }

      toast.success('Perfil atualizado com sucesso.');
      hasLocalChangesRef.current = false;
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err.message || 'Erro ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialData);
    hasLocalChangesRef.current = false;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  return (
    
    <div className="space-y-8">
      <PageHeader
        title="Meu Perfil"
        description="Gerencie suas informações pessoais e profissionais"
        icon={User}
        actions={[
          {
            label: saving ? 'Salvando...' : 'Salvar',
            icon: Save,
            onClick: handleSave,
            disabled: saving,
          },
          {
            label: 'Reverter',
            icon: X,
            variant: 'secondary',
            onClick: handleCancel,
            disabled: saving,
          },
        ]}
      />

      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Principais */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4 mb-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={formData.avatarUrl || ""} />
                  <AvatarFallback className="text-2xl">
                    {user?.name?.split(' ').map(n => n[0]).join('') || 'JS'}
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
                variant="outline" 
                size="sm" 
                onClick={handleAvatarClick}
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Alterar Foto'}
              </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => {
                      hasLocalChangesRef.current = true;
                      setFormData({ ...formData, nome: e.target.value });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      hasLocalChangesRef.current = true;
                      setFormData({ ...formData, email: e.target.value });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => {
                      hasLocalChangesRef.current = true;
                      setFormData({ ...formData, telefone: e.target.value });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    value={formData.cargo}
                    onChange={(e) => {
                      hasLocalChangesRef.current = true;
                      setFormData({ ...formData, cargo: e.target.value });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departamento">Departamento</Label>
                  <Input
                    id="departamento"
                    value={formData.departamento}
                    onChange={(e) => {
                      hasLocalChangesRef.current = true;
                      setFormData({ ...formData, departamento: e.target.value });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataContratacao">Data de Contratação</Label>
                  <Input
                    id="dataContratacao"
                    type="date"
                    value={formData.dataContratacao}
                    onChange={(e) => {
                      hasLocalChangesRef.current = true;
                      setFormData({ ...formData, dataContratacao: e.target.value });
                    }}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="empresa">Empresa</Label>
                  <Input
                    id="empresa"
                    value={formData.empresa}
                    disabled={true}
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => {
                    hasLocalChangesRef.current = true;
                    setFormData({ ...formData, bio: e.target.value });
                  }}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Estatísticas Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Diagnósticos</span>
                <Badge variant="secondary">{stats.diagnosticos}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Planos Ativos</span>
                <Badge variant="secondary">{stats.planosAtivos}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Conquistas</span>
                <Badge variant="secondary">{stats.conquistas}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Nível</span>
                <Badge variant="default">{stats.nivel}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Informações da Conta */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações da Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{getRoleLabel(user?.role || 'visitor')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{formData.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Building className="w-4 h-4 text-muted-foreground" />
                <span>{formData.empresa || 'Empresa não definida'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Desde {formatDate(formData.dataContratacao)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start gap-2"
                  >
                    <Key className="w-4 h-4" />
                    Alterar Senha
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Alterar Senha</DialogTitle>
                    <DialogDescription>
                      Digite sua senha atual e a nova senha para realizar a alteração.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Senha Atual</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nova Senha</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleChangePassword} disabled={changingPassword}>
                      {changingPassword ? 'Alterando...' : 'Confirmar Alteração'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start gap-2"
                onClick={() => navigate('/configuracoes')}
              >
                <Settings className="w-4 h-4" />
                Configurações
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start gap-2"
                onClick={() => window.open('mailto:suporte@workchoq.com')}
              >
                <LifeBuoy className="w-4 h-4" />
                Suporte
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
