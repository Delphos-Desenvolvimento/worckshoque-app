import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Grid3X3, List, Calendar, BarChart3, Plus, TrendingUp, TrendingDown, Minus, ArrowLeft, Share2, Download, Target } from 'lucide-react';
import ModalLayout from '@/components/common/ModalLayout';
import PageHeader from '@/components/common/PageHeader';
import DiagnosticGrid from '@/components/common/DiagnosticGrid';
import DiagnosticList from '@/components/common/DiagnosticList';
import DiagnosticTimeline from '@/components/common/DiagnosticTimeline';
import { listDiagnostics } from '@/lib/diagnostics-api';
import DiagnosticoModal from '@/components/site/DiagnosticoModal';

// Interface unificada para diagnósticos
interface DiagnosticData {
  id: string;
  questionnaire_id: string;
  questionnaire: {
    id: string;
    title: string;
    type: string;
  };
  insights: string[];
  recommendations: string[];
  areas_focus: string[];
  score_intelligent: number;
  status: string;
  generated_at: string;
  completed_at: string | null;
  analysis_data: Record<string, unknown>;
  user?: { id: string; name: string; email: string } | null;
}

const Diagnosticos = () => {
  const { token, user } = useAuthStore();
  const [diagnostics, setDiagnostics] = useState<DiagnosticData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para navegação de páginas
  const [selectedDiagnostic, setSelectedDiagnostic] = useState<DiagnosticData | null>(null);
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
  const [isDiagnosticoModalOpen, setIsDiagnosticoModalOpen] = useState(false);
  
  // Estados para filtros e visualização (apenas para lista)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar diagnósticos
  const loadDiagnostics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar token antes de fazer requisição
      const currentToken = useAuthStore.getState().token;
      if (!token && !currentToken) {
        throw new Error('Token de autenticação não encontrado. Por favor, faça login novamente.');
      }
      
      const data = await listDiagnostics();
      
      // Verificar se data é um array antes de fazer set
      if (!Array.isArray(data)) {
        console.error('Resposta da API não é um array:', data);
        throw new Error('Formato de dados inválido recebido do servidor');
      }
      
      setDiagnostics(data as unknown as DiagnosticData[]);
    } catch (error: unknown) {
      console.error('Erro ao carregar diagnósticos:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar diagnósticos';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Carregar diagnósticos ao montar o componente
  useEffect(() => {
    if (token) {
      loadDiagnostics();
    }
  }, [token, loadDiagnostics]);

  // Persistir modo de visualização no localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('diagnostics-view-mode');
    if (savedViewMode && ['grid', 'list', 'timeline'].includes(savedViewMode)) {
      setViewMode(savedViewMode as 'grid' | 'list' | 'timeline');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('diagnostics-view-mode', viewMode);
  }, [viewMode]);

  // Filtrar e ordenar diagnósticos
  const filteredAndSortedDiagnostics = useMemo(() => {
    let filtered = diagnostics;

    // Filtro por categoria (baseado no score)
    if (filterCategory !== 'all') {
      filtered = filtered.filter(d => {
        const category = d.score_intelligent >= 80 ? 'excelente' : 
                        d.score_intelligent >= 60 ? 'bom' : 
                        d.score_intelligent >= 40 ? 'regular' : 'crítico';
        return category === filterCategory.toLowerCase();
      });
    }

    // Filtro por status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(d => d.status === filterStatus);
    }

    // Filtro por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(d => {
        const category = d.score_intelligent >= 80 ? 'excelente' : 
                        d.score_intelligent >= 60 ? 'bom' : 
                        d.score_intelligent >= 40 ? 'regular' : 'crítico';
        return d.questionnaire.title.toLowerCase().includes(term) ||
               category.toLowerCase().includes(term) ||
               d.questionnaire.type.toLowerCase().includes(term);
      });
    }

    // Ordenação
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.generated_at).getTime() - new Date(b.generated_at).getTime();
          break;
        case 'score':
          comparison = a.score_intelligent - b.score_intelligent;
          break;
        case 'category': {
          const aCat = a.score_intelligent >= 80 ? 'excelente' : a.score_intelligent >= 60 ? 'bom' : a.score_intelligent >= 40 ? 'regular' : 'crítico';
          const bCat = b.score_intelligent >= 80 ? 'excelente' : b.score_intelligent >= 60 ? 'bom' : b.score_intelligent >= 40 ? 'regular' : 'crítico';
          comparison = aCat.localeCompare(bCat);
          break;
        }
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [diagnostics, filterCategory, filterStatus, searchTerm, sortBy, sortOrder]);

  // Handlers
  const handleViewDiagnostic = (diagnostic: Diagnostic) => {
    setSelectedDiagnostic(diagnostic);
    setCurrentView('detail');
  };

  const handleBackToList = () => {
    setSelectedDiagnostic(null);
    setCurrentView('list');
  };

  const handleRefresh = () => {
    loadDiagnostics();
  };

  const handleNewDiagnostic = () => {
    setIsDiagnosticoModalOpen(true);
  };

  const handleDiagnosticoModalClose = () => {
    setIsDiagnosticoModalOpen(false);
    // Recarregar diagnósticos após fechar o modal (caso tenha criado um novo)
    loadDiagnostics();
  };

  // Estatísticas
  const stats = useMemo(() => {
    if (diagnostics.length === 0) return null;

    const total = diagnostics.length;
    const avgScore = Math.round(diagnostics.reduce((sum, d) => sum + d.score_intelligent, 0) / total);
    const excellent = diagnostics.filter(d => d.score_intelligent >= 80).length;
    const critical = diagnostics.filter(d => d.score_intelligent < 40).length;
    const completed = diagnostics.filter(d => d.status === 'completed').length;

    return { total, avgScore, excellent, critical, completed };
  }, [diagnostics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando diagnósticos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Erro ao carregar diagnósticos</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  // Renderizar visualização de detalhes
  if (currentView === 'detail' && selectedDiagnostic) {
  return (
    <div className="space-y-6">
        {/* Breadcrumb e navegação */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleBackToList} 
              variant="ghost" 
              size="sm"
              className="hover:bg-muted"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Diagnósticos
            </Button>
            <div className="text-sm text-muted-foreground">
              Diagnósticos › {selectedDiagnostic.questionnaire.title}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar PDF
          </Button>
        </div>
      </div>

        {/* Conteúdo dos detalhes */}
        <DiagnosticDetailView diagnostic={selectedDiagnostic} />
      </div>
    );
  }

  // Renderizar lista de diagnósticos
  return (
    <div className="space-y-6">
      <PageHeader
        title="Diagnósticos"
        description="Acompanhe seus diagnósticos e evolução com análise de IA"
        icon={BarChart3}
        badges={[
          { label: "Powered by AI", icon: TrendingUp },
          ...(stats ? [{ label: `${stats.total} diagnósticos`, icon: BarChart3 }] : [])
        ]}
        actions={[
          { 
            label: "Novo Diagnóstico", 
            icon: Plus, 
            onClick: handleNewDiagnostic,
            variant: 'primary' as const
          }
        ]}
        stats={stats ? [
          {
            label: "Total",
            value: stats.total,
            description: "diagnósticos realizados",
            icon: BarChart3
          },
          {
            label: "Score Médio",
            value: `${stats.avgScore}%`,
            description: "pontuação média",
            icon: TrendingUp
          },
          {
            label: "Excelentes",
            value: stats.excellent,
            description: "diagnósticos excelentes",
            color: "bg-green-500"
          },
          {
            label: "Críticos",
            value: stats.critical,
            description: "diagnósticos críticos",
            color: "bg-red-500"
          }
        ] : []}
      />

      <div className="container mx-auto px-4">

        {/* Controles */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
            {/* Busca */}
            <div className="relative flex-1 max-w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar diagnósticos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros */}
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="excelente">Excelente</SelectItem>
                <SelectItem value="bom">Bom</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="crítico">Crítico</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="completed">Completo</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
              </SelectContent>
            </Select>

            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortBy(field as 'date' | 'score' | 'category');
              setSortOrder(order as 'asc' | 'desc');
            }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Mais recente</SelectItem>
                <SelectItem value="date-asc">Mais antigo</SelectItem>
                <SelectItem value="score-desc">Maior score</SelectItem>
                <SelectItem value="score-asc">Menor score</SelectItem>
                <SelectItem value="category-asc">Categoria A-Z</SelectItem>
                <SelectItem value="category-desc">Categoria Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

          {/* Modos de visualização */}
          <div className="flex items-center gap-2 mt-4 lg:mt-0">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'list' | 'timeline')}>
              <TabsList>
                <TabsTrigger value="grid" className="p-2">
                  <Grid3X3 className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="list" className="p-2">
                  <List className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="timeline" className="p-2">
                  <Calendar className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

      {/* Conteúdo */}
      {filteredAndSortedDiagnostics.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || filterCategory !== 'all' || filterStatus !== 'all' 
                ? 'Nenhum diagnóstico encontrado' 
                : 'Nenhum diagnóstico realizado'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
                ? 'Tente ajustar os filtros para encontrar seus diagnósticos.'
                : 'Realize seu primeiro diagnóstico para começar a acompanhar sua evolução.'}
            </p>
            {!searchTerm && filterCategory === 'all' && filterStatus === 'all' && (
              <Button onClick={handleNewDiagnostic} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Fazer Diagnóstico
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          {viewMode === 'grid' && (
            <DiagnosticGrid 
              diagnostics={filteredAndSortedDiagnostics}
              onViewDiagnostic={handleViewDiagnostic}
              showOwner={user?.role === 'master' || user?.role === 'admin'}
            />
          )}
          {viewMode === 'list' && (
            <DiagnosticList 
              diagnostics={filteredAndSortedDiagnostics}
              onViewDiagnostic={handleViewDiagnostic}
              showOwner={user?.role === 'master' || user?.role === 'admin'}
            />
          )}
          {viewMode === 'timeline' && (
            <DiagnosticTimeline 
              diagnostics={filteredAndSortedDiagnostics}
              onViewDiagnostic={handleViewDiagnostic}
              showOwner={user?.role === 'master' || user?.role === 'admin'}
            />
          )}
        </>
      )}

      </div>

      {/* Modal de Novo Diagnóstico */}
      <DiagnosticoModal 
        isOpen={isDiagnosticoModalOpen}
        onClose={handleDiagnosticoModalClose}
      />
    </div>
  );
};

