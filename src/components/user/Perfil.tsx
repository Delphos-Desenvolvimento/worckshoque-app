import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/common/PageHeader";
import { User, Mail, Building, Calendar, Edit, Save, X } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function Perfil() {
  const { user, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
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
    empresa: user?.company || ''
  });
  const [initialData, setInitialData] = useState(formData);

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
        empresa: user.company || ''
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

        const merged = {
          ...baseData,
          nome: (data as { name?: string }).name || baseData.nome,
          email: (data as { email?: string }).email || baseData.email,
          telefone: profilePhone || baseData.telefone,
          bio: profileBio || baseData.bio,
          cargo: profilePos || baseData.cargo,
          departamento: profileDept || baseData.departamento,
          dataContratacao: profileHireDate || baseData.dataContratacao,
        };

        setFormData(merged);
        setInitialData(merged);
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
      setIsEditing(false);
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err.message || 'Erro ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialData);
    setIsEditing(false);
  };

  return (
    
    <div className="space-y-8">
      <PageHeader
        title="Meu Perfil (Atualizado)"
        description="Gerencie suas informações pessoais e profissionais"
        icon={User}
        actions={
          !isEditing
            ? [
                { label: 'Editar Perfil', icon: Edit, onClick: () => setIsEditing(true) }
              ]
            : [
                { label: 'Salvar', icon: Save, onClick: handleSave },
                { label: 'Cancelar', icon: X, variant: 'secondary', onClick: handleCancel }
              ]
        }
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
                  <AvatarImage src="" />
                  <AvatarFallback className="text-2xl">
                    {user?.name?.split(' ').map(n => n[0]).join('') || 'JS'}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => toast.info('Funcionalidade em desenvolvimento')}
                  >
                    Alterar Foto
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departamento">Departamento</Label>
                  <Input
                    id="departamento"
                    value={formData.departamento}
                    onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataContratacao">Data de Contratação</Label>
                  <Input
                    id="dataContratacao"
                    type="date"
                    value={formData.dataContratacao}
                    onChange={(e) => setFormData({ ...formData, dataContratacao: e.target.value })}
                    disabled={!isEditing}
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
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  disabled={!isEditing}
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
                <span>{formData.empresa}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Desde {new Date(formData.dataContratacao).toLocaleDateString('pt-BR')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                Alterar Senha
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Configurações
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Suporte
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
