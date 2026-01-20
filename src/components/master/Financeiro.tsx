import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  DollarSign, 
  Search, 
  Filter,
  Save,
  X,
  Eye,
  EyeOff,
  Users,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Download,
  RefreshCw,
  Clock,
  Activity,
  Brain,
  Zap,
  Home,
  Award,
  Trophy,
  Star,
  Crown,
  Flame,
  Zap as ZapIcon,
  Lightbulb,
  BookOpen,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  PieChart,
  LineChart,
  BarChart,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Target,
  Building,
  User,
  FileText,
  Percent,
  ArrowUp,
  ArrowDown,
  Minus,
  CreditCard,
  Banknote,
  Receipt,
  Wallet,
  PiggyBank,
  TrendingUp as UpIcon,
  TrendingDown as DownIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/contexts/PermissionsContext';
import PageHeader from '@/components/common/PageHeader';
import { api } from '@/lib/api';

// Interfaces
interface Transacao {
  id: string;
  tipo: 'receita' | 'despesa' | 'reembolso' | 'assinatura' | 'pagamento';
  categoria: 'assinatura' | 'publicidade' | 'infraestrutura' | 'pessoal' | 'marketing' | 'outros';
  descricao: string;
  valor: number;
  status: 'pendente' | 'processando' | 'aprovado' | 'rejeitado' | 'cancelado';
  data: string;
  empresa: {
    id: string;
    nome: string;
    cnpj: string;
  };
  metodoPagamento: 'cartao' | 'pix' | 'boleto' | 'transferencia' | 'paypal';
  referencia: string;
  observacoes?: string;
}

interface Assinatura {
  id: string;
  empresa: {
    id: string;
    nome: string;
    cnpj: string;
  };
  plano: 'basico' | 'premium' | 'enterprise';
  valor: number;
  status: 'ativa' | 'suspensa' | 'cancelada' | 'vencida';
  dataInicio: string;
  dataVencimento: string;
  proximaCobranca: string;
  ciclo: 'mensal' | 'trimestral' | 'anual';
  desconto: number;
  valorComDesconto: number;
  observacoes?: string;
}

interface MetricaFinanceira {
  nome: string;
  valor: number;
  variacao: number;
  tendencia: 'up' | 'down' | 'stable';
  icone: React.ComponentType<{ className?: string }>;
  cor: string;
}