// Componente inline para detalhes do diagnóstico
const DiagnosticDetailView = ({ diagnostic }: { diagnostic: DiagnosticData }) => {
  const getScoreCategory = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Regular';
    return 'Crítico';
  };

  const getCategoryColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header profissional do diagnóstico */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 rounded-xl border shadow-lg">
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* Informações principais */}
            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold text-primary">
                    {diagnostic.questionnaire.title}
                  </h1>
                  <Badge 
                    className={`${getCategoryColor(diagnostic.score_intelligent)} text-white px-3 py-1 text-sm font-medium shadow-sm hover:shadow-md transition-shadow`}
                  >
                    {getScoreCategory(diagnostic.score_intelligent)}
                  </Badge>
                </div>
                <div className="flex items-center space-x-6 text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-sm font-medium">Tipo: {diagnostic.questionnaire.type}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">{formatDate(diagnostic.generated_at)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Processado com IA</span>
                  </div>
                </div>
              </div>
              
              {/* Métricas rápidas */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="bg-background/50 rounded-lg p-4 border hover:shadow-md transition-all duration-300">
                  <div className="text-2xl font-bold text-primary">{diagnostic.insights.length}</div>
                  <div className="text-sm text-muted-foreground">Insights Identificados</div>
                </div>
                <div className="bg-background/50 rounded-lg p-4 border hover:shadow-md transition-all duration-300">
                  <div className="text-2xl font-bold text-accent">{diagnostic.recommendations.length}</div>
                  <div className="text-sm text-muted-foreground">Recomendações</div>
                </div>
                <div className="bg-background/50 rounded-lg p-4 border hover:shadow-md transition-all duration-300">
                  <div className="text-2xl font-bold text-orange-600">{diagnostic.areas_focus.length}</div>
                  <div className="text-sm text-muted-foreground">Áreas Prioritárias</div>
                </div>
              </div>
            </div>

            {/* Score circular animado */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="w-32 h-32">
                  <svg className="w-32 h-32 -rotate-90 drop-shadow-lg" viewBox="0 0 36 36">
                    {/* Background circle */}
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-muted/30"
                    />
                    {/* Progress circle */}
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="url(#scoreGradient)"
                      strokeWidth="3"
                      strokeDasharray={`${diagnostic.score_intelligent}, 100`}
                      strokeLinecap="round"
                      className="drop-shadow-sm"
                      style={{
                        animation: 'drawCircle 2s ease-out forwards'
                      }}
                    />
                    {/* Gradient definition */}
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(var(--accent))" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                      {diagnostic.score_intelligent}%
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">Score da IA</span>
                  </div>
                </div>
                
                {/* Indicador de categoria */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium text-white shadow-lg ${getCategoryColor(diagnostic.score_intelligent)}`}>
                    {getScoreCategory(diagnostic.score_intelligent)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs com conteúdo detalhado */}
      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          <TabsTrigger value="areas">Áreas de Foco</TabsTrigger>
          <TabsTrigger value="analysis">Análise Completa</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {diagnostic.insights.map((insight, index) => {
              const isHighPriority = insight.toLowerCase().includes('crítico') || insight.toLowerCase().includes('urgente');
              const isMediumPriority = insight.toLowerCase().includes('importante') || insight.toLowerCase().includes('atenção');
              
              return (
                <Card 
                  key={index} 
                  className={`group hover:shadow-lg transition-all duration-300 border-l-4 ${
                    isHighPriority 
                      ? 'border-l-red-500 bg-red-50/50 hover:bg-red-50' 
                      : isMediumPriority 
                        ? 'border-l-yellow-500 bg-yellow-50/50 hover:bg-yellow-50'
                        : 'border-l-blue-500 bg-blue-50/50 hover:bg-blue-50'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Ícone e número */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform ${
                        isHighPriority 
                          ? 'bg-red-500 text-white' 
                          : isMediumPriority 
                            ? 'bg-yellow-500 text-white'
                            : 'bg-blue-500 text-white'
                      }`}>
                        <span className="text-sm font-bold">{index + 1}</span>
                      </div>
                      
                      {/* Conteúdo */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-foreground">
                            Insight #{index + 1}
                          </h4>
                          {isHighPriority && (
                            <Badge variant="destructive" className="text-xs">Alta Prioridade</Badge>
                          )}
                          {isMediumPriority && (
                            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Média Prioridade</Badge>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors">
                          {insight}
                        </p>
                        
                        {/* Indicador visual de categoria */}
                        <div className="flex items-center space-x-2 pt-2">
                          <div className={`w-2 h-2 rounded-full ${
                            isHighPriority ? 'bg-red-500' : isMediumPriority ? 'bg-yellow-500' : 'bg-blue-500'
                          }`}></div>
                          <span className="text-xs text-muted-foreground">
                            {isHighPriority ? 'Requer ação imediata' : isMediumPriority ? 'Atenção necessária' : 'Para consideração'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {diagnostic.recommendations.map((recommendation, index) => {
              const isUrgent = recommendation.toLowerCase().includes('imediata') || recommendation.toLowerCase().includes('urgente');
              const isImportant = recommendation.toLowerCase().includes('importante') || recommendation.toLowerCase().includes('prioridade');
              
              return (
                <Card 
                  key={index} 
                  className={`group hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 ${
                    isUrgent 
                      ? 'border-l-red-500 hover:border-l-red-600 bg-gradient-to-br from-red-50/50 to-background' 
                      : isImportant 
                        ? 'border-l-orange-500 hover:border-l-orange-600 bg-gradient-to-br from-orange-50/50 to-background'
                        : 'border-l-green-500 hover:border-l-green-600 bg-gradient-to-br from-green-50/50 to-background'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header da recomendação */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${
                            isUrgent 
                              ? 'bg-red-500 text-white' 
                              : isImportant 
                                ? 'bg-orange-500 text-white'
                                : 'bg-green-500 text-white'
                          }`}>
                            <Target className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">Ação #{index + 1}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              {isUrgent && (
                                <Badge variant="destructive" className="text-xs">Urgente</Badge>
                              )}
                              {isImportant && !isUrgent && (
                                <Badge className="text-xs bg-orange-500 text-white">Importante</Badge>
                              )}
                              {!isUrgent && !isImportant && (
                                <Badge className="text-xs bg-green-500 text-white">Recomendado</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Indicador de impacto */}
                        <div className="text-right">
                          <div className={`w-3 h-3 rounded-full ${
                            isUrgent ? 'bg-red-500' : isImportant ? 'bg-orange-500' : 'bg-green-500'
                          } animate-pulse`}></div>
                        </div>
                      </div>
                      
                      {/* Conteúdo da recomendação */}
                      <div className="bg-background/70 rounded-lg p-4 border group-hover:bg-background transition-colors">
                        <p className="text-sm leading-relaxed text-foreground">
                          {recommendation}
                        </p>
                      </div>
                      
                      {/* Footer com estimativa */}
                      <div className="flex items-center justify-between pt-2 border-t border-muted/50">
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {isUrgent ? 'Implementar em 1-2 semanas' : isImportant ? 'Implementar em 1-2 meses' : 'Implementar em 3-6 meses'}
                          </span>
                        </div>
                        <div className={`text-xs font-medium ${
                          isUrgent ? 'text-red-600' : isImportant ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {isUrgent ? 'Alto Impacto' : isImportant ? 'Médio Impacto' : 'Impacto Gradual'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="areas" className="space-y-6">
          {/* Header da seção */}
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              8 Áreas Essenciais Empresariais
            </h3>
            <p className="text-muted-foreground">
              Análise focada nas áreas críticas identificadas pela IA
            </p>
          </div>

          {/* Grid das áreas prioritárias */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {diagnostic.areas_focus.map((area, index) => {
              const areaIcons: Record<string, string> = {
                'financeiro': '💰', 'rh': '👥', 'marketing': '📢', 'vendas': '💼',
                'operações': '⚙️', 'ti': '💻', 'jurídico': '⚖️', 'estratégia': '🎯'
              };
              
              const getAreaIcon = (areaName: string) => {
                const key = Object.keys(areaIcons).find(k => 
                  areaName.toLowerCase().includes(k) || 
                  areaName.toLowerCase().includes(k.replace('ç', 'c'))
                );
                return areaIcons[key || 'estratégia'];
              };
              
              return (
                <Card 
                  key={index} 
                  className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-yellow-50/80 via-background to-orange-50/80 border-yellow-200/50"
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Ícone e título */}
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl group-hover:scale-110 transition-transform">
                          {getAreaIcon(area)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">
                            {area}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-muted-foreground font-medium">
                              Área Prioritária
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Barra de prioridade */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Nível de Atenção</span>
                          <span className="text-xs font-medium text-yellow-700">Alto</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: '85%' }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Status indicator */}
                      <div className="flex items-center justify-between pt-2 border-t border-yellow-200/50">
                        <span className="text-xs text-muted-foreground">Status</span>
                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                          Requer Melhoria
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {/* Resumo das áreas */}
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="p-6">
              <div className="text-center space-y-2">
                <h4 className="font-semibold text-primary">Resumo Executivo</h4>
                <p className="text-sm text-muted-foreground">
                  A IA identificou <strong>{diagnostic.areas_focus.length} áreas prioritárias</strong> que necessitam atenção 
                  imediata para maximizar o potencial da sua empresa.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {/* Header especial da IA */}
          <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-xl border border-blue-200/50 shadow-lg">
            <div className="p-6">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">🤖</span>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Powered by Artificial Intelligence
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Análise avançada com Gemini 2.0 Flash
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo da análise */}
          <Card className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
            <CardContent className="p-8">
              {diagnostic.analysis_data?.ai_analysis ? (
                <div className="space-y-6">
                  {/* Resumo executivo destacado */}
                  <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-6 border border-primary/10">
                    <h4 className="font-semibold text-primary mb-3 flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Resumo Executivo
                    </h4>
                    <div className="prose prose-sm max-w-none">
                      <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                        {diagnostic.analysis_data.ai_analysis.split('\n').slice(0, 3).join('\n')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Análise completa */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-foreground flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Análise Detalhada
                    </h4>
                    <div className="bg-muted/30 rounded-lg p-6 border hover:bg-muted/50 transition-colors">
                      <div className="prose prose-sm max-w-none">
                        <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                          {diagnostic.analysis_data.ai_analysis}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <BarChart3 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">Análise em Processamento</h4>
                    <p className="text-sm text-muted-foreground">
                      A análise detalhada da IA não está disponível para este diagnóstico.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Diagnosticos;



