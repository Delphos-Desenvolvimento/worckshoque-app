import React, { useEffect, useState } from 'react';
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

interface DashboardData {
  stats: {
    diagnostics: number;
    activePlans: number;
    achievements: number;
    ranking: number;
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
}

const Dashboard = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Em um cenário real ideal, teríamos um endpoint unificado /user/dashboard
        // Como não temos, vamos buscar em paralelo
        const [diagnosticsRes, plansRes] = await Promise.all([
          api.get('/diagnostics'),
          api.get('/action-plans'), // Assumindo endpoint de planos do usuário
        ]);

        // Tratamento simplificado: se falhar, usa array vazio
        const diagnostics = diagnosticsRes.ok ? await diagnosticsRes.json() : [];
        // const plans = plansRes.ok ? await plansRes.json() : []; 

        // Mock parcial enquanto endpoints não retornam tudo perfeitamente
        setData({
          stats: {
            diagnostics: diagnostics.length,
            activePlans: 2, // Mock
            achievements: 2, // Mock
            ranking: 5 // Mock
          },
          recentDiagnostics: diagnostics.slice(0, 3),
          activePlans: [
            { id: '1', title: 'Melhorar Comunicação', progress: 70, totalTasks: 10, completedTasks: 7 },
            { id: '2', title: 'Feedback Semanal', progress: 30, totalTasks: 8, completedTasks: 3 }
          ],
          recentAchievements: [
            { id: '1', title: 'Primeiro Diagnóstico', description: 'Você concluiu seu primeiro diagnóstico.', icon: 'target', level: 'bronze', unlocked: true },
            { id: '3', title: '7 Dias Seguidos', description: 'Você acessou por 7 dias consecutivos.', icon: 'zap', level: 'gold', unlocked: true }
          ]
        });

      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        toast.error('Erro ao carregar informações do dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = data?.stats || { diagnostics: 0, activePlans: 0, achievements: 0, ranking: 0 };

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Bem-vindo, ${user?.name || 'Usuário'}! 👋`}
        description="Aqui está um resumo do seu progresso no WorkChoque"
        icon={LayoutDashboard}
        badges={[
          { label: `${stats.diagnostics} diagnósticos realizados`, icon: FileText },
          { label: "Nível 5", icon: Trophy },
          { label: "85% de progresso", icon: TrendingUp }
        ]}
        actions={[
          { 
            label: "Novo Diagnóstico", 
            icon: Plus, 
            onClick: () => console.log('Iniciando novo diagnóstico...'),
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
                
                <Button variant="outline" className="w-full" size="lg">
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
                <Button variant="outline" className="w-full mt-4" size="sm">
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
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Novo Diagnóstico
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  Ver Ranking
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Trophy className="mr-2 h-4 w-4" />
                  Minhas Conquistas
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