export default function Financeiro() {
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Estados principais
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [metricas, setMetricas] = useState<MetricaFinanceira[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<'all' | Transacao['tipo']>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | Transacao['status']>('all');
  const [filterCategoria, setFilterCategoria] = useState<'all' | Transacao['categoria']>('all');
  
  // Estados para modais
  const [selectedTransacao, setSelectedTransacao] = useState<Transacao | null>(null);
  const [selectedAssinatura, setSelectedAssinatura] = useState<Assinatura | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);

      const [txRes, subRes, summaryRes] = await Promise.all([
        api.get('/reports/financial/transactions?limit=100'),
        api.get('/reports/financial/subscriptions?limit=100'),
        api.get('/reports/financial/summary')
      ]);

      if (!txRes.ok || !subRes.ok || !summaryRes.ok) throw new Error('Falha ao carregar dados');

      const txData = await txRes.json();
      const subData = await subRes.json();
      const summaryData = await summaryRes.json();

      // Mapeamento de dados
      const mapTipo = (t: string) => {
        const map: Record<string, string> = { 'revenue': 'receita', 'expense': 'despesa', 'refund': 'reembolso', 'subscription': 'assinatura', 'payment': 'pagamento' };
        return map[t] || t;
      };
      const mapCat = (c: string) => {
        const map: Record<string, string> = { 'subscription': 'assinatura', 'infrastructure': 'infraestrutura', 'marketing': 'marketing', 'personnel': 'pessoal' };
        return map[c] || c;
      };
      const mapStatus = (s: string) => {
        const map: Record<string, string> = { 'approved': 'aprovado', 'processing': 'processando', 'pending': 'pendente', 'rejected': 'rejeitado', 'cancelled': 'cancelado' };
        return map[s] || s;
      };
      const mapSubStatus = (s: string) => {
        const map: Record<string, string> = { 'active': 'ativa', 'suspended': 'suspensa', 'cancelled': 'cancelada', 'overdue': 'vencida' };
        return map[s] || s;
      };

      setTransacoes(txData.data.map((t: Transacao & { tipo: string; categoria: string; status: string }) => ({
        ...t,
        tipo: mapTipo(t.tipo) as Transacao['tipo'],
        categoria: mapCat(t.categoria) as Transacao['categoria'],
        status: mapStatus(t.status) as Transacao['status'],
        valor: Number(t.valor)
      })));

      setAssinaturas(subData.data.map((s: Assinatura & { status: string }) => ({
        ...s,
        status: mapSubStatus(s.status) as Assinatura['status'],
        valor: Number(s.valor),
        valorComDesconto: Number(s.valorComDesconto)
      })));

      setMetricas([
        {
          nome: 'Receita Mensal (MRR)',
          valor: summaryData.mrr,
          variacao: 0, // Backend needs to provide trend
          tendencia: 'stable',
          icone: DollarSign,
          cor: 'text-green-600'
        },
        {
          nome: 'Receita Total',
          valor: summaryData.revenue,
          variacao: 0,
          tendencia: 'up',
          icone: TrendingUp,
          cor: 'text-blue-600'
        },
        {
          nome: 'Assinaturas Ativas',
          valor: summaryData.activeSubsCount || subData.meta.total, // fallback
          variacao: 0,
          tendencia: 'stable',
          icone: Users,
          cor: 'text-purple-600'
        },
        {
          nome: 'Taxa de Churn',
          valor: summaryData.churnRate * 100,
          variacao: 0,
          tendencia: 'down',
          icone: TrendingDown,
          cor: 'text-orange-600'
        }
      ]);

    } catch (error) {
      console.error('Erro ao carregar financeiro:', error);
      // Fallback to empty or toast error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  // Filtrar transações
  const filteredTransacoes = transacoes.filter(transacao => {
    const matchesSearch = transacao.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transacao.empresa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transacao.referencia.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipo === 'all' || transacao.tipo === filterTipo;
    const matchesStatus = filterStatus === 'all' || transacao.status === filterStatus;
    const matchesCategoria = filterCategoria === 'all' || transacao.categoria === filterCategoria;
    return matchesSearch && matchesTipo && matchesStatus && matchesCategoria;
  });

  // Funções
  const openViewModal = (transacao: Transacao) => {
    setSelectedTransacao(transacao);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = (transacao: Transacao) => {
    setSelectedTransacao(transacao);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteTransacao = () => {
    if (!selectedTransacao) return;
    
    setTransacoes(transacoes.filter(t => t.id !== selectedTransacao.id));
    setIsDeleteModalOpen(false);
    setSelectedTransacao(null);
  };

  // Ações do cabeçalho
  const handleExport = () => {
    // Placeholder de exportação: futuramente gerar CSV/Excel
    // Por enquanto apenas loga a ação
    console.log('Exportar dados financeiros');
  };

  const handleRefresh = () => {
    fetchFinancialData();
    toast.success('Dados atualizados com sucesso!');
  };

  // Função para obter cor do status
  const getStatusColor = (status: Transacao['status']) => {
    switch (status) {
      case 'aprovado': return 'default';
      case 'processando': return 'outline';
      case 'pendente': return 'secondary';
      case 'rejeitado': return 'destructive';
      case 'cancelado': return 'destructive';
      default: return 'outline';
    }
  };

  // Função para obter cor do tipo
  const getTipoColor = (tipo: Transacao['tipo']) => {
    switch (tipo) {
      case 'receita': return 'default';
      case 'despesa': return 'destructive';
      case 'reembolso': return 'outline';
      case 'assinatura': return 'secondary';
      case 'pagamento': return 'default';
      default: return 'outline';
    }
  };

  // Função para obter ícone do tipo
  const getTipoIcon = (tipo: Transacao['tipo']) => {
    switch (tipo) {
      case 'receita': return TrendingUp;
      case 'despesa': return TrendingDown;
      case 'reembolso': return RotateCcw;
      case 'assinatura': return CreditCard;
      case 'pagamento': return Banknote;
      default: return DollarSign;
    }
  };

  // Função para obter cor do status da assinatura
  const getAssinaturaStatusColor = (status: Assinatura['status']) => {
    switch (status) {
      case 'ativa': return 'default';
      case 'suspensa': return 'destructive';
      case 'cancelada': return 'secondary';
      case 'vencida': return 'destructive';
      default: return 'outline';
    }
  };

  // Função para obter cor do plano
  const getPlanoColor = (plano: Assinatura['plano']) => {
    switch (plano) {
      case 'basico': return 'outline';
      case 'premium': return 'default';
      case 'enterprise': return 'destructive';
      default: return 'outline';
    }
  };

  // Função para formatar valor
  const formatValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  if (!hasPermission('financeiro.view')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Acesso Negado</h3>
          <p className="text-muted-foreground">Você não tem permissão para visualizar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho padrão */}
      <PageHeader
        title="Financeiro"
        description="Controle financeiro e gestão de assinaturas"
        icon={DollarSign}
        actions={[
          {
            label: 'Exportar',
            icon: Download,
            onClick: handleExport,
            variant: 'secondary'
          },
          {
            label: 'Atualizar',
            icon: RefreshCw,
            onClick: handleRefresh,
            variant: 'primary'
          }
        ]}
      />
      <div className="container mx-auto px-4">
        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metricas.map((metrica, index) => {
            const Icon = metrica.icone;
            return (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Icon className={`h-4 w-4 ${metrica.cor}`} />
                    <div className="ml-2">
                      <p className="text-sm font-medium text-muted-foreground">{metrica.nome}</p>
                      <p className="text-2xl font-bold">
                        {metrica.nome.includes('Taxa') ? `${metrica.valor}%` : formatValor(metrica.valor)}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {metrica.tendencia === 'up' ? (
                          <ArrowUp className="w-3 h-3 text-green-500" />
                        ) : metrica.tendencia === 'down' ? (
                          <ArrowDown className="w-3 h-3 text-red-500" />
                        ) : (
                          <Minus className="w-3 h-3 text-gray-500" />
                        )}
                        <span className={`text-xs ${metrica.tendencia === 'up' ? 'text-green-500' : metrica.tendencia === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                          {metrica.variacao > 0 ? '+' : ''}{metrica.variacao}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-card rounded-xl border border-border shadow-sm p-2 mb-6">
            <TabsList className="grid w-full grid-cols-3 bg-transparent h-12">
              <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg">
                <BarChart3 className="w-4 h-4" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="transacoes" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg">
                <Receipt className="w-4 h-4" />
                Transações
              </TabsTrigger>
              <TabsTrigger value="assinaturas" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg">
                <CreditCard className="w-4 h-4" />
                Assinaturas
              </TabsTrigger>
            </TabsList>
          </div>

        {/* TAB 1: Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Receita por Categoria</CardTitle>
                <CardDescription>Distribuição da receita por tipo de transação</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Assinaturas</span>
                    </div>
                    <span className="font-medium">{formatValor(3000.00)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Pagamentos</span>
                    </div>
                    <span className="font-medium">{formatValor(1200.00)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm">Reembolsos</span>
                    </div>
                    <span className="font-medium">{formatValor(200.00)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status das Assinaturas</CardTitle>
                <CardDescription>Distribuição por status atual</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Ativas</span>
                    </div>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Suspensas</span>
                    </div>
                    <span className="font-medium">2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <span className="text-sm">Canceladas</span>
                    </div>
                    <span className="font-medium">1</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: Transações */}
        <TabsContent value="transacoes" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Transações Financeiras</h2>
              <p className="text-muted-foreground">
                Histórico de todas as transações do sistema
              </p>
            </div>
          </div>

          {/* Filtros para Transações */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar transações..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterTipo} onValueChange={(value) => setFilterTipo(value as "all" | "receita" | "despesa" | "reembolso" | "assinatura" | "pagamento")}>
                  <SelectTrigger className="w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                    <SelectItem value="reembolso">Reembolso</SelectItem>
                    <SelectItem value="assinatura">Assinatura</SelectItem>
                    <SelectItem value="pagamento">Pagamento</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as "all" | "pendente" | "processando" | "aprovado" | "rejeitado" | "cancelado")}>
                  <SelectTrigger className="w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="processando">Processando</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCategoria} onValueChange={(value) => setFilterCategoria(value as "all" | "assinatura" | "publicidade" | "infraestrutura" | "pessoal" | "marketing" | "outros")}>
                  <SelectTrigger className="w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    <SelectItem value="assinatura">Assinatura</SelectItem>
                    <SelectItem value="publicidade">Publicidade</SelectItem>
                    <SelectItem value="infraestrutura">Infraestrutura</SelectItem>
                    <SelectItem value="pessoal">Pessoal</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Transações */}
          <div className="grid gap-4">
            {filteredTransacoes.map((transacao) => {
              const TipoIcon = getTipoIcon(transacao.tipo);
              
              return (
                <Card key={transacao.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <TipoIcon className="w-5 h-5 text-muted-foreground" />
                          <h3 className="text-lg font-semibold">{transacao.descricao}</h3>
                          <Badge variant={getTipoColor(transacao.tipo)}>
                            {transacao.tipo.toUpperCase()}
                          </Badge>
                          <Badge variant={getStatusColor(transacao.status)}>
                            {transacao.status.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {transacao.categoria.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{transacao.empresa.nome}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {new Date(transacao.data).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{transacao.metodoPagamento.toUpperCase()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{transacao.referencia}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className={`text-2xl font-bold ${transacao.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                              {transacao.tipo === 'receita' ? '+' : '-'}{formatValor(transacao.valor)}
                            </p>
                            <p className="text-sm text-muted-foreground">Valor</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{transacao.empresa.nome}</p>
                            <p className="text-sm text-muted-foreground">Empresa</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">{transacao.metodoPagamento.toUpperCase()}</p>
                            <p className="text-sm text-muted-foreground">Método</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-orange-600">{transacao.referencia}</p>
                            <p className="text-sm text-muted-foreground">Referência</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        {hasPermission('financeiro.view') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openViewModal(transacao)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        {hasPermission('financeiro.manage') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteModal(transacao)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 3: Assinaturas */}
        <TabsContent value="assinaturas" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Assinaturas</h2>
              <p className="text-muted-foreground">
                Gestão de assinaturas e cobranças
              </p>
            </div>
          </div>

          {/* Lista de Assinaturas */}
          <div className="grid gap-4">
            {assinaturas.map((assinatura) => (
              <Card key={assinatura.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="w-5 h-5 text-muted-foreground" />
                        <h3 className="text-lg font-semibold">{assinatura.empresa.nome}</h3>
                        <Badge variant={getPlanoColor(assinatura.plano)}>
                          {assinatura.plano.toUpperCase()}
                        </Badge>
                        <Badge variant={getAssinaturaStatusColor(assinatura.status)}>
                          {assinatura.status.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {assinatura.ciclo.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Início: {new Date(assinatura.dataInicio).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Vencimento: {new Date(assinatura.dataVencimento).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Próxima: {new Date(assinatura.proximaCobranca).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Desconto: {assinatura.desconto}%
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{formatValor(assinatura.valor)}</p>
                          <p className="text-sm text-muted-foreground">Valor Original</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{formatValor(assinatura.valorComDesconto)}</p>
                          <p className="text-sm text-muted-foreground">Valor Final</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">{assinatura.desconto}%</p>
                          <p className="text-sm text-muted-foreground">Desconto</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">{assinatura.ciclo.toUpperCase()}</p>
                          <p className="text-sm text-muted-foreground">Ciclo</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {hasPermission('financeiro.view') && (
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {hasPermission('financeiro.manage') && (
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Visualização */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Transação</DialogTitle>
            <DialogDescription>
              Informações completas da transação
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransacao && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Descrição</Label>
                  <p className="text-sm text-muted-foreground">{selectedTransacao.descricao}</p>
                </div>
                <div>
                  <Label className="font-medium">Valor</Label>
                  <p className="text-2xl font-bold text-green-600">{formatValor(selectedTransacao.valor)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Tipo</Label>
                  <Badge variant={getTipoColor(selectedTransacao.tipo)} className="mt-1">
                    {selectedTransacao.tipo.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="font-medium">Status</Label>
                  <Badge variant={getStatusColor(selectedTransacao.status)} className="mt-1">
                    {selectedTransacao.status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Empresa</Label>
                  <p className="text-sm text-muted-foreground">{selectedTransacao.empresa.nome}</p>
                  <p className="text-sm text-muted-foreground">{selectedTransacao.empresa.cnpj}</p>
                </div>
                <div>
                  <Label className="font-medium">Método de Pagamento</Label>
                  <p className="text-sm text-muted-foreground">{selectedTransacao.metodoPagamento.toUpperCase()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Data</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedTransacao.data).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <Label className="font-medium">Referência</Label>
                  <p className="text-sm text-muted-foreground">{selectedTransacao.referencia}</p>
                </div>
              </div>

              {selectedTransacao.observacoes && (
                <div>
                  <Label className="font-medium">Observações</Label>
                  <p className="text-sm text-muted-foreground mt-2">{selectedTransacao.observacoes}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Transação</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a transação "{selectedTransacao?.descricao}"? 
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteTransacao}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}







