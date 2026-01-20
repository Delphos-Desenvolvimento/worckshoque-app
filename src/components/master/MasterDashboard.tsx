import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Building, 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Globe,
  Shield,
  Award,
  Activity,
  BarChart3,
  Crown,
  RefreshCw,
  Settings
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { api } from "@/lib/api";
import { toast } from "sonner";

// Interface para stats
interface DashboardStats {
  users: { total: number; active: number };
  diagnostics: { total: number; completed: number; processing: number; failed: number };
  actionPlans: { total: number; avgProgress: number };
  goals: { total: number; completed: number };
  contents: { total: number; totalViews: number; totalDownloads: number };
  notifications: { total: number; unread: number };
  activity: { total24h: number; logins24h: number };
  nps?: number;
  companies?: { total: number; active: number };
  revenue?: { mrr: number };
  achievements?: { totalUnlocked: number };
}

interface TopCompany {
  companyId: string;
  companyName: string;
  revenue: number;
  engagement: number;
  usersCount: number;
}

interface RecentActivity {
  id: string;
  type: string;
  company: string;
  description: string;
  timestamp: string;
}

export default function MasterDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topCompanies, setTopCompanies] = useState<TopCompany[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, companiesRes, activitiesRes] = await Promise.all([
          api.get('/reports/overview?period=all'),
          api.get('/reports/clients/top?limit=4'),
          api.get('/reports/activities/recent?limit=10')
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (companiesRes.ok) setTopCompanies(await companiesRes.json());
        if (activitiesRes.ok) setRecentActivities(await activitiesRes.json());
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados do dashboard.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getActivityIcon = (tipo: string) => {
    switch (tipo) {
      case 'nova_empresa': return <Building className="w-4 h-4 text-blue-500" />;
      case 'receita': return <DollarSign className="w-4 h-4 text-green-500" />;
      case 'usuario': return <Users className="w-4 h-4 text-purple-500" />;
      case 'diagnostico': return <FileText className="w-4 h-4 text-accent" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando dashboard...</div>;
  }

  // Use stats real se disponível
  const displayStats = stats ? {
    totalEmpresas: stats.companies?.total || 0,
    totalUsuarios: stats.users.total,
    diagnosticosGlobais: stats.diagnostics.total,
    receitaMensal: stats.revenue?.mrr || 0,
    empresasAtivas: stats.companies?.active || 0,
    planosAtivos: stats.actionPlans.total,
    conquistasDesbloqueadas: stats.achievements?.totalUnlocked || 0
  } : {
    totalEmpresas: 0,
    totalUsuarios: 0,
    diagnosticosGlobais: 0,
    receitaMensal: 0,
    empresasAtivas: 0,
    planosAtivos: 0,
    conquistasDesbloqueadas: 0
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard Global" 
        description="Visão geral do sistema e métricas principais"
        icon={Crown}
        actions={[
          {
            label: "Atualizar",
            icon: RefreshCw,
            onClick: () => window.location.reload(),
            variant: "secondary"
          },
          {
            label: "Configurações",
            icon: Settings,
            onClick: () => {},
            variant: "primary"
          }
        ]}
      />

      <div className="container mx-auto px-4">

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Usuários
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.totalUsuarios}</div>
              <p className="text-xs text-muted-foreground">
                Total de usuários cadastrados
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Diagnósticos
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.diagnosticosGlobais}</div>
              <p className="text-xs text-muted-foreground">
                Total de diagnósticos
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.planosAtivos}</div>
              <p className="text-xs text-muted-foreground">
                Planos em execução
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Receita Mensal
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(displayStats.receitaMensal)}</div>
              <p className="text-xs text-muted-foreground">
                MRR Atual
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Empresas & Atividades */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Top Empresas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCompanies.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhuma empresa encontrada.</p>
                ) : (
                  topCompanies.map((empresa) => (
                    <div key={empresa.companyId} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <h4 className="font-medium">{empresa.companyName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {empresa.usersCount} usuários • {empresa.engagement} atividades
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {formatCurrency(empresa.revenue)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Atividades Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhuma atividade recente.</p>
                ) : (
                  recentActivities.map((atividade) => (
                    <div key={atividade.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(atividade.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{atividade.description}</p>
                        <p className="text-xs text-muted-foreground">{atividade.company}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(atividade.timestamp).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas Adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Planos Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {displayStats.planosAtivos}
              </div>
              <p className="text-sm text-muted-foreground">
                Planos de ação em execução
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Conquistas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {displayStats.conquistasDesbloqueadas}
              </div>
              <p className="text-sm text-muted-foreground">
                Conquistas desbloqueadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Empresas Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {displayStats.empresasAtivas}
              </div>
              <p className="text-sm text-muted-foreground">
                Empresas ativas na plataforma
              </p>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
