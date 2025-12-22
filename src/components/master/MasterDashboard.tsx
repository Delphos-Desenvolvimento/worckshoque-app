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
}

const mockGlobalStats = {
  totalEmpresas: 12,
  totalUsuarios: 487,
  diagnosticosGlobais: 1543,
  receitaMensal: 45780,
  crescimentoMensal: 12.5,
  empresasAtivas: 11,
  planosAtivos: 156,
  conquistasDesbloqueadas: 890
};

const mockTopEmpresas = [
  { 
    id: '1', 
    nome: 'TechCorp Solutions', 
    usuarios: 89, 
    engajamento: 92, 
    receita: 12500,
    crescimento: 15.2
  },
  { 
    id: '2', 
    nome: 'InnovateHub', 
    usuarios: 67, 
    engajamento: 88, 
    receita: 9800,
    crescimento: 8.7
  },
  { 
    id: '3', 
    nome: 'GlobalTech Inc', 
    usuarios: 125, 
    engajamento: 85, 
    receita: 15200,
    crescimento: 22.1
  },
  { 
    id: '4', 
    nome: 'DataDriven Co', 
    usuarios: 45, 
    engajamento: 79, 
    receita: 6700,
    crescimento: -2.3
  }
];

const mockAtividadesRecentes = [
  {
    id: '1',
    tipo: 'nova_empresa',
    empresa: 'StartupTech',
    descricao: 'Nova empresa cadastrada no sistema',
    timestamp: '2024-01-20T10:30:00',
    icon: Building
  },
  {
    id: '2',
    tipo: 'receita',
    empresa: 'TechCorp Solutions',
    descricao: 'Pagamento processado - R$ 2.500',
    timestamp: '2024-01-20T09:15:00',
    icon: DollarSign
  },
  {
    id: '3',
    tipo: 'usuario',
    empresa: 'InnovateHub',
    descricao: '15 novos usuários adicionados',
    timestamp: '2024-01-19T16:45:00',
    icon: Users
  },
  {
    id: '4',
    tipo: 'diagnostico',
    empresa: 'GlobalTech Inc',
    descricao: '50 diagnósticos realizados hoje',
    timestamp: '2024-01-19T14:20:00',
    icon: FileText
  }
];

export default function MasterDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/reports/overview?period=all');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        toast.error('Erro ao carregar dados do dashboard. Usando dados locais.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
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

  // Use stats real se disponível, senão fallback para mock (parcialmente mapeado)
  const displayStats = stats ? {
    totalEmpresas: 12, // Backend não retorna isso ainda no overview padrão
    totalUsuarios: stats.users.total,
    diagnosticosGlobais: stats.diagnostics.total,
    receitaMensal: 45780, // Mock
    crescimentoMensal: 12.5, // Mock
    empresasAtivas: 11, // Mock
    planosAtivos: stats.actionPlans.total,
    conquistasDesbloqueadas: 890 // Mock
  } : mockGlobalStats;

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
                +{mockGlobalStats.crescimentoMensal}% em relação ao mês anterior
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
                +180 novos diagnósticos
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
                +19% desde o último mês
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
                +20.1% em relação ao mês anterior
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
                {mockTopEmpresas.map((empresa) => (
                  <div key={empresa.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <h4 className="font-medium">{empresa.nome}</h4>
                      <p className="text-sm text-muted-foreground">
                        {empresa.usuarios} usuários • {empresa.engajamento}% engajamento
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {formatCurrency(empresa.receita)}
                      </p>
                      <div className="flex items-center gap-1">
                        {empresa.crescimento > 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm ${empresa.crescimento > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {empresa.crescimento > 0 ? '+' : ''}{empresa.crescimento}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
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
                {mockAtividadesRecentes.map((atividade) => (
                  <div key={atividade.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(atividade.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{atividade.descricao}</p>
                      <p className="text-xs text-muted-foreground">{atividade.empresa}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(atividade.timestamp).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
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
                {mockGlobalStats.planosAtivos}
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
                {mockGlobalStats.conquistasDesbloqueadas}
              </div>
              <p className="text-sm text-muted-foreground">
                Conquistas desbloqueadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Crescimento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-2">
                +{mockGlobalStats.crescimentoMensal}%
              </div>
              <p className="text-sm text-muted-foreground">
                Crescimento mensal
              </p>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
