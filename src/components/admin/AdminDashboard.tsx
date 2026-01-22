import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  FileText, 
  Target, 
  TrendingUp, 
  Award, 
  Building, 
  Download,
  Plus,
  BarChart3,
  UserCheck,
  LayoutDashboard,
  RefreshCw
} from 'lucide-react';
import AchievementBadge from '@/components/common/AchievementBadge';
import PageHeader from '@/components/common/PageHeader';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: 'bronze' | 'silver' | 'gold' | 'diamond' | 'crown';
  rarity: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

interface RawAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: string;
  rarity: string;
  unlocked: boolean;
  unlockedAt?: string;
}

interface AdminDashboardStats {
  users: { total: number; active: number };
  diagnostics: { total: number; completed: number };
  actionPlans: { total: number };
  goals: { total: number; completed: number };
  achievements: { totalUnlocked: number; latest: Achievement[] };
  recentActivity: { id: string; user: string; action: string; date: string; details?: string }[];
  topPerformers?: { id: string; name: string; diagnosticsCount: number }[];
  teamProgress?: { name: string; progress: number }[];
}

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/reports/overview');
        if (res.ok) {
          const data = await res.json();
          if (data.achievements?.latest) {
            const normalized: Achievement[] = data.achievements.latest.map((a: RawAchievement) => ({
              ...a,
              unlockedAt: a.unlockedAt ? new Date(a.unlockedAt) : undefined
            }));

            const uniqueById = new Map<string, Achievement>();
            for (const achievement of normalized) {
              if (!uniqueById.has(achievement.id)) uniqueById.set(achievement.id, achievement);
            }

            data.achievements.latest = Array.from(uniqueById.values());
          }
          setStats(data);
        }
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        toast.error('Erro ao carregar informações do dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const displayStats = stats ? {
    colaboradores: stats.users.total,
    diagnosticos: stats.diagnostics.total,
    engajamento: stats.users.total > 0 
      ? Math.round((stats.users.active / stats.users.total) * 100) 
      : 0,
    activePlans: stats.actionPlans.total,
    completedGoals: stats.goals.completed,
    achievements: stats.achievements?.totalUnlocked || 0,
    latestAchievements: stats.achievements?.latest || [],
    recentActivity: stats.recentActivity || [],
    topPerformers: stats.topPerformers || [],
    teamProgress: {
      diagnostics: {
        current: stats.diagnostics.completed,
        total: stats.users.total, // Assuming 1 diagnostic per user as a target
        percentage: stats.users.total > 0 ? Math.round((stats.diagnostics.completed / stats.users.total) * 100) : 0
      },
      plans: {
        current: stats.goals.completed,
        total: stats.goals.total,
        percentage: stats.goals.total > 0 ? Math.round((stats.goals.completed / stats.goals.total) * 100) : 0
      },
      engagement: {
        current: stats.users.active,
        total: stats.users.total,
        percentage: stats.users.total > 0 ? Math.round((stats.users.active / stats.users.total) * 100) : 0
      }
    }
  } : {
    colaboradores: 0,
    diagnosticos: 0,
    engajamento: 0,
    activePlans: 0,
    completedGoals: 0,
    achievements: 0,
    latestAchievements: [],
    recentActivity: [],
    topPerformers: [],
    teamProgress: {
      diagnostics: { current: 0, total: 0, percentage: 0 },
      plans: { current: 0, total: 0, percentage: 0 },
      engagement: { current: 0, total: 0, percentage: 0 }
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Dashboard Administrativo - ${user?.company || 'Minha Empresa'}`}
        description="Gerencie sua empresa e acompanhe o progresso da equipe"
        icon={Building}
        badges={[
          { label: `${displayStats.colaboradores} colaboradores`, icon: Users },
          { label: `${displayStats.diagnosticos} diagnósticos`, icon: FileText },
          { label: `${displayStats.engajamento}% engajamento`, icon: TrendingUp }
        ]}
        actions={[
          { 
            label: "Gerenciar Equipe", 
            icon: Users, 
            onClick: () => console.log('Abrindo gestão de equipe...'),
            variant: 'primary' as const
          }
        ]}
      />

      <div className="container mx-auto px-4">

        {/* Company Stats */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Colaboradores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.colaboradores}</div>
              <p className="text-xs text-muted-foreground">
                Total cadastrado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diagnósticos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.diagnosticos}</div>
              <p className="text-xs text-muted-foreground">
                Realizados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.activePlans}</div>
              <p className="text-xs text-muted-foreground">
                Em andamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engajamento</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.engajamento}%</div>
              <p className="text-xs text-muted-foreground">
                usuários ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conquistas</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.achievements}</div>
              <p className="text-xs text-muted-foreground">
                desbloqueadas
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      <span>Atividade Recente</span>
                    </CardTitle>
                    <CardDescription>
                      Últimas atividades da sua equipe
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Relatório
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {displayStats.recentActivity.length > 0 ? (
                  displayStats.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <UserCheck className="h-8 w-8 text-green-500" />
                        <div>
                          <h4 className="font-medium">{activity.user}</h4>
                          <p className="text-sm text-muted-foreground">{activity.action}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{new Date(activity.date).toLocaleDateString()}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">Nenhuma atividade recente.</p>
                )}
              </CardContent>
            </Card>

            {/* Team Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  <span>Progresso da Equipe</span>
                </CardTitle>
                <CardDescription>
                  Acompanhe o desenvolvimento dos colaboradores
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Meta de Diagnósticos (Mensal)</h4>
                    <span className="text-sm text-muted-foreground">{displayStats.teamProgress.diagnostics.percentage}%</span>
                  </div>
                  <Progress value={displayStats.teamProgress.diagnostics.percentage} className="h-3" />
                  <p className="text-sm text-muted-foreground mt-1">
                    {displayStats.teamProgress.diagnostics.current} de {displayStats.teamProgress.diagnostics.total} diagnósticos realizados
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Planos de Ação Concluídos</h4>
                    <span className="text-sm text-muted-foreground">{displayStats.teamProgress.plans.percentage}%</span>
                  </div>
                  <Progress value={displayStats.teamProgress.plans.percentage} className="h-3" />
                  <p className="text-sm text-muted-foreground mt-1">
                    {displayStats.teamProgress.plans.current} de {displayStats.teamProgress.plans.total} planos concluídos
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Engajamento Geral</h4>
                    <span className="text-sm text-muted-foreground">{displayStats.teamProgress.engagement.percentage}%</span>
                  </div>
                  <Progress value={displayStats.teamProgress.engagement.percentage} className="h-3" />
                  <p className="text-sm text-muted-foreground mt-1">
                    {displayStats.teamProgress.engagement.current} de {displayStats.teamProgress.engagement.total} colaboradores ativos
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-accent" />
                  <span>Conquistas da Empresa</span>
                </CardTitle>
                <CardDescription>
                  Metas coletivas alcançadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {displayStats.latestAchievements.map((achievement) => (
                    <AchievementBadge 
                      key={achievement.id} 
                      achievement={achievement} 
                      size="sm"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Colaborador
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Criar Plano de Ação
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  Gerar Relatório
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Gestão de Usuários
                </Button>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>
                  Colaboradores mais engajados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {displayStats.topPerformers.length > 0 ? (
                  displayStats.topPerformers.map((performer, index) => (
                    <div key={performer.id} className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0 ? 'bg-accent text-primary' : 'bg-muted text-foreground'}`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{performer.name}</p>
                        <p className="text-sm text-muted-foreground">{performer.diagnosticsCount} diagnósticos</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">Nenhum destaque ainda.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
