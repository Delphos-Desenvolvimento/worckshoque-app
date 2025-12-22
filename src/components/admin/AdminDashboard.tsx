import React from 'react';
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

const mockAdminUser = {
  name: 'Maria Silva',
  role: 'admin' as const,
  company: 'TechCorp'
};

const companyAchievements = [
  {
    id: '1',
    title: '100 Diagnósticos',
    description: 'Equipe realizou 100 diagnósticos',
    icon: 'trophy',
    level: 'gold' as const,
    unlocked: true,
    unlockedAt: new Date('2024-02-15')
  },
  {
    id: '2',
    title: '50 Colaboradores',
    description: '50 colaboradores cadastrados',
    icon: 'crown',
    level: 'diamond' as const,
    unlocked: false,
    progress: 32,
    maxProgress: 50
  }
];

const AdminDashboard = () => {
  return (
    <div className="space-y-8">
      <PageHeader
        title={`Dashboard Administrativo - ${mockAdminUser.company}`}
        description="Gerencie sua empresa e acompanhe o progresso da equipe"
        icon={Building}
        badges={[
          { label: "32 colaboradores", icon: Users },
          { label: "156 diagnósticos", icon: FileText },
          { label: "88% engajamento", icon: TrendingUp }
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

      <div className="container mx-auto px-4">{/* Removido py-8 */}

        {/* Company Stats */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Colaboradores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">32</div>
              <p className="text-xs text-muted-foreground">
                +3 este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diagnósticos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">
                +12 esta semana
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                3 concluídos este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engajamento</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">78%</div>
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
              <div className="text-2xl font-bold">5</div>
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
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <UserCheck className="h-8 w-8 text-green-500" />
                    <div>
                      <h4 className="font-medium">João Silva</h4>
                      <p className="text-sm text-muted-foreground">Completou diagnóstico de Clima</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Hoje</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Target className="h-8 w-8 text-blue-500" />
                    <div>
                      <h4 className="font-medium">Ana Costa</h4>
                      <p className="text-sm text-muted-foreground">Concluiu plano de Comunicação</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Ontem</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Award className="h-8 w-8 text-amber-500" />
                    <div>
                      <h4 className="font-medium">Equipe de Vendas</h4>
                      <p className="text-sm text-muted-foreground">Desbloqueou conquista coletiva</p>
                    </div>
                  </div>
                  <Badge variant="secondary">2 dias</Badge>
                </div>
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
                    <span className="text-sm text-muted-foreground">80%</span>
                  </div>
                  <Progress value={80} className="h-3" />
                  <p className="text-sm text-muted-foreground mt-1">
                    16 de 20 diagnósticos realizados
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Planos de Ação Concluídos</h4>
                    <span className="text-sm text-muted-foreground">60%</span>
                  </div>
                  <Progress value={60} className="h-3" />
                  <p className="text-sm text-muted-foreground mt-1">
                    12 de 20 planos concluídos
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Engajamento Geral</h4>
                    <span className="text-sm text-muted-foreground">78%</span>
                  </div>
                  <Progress value={78} className="h-3" />
                  <p className="text-sm text-muted-foreground mt-1">
                    25 de 32 colaboradores ativos
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
                  {companyAchievements.map((achievement) => (
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
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-primary font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">João Silva</p>
                    <p className="text-sm text-muted-foreground">5 diagnósticos</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-foreground font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Ana Costa</p>
                    <p className="text-sm text-muted-foreground">4 diagnósticos</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-foreground font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Carlos Santos</p>
                    <p className="text-sm text-muted-foreground">3 diagnósticos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;