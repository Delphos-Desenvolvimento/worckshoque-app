import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart, Target, Trophy, TrendingUp, Users, FileText, Award, Plus, LayoutDashboard, Loader2 } from 'lucide-react';
import AchievementBadge from '@/components/common/AchievementBadge';
import PageHeader from '@/components/common/PageHeader';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import ModalLayout from '@/components/common/ModalLayout';
import Diagnostico from '@/components/user/Diagnostico';

interface DashboardData {
  stats: {
    diagnostics: number;
    activePlans: number;
    achievements: number;
    ranking: number;
    level?: number;
  };
  recentDiagnostics: DiagnosticSummary[];
  activePlans: ActionPlanSummary[];
  recentAchievements: AchievementSummary[];
}

interface DiagnosticSummary {
  id: string;
  questionnaire: { title: string };
  generated_at: string;
  status: string;
}

interface ActionPlanSummary {
  id: string;
  title: string;
  progress: number;
  totalTasks: number;
  completedTasks: number;
}

interface AchievementSummary {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: 'bronze' | 'silver' | 'gold' | 'diamond' | 'crown';
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
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
  progress?: number;
  maxProgress?: number;
}

interface RawGoal {
  id: string;
  status: string;
}

interface RawActionPlan {
  id: string;
  title: string;
  status: string;
  progress: number;
  goals?: RawGoal[];
}

