import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import ModalLayout from '@/components/common/ModalLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  Calendar, 
  TrendingUp, 
  Target, 
  Award, 
  Lightbulb, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  FileText,
  Download,
  Share2,
  MessageSquare,
  RefreshCw,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { axiosInstance } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import DiagnosticChat from './DiagnosticChat';
import { toast } from 'sonner';

interface Diagnostic {
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
}

interface QuestionResponse {
  question_id: string;
  question_text: string;
  response: string;
  score: number;
}

interface DiagnosticDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnostic: Diagnostic;
}

interface RecommendedContent {
  id: string;
  title: string;
  description: string;
  type: string;
  category: {
    name: string;
  };
  status: string;
}

const DiagnosticDetailModal = ({ isOpen, onClose, diagnostic }: DiagnosticDetailModalProps) => {
  const { token } = useAuthStore();
  const [currentDiagnostic, setCurrentDiagnostic] = useState<Diagnostic>(diagnostic);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [recommendedContent, setRecommendedContent] = useState<RecommendedContent[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // Carregar respostas detalhadas
  const loadResponses = useCallback(async () => {
    try {
      setLoadingResponses(true);
      const response = await axiosInstance.get(
        `/diagnostics/${currentDiagnostic.id}/responses`
      );
      setResponses(response.data);
    } catch (error) {
      console.error('Erro ao carregar respostas:', error);
    } finally {
      setLoadingResponses(false);
    }
  }, [currentDiagnostic.id]);

  const loadDiagnostic = useCallback(async () => {
    const response = await axiosInstance.get(`/diagnostics/${currentDiagnostic.id}`);
    setCurrentDiagnostic(response.data);
  }, [currentDiagnostic.id]);

  const loadRecommendedContent = useCallback(async () => {
    // Check if diagnostic is completed before trying to load recommendations
    if (currentDiagnostic.status !== 'completed') {
      setRecommendedContent([]);
      return;
    }

    const categories = (currentDiagnostic.analysis_data?.recommended_content_categories as string[]) || [];
    if (!categories.length) {
      setRecommendedContent([]);
      return;
    }

    try {
      setLoadingRecommended(true);
      const response = await axiosInstance.get('/contents');
      const allContent: RecommendedContent[] = Array.isArray(response.data) ? response.data : (response.data?.items ?? []);
      
      // Filter content that matches at least one recommended category
      const matched = allContent.filter((c) => 
        c.status === 'published' && 
        categories.some(cat => 
          c.category?.name?.toLowerCase().includes(cat.toLowerCase()) ||
          cat.toLowerCase().includes(c.category?.name?.toLowerCase())
        )
      ).slice(0, 3);

      setRecommendedContent(matched);
    } catch (error) {
      console.error('Erro ao carregar conteúdos recomendados:', error);
    } finally {
      setLoadingRecommended(false);
    }
  }, [currentDiagnostic.analysis_data?.recommended_content_categories, currentDiagnostic.status]);

  useEffect(() => {
    if (isOpen && diagnostic) {
      setCurrentDiagnostic(diagnostic);
      loadResponses();
      if (diagnostic.status === 'completed') {
        loadRecommendedContent();
      }
    }
  }, [isOpen, token, loadResponses, loadRecommendedContent, diagnostic]);

  useEffect(() => {
    if (!isOpen) return;
    if (
      currentDiagnostic.status !== 'processing' &&
      currentDiagnostic.status !== 'processing_ai' &&
      currentDiagnostic.status !== 'pending'
    )
      return;
    const interval = window.setInterval(() => {
      void loadDiagnostic().catch(() => {});
    }, 4000);
    return () => window.clearInterval(interval);
  }, [isOpen, currentDiagnostic.status, loadDiagnostic]);

  const getCategoryColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreCategory = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Regular';
    return 'Crítico';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
      case 'processing_ai':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'pending':
        return 'Pendente';
      case 'processing':
        return 'Processando';
      case 'processing_ai':
        return 'Processando';
      case 'error':
        return 'Erro';
      case 'failed':
        return 'Falhou';
      default:
        return status;
    }
  };

  const analysisSummary =
    typeof currentDiagnostic.analysis_data?.analysis_summary === 'string'
      ? currentDiagnostic.analysis_data.analysis_summary
      : '';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreProgress = (score: number) => {
    return Math.min(score, 100);
  };

  const handleExport = () => {
    // Implementar exportação em PDF
    console.log('Exportar diagnóstico:', currentDiagnostic.id);
  };

  const handleShare = () => {
    // Implementar compartilhamento
    console.log('Compartilhar diagnóstico:', currentDiagnostic.id);
  };

  const handleRetryAi = async () => {
    try {
      setRetrying(true);
      await axiosInstance.post(`/diagnostics/${currentDiagnostic.id}/retry-ai`);
      toast.success('Solicitação enviada. Aguardando processamento externo.');
      await loadDiagnostic();
      await loadResponses();
    } catch (error: unknown) {
      const status =
        error &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response?: { status?: unknown } }).response &&
        typeof (error as { response?: { status?: unknown } }).response?.status ===
          'number'
          ? ((error as { response: { status: number } }).response.status as number)
          : undefined;

      if (status === 404) {
        toast.error('Endpoint de retry não encontrado. Reinicie o backend.');
      } else if (status === 403) {
        toast.error('Você não tem permissão para reprocessar este diagnóstico.');
      } else if (status === 429) {
        toast.error('IA em limite de uso. Tente novamente em alguns segundos.');
      } else {
        const message =
          error && typeof error === 'object' && 'message' in error
            ? String((error as { message?: unknown }).message)
            : 'Erro ao reprocessar';
        toast.error(message);
      }
    } finally {
      setRetrying(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <ModalLayout
        isOpen={isOpen}
        onClose={onClose}
        title="Detalhes do Diagnóstico"
        size="xl"
        showCloseButton={true}
        closeOnOverlayClick={false}
      >
        <div className="space-y-6">
          {/* Header com informações principais */}
          <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold">{currentDiagnostic.questionnaire.title}</h2>
              <Badge className={`${getCategoryColor(currentDiagnostic.score_intelligent)} text-white`}>
                {getScoreCategory(currentDiagnostic.score_intelligent)}
              </Badge>
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>{currentDiagnostic.questionnaire.type}</span>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {formatDate(currentDiagnostic.generated_at)}
              </div>
              <Badge variant="secondary" className={getStatusColor(currentDiagnostic.status)}>
                {getStatusLabel(currentDiagnostic.status)}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleRetryAi()}
              disabled={retrying}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {retrying
                ? 'Enviando...'
                : currentDiagnostic.status === 'pending'
                  ? 'Reenviar'
                  : 'Reprocessar'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </div>
        </div>

        {currentDiagnostic.status === 'pending' && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Este diagnóstico está aguardando processamento externo.
          </div>
        )}

        {/* Score principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Pontuação Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col items-center md:items-start space-y-1">
                <div className={`text-6xl font-bold tracking-tighter ${getScoreTextColor(currentDiagnostic.score_intelligent)}`}>
                  {currentDiagnostic.score_intelligent}%
                </div>
                <p className="text-sm font-medium text-muted-foreground text-center md:text-left">Score inteligente calculado pela IA</p>
              </div>
              
              <div className="w-full md:w-2/3 space-y-2">
                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
                <Progress value={getScoreProgress(currentDiagnostic.score_intelligent)} className="h-4 w-full" />
                <p className="text-xs text-muted-foreground text-center md:text-right pt-1">
                  Categoria: <span className={`font-semibold ${getScoreTextColor(currentDiagnostic.score_intelligent)}`}>{getScoreCategory(currentDiagnostic.score_intelligent)}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de conteúdo */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="recommended">Conteúdos</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            {analysisSummary ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="h-5 w-5 mr-2" />
                    Resumo Executivo
                  </CardTitle>
                  <CardDescription>
                    Leitura consolidada da IA sobre o cenário diagnosticado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-7 text-muted-foreground whitespace-pre-line">
                    {analysisSummary}
                  </p>
                </CardContent>
              </Card>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Áreas de Foco */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Target className="h-5 w-5 mr-2" />
                    Áreas de Foco
                  </CardTitle>
                  <CardDescription>
                    Principais pontos identificados para melhoria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentDiagnostic.areas_focus && currentDiagnostic.areas_focus.length > 0 ? (
                    <div className="space-y-2">
                      {currentDiagnostic.areas_focus.map((area, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-sm">{area}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                      <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mb-3">
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-sm font-medium text-foreground">Excelente desempenho!</p>
                      <p className="text-xs mt-1">Nenhuma área crítica identificada.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Lightbulb className="h-5 w-5 mr-2" />
                    Insights
                  </CardTitle>
                  <CardDescription>
                    Análises inteligentes sobre seu perfil
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentDiagnostic.insights && currentDiagnostic.insights.length > 0 ? (
                    <div className="space-y-2">
                      {currentDiagnostic.insights.map((insight, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{insight}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum insight disponível</p>
                  )}
                </CardContent>
              </Card>

              {/* Estatísticas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Award className="h-5 w-5 mr-2" />
                    Estatísticas
                  </CardTitle>
                  <CardDescription>
                    Métricas do diagnóstico
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Recomendações</span>
                      <span className="font-medium">{currentDiagnostic.recommendations?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Áreas de foco</span>
                      <span className="font-medium">{currentDiagnostic.areas_focus?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant="secondary" className={getStatusColor(currentDiagnostic.status)}>
                        {getStatusLabel(currentDiagnostic.status)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Conteúdos Recomendados */}
          <TabsContent value="recommended" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Materiais Recomendados
                </CardTitle>
                <CardDescription>
                  Conteúdos selecionados pela IA para ajudar na resolução dos problemas identificados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingRecommended ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : recommendedContent.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendedContent.map((item) => (
                      <div 
                        key={item.id} 
                        className="group flex flex-col border rounded-lg overflow-hidden bg-card hover:border-primary/50 transition-all cursor-pointer"
                        onClick={() => window.open(`/conteudos/${item.id}`, '_blank')}
                      >
                        <div className="p-4 flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                              {item.category?.name || 'Geral'}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                              {item.type}
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                            {item.title}
                          </h4>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="px-4 py-2 bg-muted/30 border-t flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">Acessar material</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/20 rounded-lg border-2 border-dashed">
                    <BookOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">Nenhum conteúdo específico encontrado</p>
                    <p className="text-xs text-muted-foreground/70 mt-1 max-w-[280px] mx-auto">
                      Tente detalhar melhor o seu diagnóstico para que possamos recomendar materiais mais precisos.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights */}
          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2" />
                  Análise Inteligente
                </CardTitle>
                <CardDescription>
                  Insights gerados pela IA baseados nas suas respostas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentDiagnostic.insights && currentDiagnostic.insights.length > 0 ? (
                  <div className="space-y-4">
                    {currentDiagnostic.insights.map((insight, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-muted/30 rounded-lg">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Lightbulb className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Insight #{index + 1}</p>
                          <p className="text-sm text-muted-foreground">{insight}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum insight disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recomendações */}
          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Plano de Ação
                </CardTitle>
                <CardDescription>
                  Recomendações personalizadas para melhorar sua pontuação
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentDiagnostic.recommendations && currentDiagnostic.recommendations.length > 0 ? (
                  <div className="space-y-4">
                    {currentDiagnostic.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded-lg">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1 text-green-900 dark:text-green-100">Recomendação #{index + 1}</p>
                          <p className="text-sm text-green-800 dark:text-green-300/90">{recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma recomendação disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </ModalLayout>

      {!isChatOpen && (
        <Button
          className="fixed bottom-6 right-6 z-[60] rounded-full h-14 w-14 shadow-xl"
          onClick={() => setIsChatOpen(true)}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}

      <DiagnosticChat
        diagnosticId={currentDiagnostic.id}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </>,
    document.body
  );
};

export default DiagnosticDetailModal;
