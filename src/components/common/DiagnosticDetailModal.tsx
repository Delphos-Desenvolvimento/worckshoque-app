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
  Share2
} from 'lucide-react';
import { axiosInstance } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

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

const DiagnosticDetailModal = ({ isOpen, onClose, diagnostic }: DiagnosticDetailModalProps) => {
  const { token } = useAuthStore();
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Carregar respostas detalhadas
  const loadResponses = useCallback(async () => {
    try {
      setLoadingResponses(true);
      const response = await axiosInstance.get(
        `/questionnaires/${diagnostic.questionnaire_id}/responses`
      );
      setResponses(response.data);
    } catch (error) {
      console.error('Erro ao carregar respostas:', error);
    } finally {
      setLoadingResponses(false);
    }
  }, [diagnostic?.questionnaire_id]);

  useEffect(() => {
    if (isOpen && diagnostic) {
      loadResponses();
    }
  }, [isOpen, token, loadResponses, diagnostic]);

  const getCategoryColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
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
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  const getScoreProgress = (score: number) => {
    return Math.min(score, 100);
  };

  const handleExport = () => {
    // Implementar exportação em PDF
    console.log('Exportar diagnóstico:', diagnostic.id);
  };

  const handleShare = () => {
    // Implementar compartilhamento
    console.log('Compartilhar diagnóstico:', diagnostic.id);
  };

  if (!isOpen) return null;

  return createPortal(
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
              <h2 className="text-2xl font-bold">{diagnostic.questionnaire.title}</h2>
              <Badge className={`${getCategoryColor(diagnostic.score_intelligent)} text-white`}>
                {getScoreCategory(diagnostic.score_intelligent)}
              </Badge>
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>{diagnostic.questionnaire.type}</span>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {formatDate(diagnostic.generated_at)}
              </div>
              <Badge variant="secondary" className={getStatusColor(diagnostic.status)}>
                {diagnostic.status === 'completed' ? 'Completo' : 
                 diagnostic.status === 'processing' ? 'Processando' : 'Falhou'}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
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

        {/* Score principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Pontuação Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="text-4xl font-bold text-primary">{diagnostic.score_intelligent}%</div>
                <p className="text-sm text-muted-foreground">Score inteligente calculado pela IA</p>
              </div>
              <div className="w-64">
                <Progress value={getScoreProgress(diagnostic.score_intelligent)} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de conteúdo */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="responses">Respostas</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
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
                  {diagnostic.areas_focus && diagnostic.areas_focus.length > 0 ? (
                    <div className="space-y-2">
                      {diagnostic.areas_focus.map((area, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-sm">{area}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma área específica identificada</p>
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
                  {diagnostic.insights && diagnostic.insights.length > 0 ? (
                    <div className="space-y-2">
                      {diagnostic.insights.map((insight, index) => (
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
                      <span className="font-medium">{diagnostic.recommendations?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Áreas de foco</span>
                      <span className="font-medium">{diagnostic.areas_focus?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant="secondary" className={getStatusColor(diagnostic.status)}>
                        {diagnostic.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Respostas */}
          <TabsContent value="responses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Respostas Detalhadas
                </CardTitle>
                <CardDescription>
                  Suas respostas para cada pergunta do questionário
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingResponses ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : responses.length > 0 ? (
                  <div className="space-y-4">
                    {responses.map((response, index) => (
                      <div key={response.question_id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{index + 1}. {response.question_text}</h4>
                          <Badge variant="outline">{response.score} pontos</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                          {response.response}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma resposta encontrada</p>
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
                {diagnostic.insights && diagnostic.insights.length > 0 ? (
                  <div className="space-y-4">
                    {diagnostic.insights.map((insight, index) => (
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
                {diagnostic.recommendations && diagnostic.recommendations.length > 0 ? (
                  <div className="space-y-4">
                    {diagnostic.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Recomendação #{index + 1}</p>
                          <p className="text-sm text-muted-foreground">{recommendation}</p>
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
    </ModalLayout>,
    document.body
  );
};

export default DiagnosticDetailModal;