interface RawDiagnostic {
  id: string;
  questionnaire: { title: string };
  generated_at: string;
  status: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);

  const handleNewDiagnostic = () => {
    setIsDiagnosticModalOpen(true);
  };

  const fetchDashboardData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const [diagnosticsRes, plansRes, achievementsRes] = await Promise.all([
        api.get('/diagnostics'),
        api.get('/action-plans'),
        api.get('/achievements/my'),
      ]);

      const diagnostics = diagnosticsRes.ok ? await diagnosticsRes.json() : [];
      const plans = plansRes.ok ? await plansRes.json() : [];
      const achievementsRaw: RawAchievement[] = achievementsRes.ok ? await achievementsRes.json() : [];
      const achievements = achievementsRaw.map((a) => ({
        ...a,
        unlockedAt: a.unlockedAt ? new Date(a.unlockedAt) : undefined,
        level: a.level as 'bronze' | 'silver' | 'gold' | 'diamond' | 'crown'
      }));

      const activePlansSummary: ActionPlanSummary[] = (plans as RawActionPlan[])
        .filter((p) => p.status === 'em_andamento' || p.status === 'rascunho')
        .map((p) => {
          const goals = p.goals || [];
          const totalTasks = goals.length;
          const completedTasks = goals.filter((g) => g.status === 'completed' || g.status === 'concluido').length;
          
          return {
            id: p.id,
            title: p.title,
            progress: p.progress || 0,
            totalTasks,
            completedTasks
          };
        });

      const totalProgress = activePlansSummary.reduce((acc, curr) => acc + curr.progress, 0);
      const avgProgress = activePlansSummary.length > 0 
        ? Math.round(totalProgress / activePlansSummary.length) 
        : 0;
      
      const unlockedAchievements = achievements.filter((a) => a.unlocked);
      const level = Math.floor(unlockedAchievements.length / 3) + 1;

      const displayAchievements = unlockedAchievements.length > 0 ? unlockedAchievements : achievements.slice(0, 3);

      setData({
        stats: {
          diagnostics: diagnostics.length,
          activePlans: activePlansSummary.length,
          achievements: unlockedAchievements.length,
          ranking: avgProgress,
          level
        },
        recentDiagnostics: (diagnostics as RawDiagnostic[]).slice(0, 3).map((d) => ({
          id: d.id,
          questionnaire: d.questionnaire || { title: 'Diagnóstico' },
          generated_at: d.generated_at,
          status: d.status || 'Concluído'
        })),
        activePlans: activePlansSummary.slice(0, 3),
        recentAchievements: displayAchievements.slice(0, 3)
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      toast.error('Erro ao carregar informações do dashboard');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  const handleDiagnosticModalClose = () => {
    setIsDiagnosticModalOpen(false);
    fetchDashboardData(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = data?.stats || { diagnostics: 0, activePlans: 0, achievements: 0, ranking: 0, level: 1 };

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Bem-vindo, ${user?.name || 'Usuário'}! 👋`}
        description="Aqui está um resumo do seu progresso no WorkChoque"
        icon={LayoutDashboard}
        badges={[
          { label: `${stats.diagnostics} diagnósticos realizados`, icon: FileText },
          { label: `Nível ${stats.level || 1}`, icon: Trophy },
          { label: `${stats.ranking}% de progresso`, icon: TrendingUp }
        ]}
        actions={[
          { 
            label: "Novo Diagnóstico", 
            icon: Plus, 
            onClick: handleNewDiagnostic,
            variant: 'primary' as const
          }
        ]}
      />

      <div className="container mx-auto px-4">

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diagnósticos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.diagnostics}</div>
              <p className="text-xs text-muted-foreground">
                Total realizado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activePlans}</div>
              <p className="text-xs text-muted-foreground">
                Em andamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conquistas</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.achievements}</div>
              <p className="text-xs text-muted-foreground">
                Desbloqueadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ranking</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">#{stats.ranking}</div>
              <p className="text-xs text-muted-foreground">
                na sua empresa
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Diagnostics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart className="h-5 w-5 text-primary" />
                  <span>Diagnósticos Recentes</span>
                </CardTitle>
                <CardDescription>
                  Seus últimos diagnósticos e resultados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data?.recentDiagnostics.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhum diagnóstico recente.</p>
                ) : (
                  data?.recentDiagnostics.map((diag: DiagnosticSummary) => (
                    <div key={diag.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{diag.questionnaire.title}</h4>
                        <p className="text-sm text-muted-foreground">Realizado em {new Date(diag.generated_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <Badge variant={diag.status === 'completed' ? 'secondary' : 'outline'}>
                        {diag.status === 'completed' ? 'Concluído' : diag.status}
                      </Badge>
                    </div>
                  ))
                )}
                
                <Button variant="outline" className="w-full" size="lg" onClick={handleNewDiagnostic}>
                  <Plus className="mr-2 h-4 w-4" />
                  Fazer Novo Diagnóstico
                </Button>
              </CardContent>
            </Card>

            {/* Active Action Plans */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-accent" />
                  <span>Planos de Ação Ativos</span>
                </CardTitle>
                <CardDescription>
                  Acompanhe o progresso dos seus planos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data?.activePlans.map((plan: ActionPlanSummary) => (
                  <div key={plan.id} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{plan.title}</h4>
                      <span className="text-sm text-muted-foreground">{plan.progress}%</span>
                    </div>
                    <Progress value={plan.progress} className="h-2" />
                    <p className="text-sm text-muted-foreground">{plan.completedTasks} de {plan.totalTasks} tarefas concluídas</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-accent" />
                  <span>Conquistas Recentes</span>
                </CardTitle>
                <CardDescription>
                  Suas últimas conquistas desbloqueadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {data?.recentAchievements.slice(0, 4).map((achievement: AchievementSummary) => (
                    <div key={achievement.id} className="flex justify-center">
                      <AchievementBadge 
                        achievement={achievement} 
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4" size="sm" onClick={() => navigate('/conquistas')}>
                  Ver Todas as Conquistas
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" size="sm" onClick={handleNewDiagnostic}>
                  <FileText className="mr-2 h-4 w-4" />
                  Novo Diagnóstico
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => navigate('/conquistas')}>
                  <Users className="mr-2 h-4 w-4" />
                  Ver Ranking
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => navigate('/conquistas')}>
                  <Trophy className="mr-2 h-4 w-4" />
                  Minhas Conquistas
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ModalLayout
        isOpen={isDiagnosticModalOpen}
        onClose={handleDiagnosticModalClose}
        title="Novo Diagnóstico"
        size="xl"
      >
        <Diagnostico
          mode="modal"
          onComplete={handleDiagnosticModalClose}
        />
      </ModalLayout>
    </div>
  );
};

export default Dashboard;
