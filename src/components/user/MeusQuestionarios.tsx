import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, FileText, TrendingUp, Eye, BarChart3, Clock, Users, User, List, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import PageHeader from '@/components/common/PageHeader';

interface QuestionnaireResponse {
  id: string;
  questionnaire_id: string;
  questionnaire: {
    title: string;
    type: string;
  };
  question: {
    question: string;
    type: string;
  };
  user?: {
    name: string;
    email: string;
  };
  response: string;
  score: number | null;
  completed_at: string;
}

interface QuestionnaireSummary {
  questionnaire_id: string;
  title: string;
  type: string;
  responses_count: number;
  average_score: number;
  completed_at: string;
  latest_response: string;
  respondents?: number; // Para admin/master
}

export default function MeusQuestionarios() {
  const { token, user } = useAuthStore();
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireSummary[]>([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<string | null>(null);
  const [detailedResponses, setDetailedResponses] = useState<QuestionnaireResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Verificar se é admin ou master
  const isAdminOrMaster = user?.role === 'admin' || user?.role === 'master';
  const pageTitle = isAdminOrMaster ? "Respostas dos Questionários" : "Minhas Respostas";
  const pageDescription = isAdminOrMaster 
    ? "Visualize e analise as respostas de todos os usuários" 
    : "Histórico das suas respostas e avaliações";

  useEffect(() => {
    loadQuestionnaires();
  }, [isAdminOrMaster]); // Recarregar se o papel mudar (embora raro em tempo real)

  const loadQuestionnaires = async () => {
    try {
      // Endpoint diferente para admin/master (lista todas as respostas) ou user (apenas as suas)
      const endpoint = isAdminOrMaster ? '/questionnaires/responses' : '/questionnaires/my/responses';
      
      const response = await api.get(endpoint);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ao carregar respostas (${response.status})`);
      }
      
      const data: QuestionnaireResponse[] = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Formato de dados inválido recebido do servidor');
      }

      const summariesMap = new Map<string, QuestionnaireSummary>();

      for (const r of data) {
        const key = r.questionnaire_id;
        const existing = summariesMap.get(key);
        const scoreVal = typeof r.score === 'number' ? r.score : null;
        const completedAt = r.completed_at;

        if (!existing) {
          summariesMap.set(key, {
            questionnaire_id: key,
            title: r.questionnaire?.title ?? 'Questionário',
            type: r.questionnaire?.type ?? 'desconhecido',
            responses_count: 1,
            average_score: scoreVal ?? 0,
            completed_at: completedAt,
            latest_response: completedAt,
            respondents: 1 // Contagem inicial
          });
        } else {
          const newCount = existing.responses_count + 1;
          const previousAvg = existing.average_score;

          const newAvg = scoreVal !== null
            ? ((previousAvg * existing.responses_count) + scoreVal) / newCount
            : previousAvg;

          const latest =
            new Date(completedAt).getTime() > new Date(existing.latest_response).getTime()
              ? completedAt
              : existing.latest_response;

          summariesMap.set(key, {
            ...existing,
            responses_count: newCount,
            average_score: Number.isFinite(newAvg) ? Math.round(newAvg * 10) / 10 : existing.average_score,
            latest_response: latest,
            completed_at: latest,
            respondents: (existing.respondents || 0) + 1 // Incremento simplificado
          });
        }
      }

      setQuestionnaires(Array.from(summariesMap.values()));
    } catch (error) {
      console.error('Erro ao carregar questionários:', error);
      setQuestionnaires([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDetailedResponses = async (questionnaireId: string) => {
    try {
      const endpoint = isAdminOrMaster ? '/questionnaires/responses' : '/questionnaires/my/responses';
      const response = await api.get(endpoint);
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar detalhes (${response.status})`);
      }
      
      const data: QuestionnaireResponse[] = await response.json();
      const filtered = Array.isArray(data)
        ? data.filter(r => r.questionnaire_id === questionnaireId)
        : [];
      setDetailedResponses(filtered);
    } catch (error) {
      console.error('Erro ao carregar respostas detalhadas:', error);
      setDetailedResponses([]);
    }
  };

  const handleViewDetails = async (questionnaireId: string) => {
    setSelectedQuestionnaire(questionnaireId);
    await loadDetailedResponses(questionnaireId);
    setIsDetailsModalOpen(true);
  };

  const formatResponseText = (text: string) => {
    if (!text) return '-';
    // Check if it looks like a slug (contains hyphens or underscores and no spaces)
    if (/^[\w-]+$/.test(text) && !text.includes(' ')) {
      return text
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    }
    return text;
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-500';
    if (score < 5) return 'text-red-500 font-bold';
    if (score < 8) return 'text-yellow-600 font-bold';
    return 'text-green-600 font-bold';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <FileText className="w-3 h-3" />;
      case 'scale': return <BarChart3 className="w-3 h-3" />;
      case 'multiple_choice': return <List className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const types = {
      estresse: { label: 'Estresse', color: 'bg-red-100 text-red-800 border-red-200' },
      clima: { label: 'Clima', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      burnout: { label: 'Burnout', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      lideranca: { label: 'Liderança', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      cultura: { label: 'Cultura', color: 'bg-green-100 text-green-800 border-green-200' }
    };
    
    const style = types[type as keyof typeof types] || { label: type, color: 'bg-gray-100 text-gray-800 border-gray-200' };
    
    return (
      <Badge variant="outline" className={`${style.color}`}>
        {style.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        icon={FileText}
        badges={[
          { label: `${questionnaires.length} questionários respondidos`, icon: FileText },
          { label: "Última atualização hoje", icon: Clock }
        ]}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-muted" />
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questionnaires.map((questionnaire) => (
            <Card key={questionnaire.questionnaire_id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg line-clamp-2" title={questionnaire.title}>
                      {questionnaire.title}
                    </CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(questionnaire.completed_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Média Score</span>
                    <span className="font-bold text-lg">{questionnaire.average_score.toFixed(1)}</span>
                  </div>
                  
                  {isAdminOrMaster && (
                     <div className="flex justify-between items-center py-2 border-b">
                       <span className="text-sm text-muted-foreground">Respondentes</span>
                       <span className="font-bold text-lg flex items-center">
                         <Users className="w-4 h-4 mr-1 text-muted-foreground" />
                         {questionnaire.responses_count}
                       </span>
                     </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      {getTypeBadge(questionnaire.type)}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(questionnaire.questionnaire_id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Detalhes */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Respostas Detalhadas</DialogTitle>
            <DialogDescription>
              {isAdminOrMaster 
                ? "Visualizando respostas de todos os usuários para este questionário" 
                : "Suas respostas para este questionário"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[40%] py-3">Pergunta</TableHead>
                  <TableHead>Resposta</TableHead>
                  {isAdminOrMaster && <TableHead>Usuário</TableHead>}
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailedResponses.map((response) => (
                  <TableRow key={response.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium align-top py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-1.5 rounded-md bg-muted text-muted-foreground shrink-0">
                          {getTypeIcon(response.question.type)}
                        </div>
                        <div>
                          <p className="leading-snug text-sm">{response.question.question}</p>
                          <Badge variant="secondary" className="mt-2 text-[10px] h-5 font-normal px-1.5 text-muted-foreground bg-muted/50 border-border/50">
                             {response.question.type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-4">
                      <span className="text-sm font-medium text-foreground block max-w-[200px] break-words">
                        {formatResponseText(response.response)}
                      </span>
                    </TableCell>
                    {isAdminOrMaster && (
                      <TableCell className="align-top py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 shrink-0 text-xs font-bold text-primary border border-primary/20">
                            {response.user?.name?.charAt(0).toUpperCase() || 'A'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate max-w-[120px]" title={response.user?.name}>{response.user?.name || 'Anônimo'}</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={response.user?.email}>{response.user?.email}</span>
                          </div>
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="align-top py-4">
                      <div className="flex items-center text-muted-foreground text-xs font-medium">
                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                        {new Date(response.completed_at).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right align-top py-4">
                      {response.score !== null ? (
                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full border shadow-sm ${
                          response.score >= 8 ? 'bg-green-50 border-green-200 text-green-700' :
                          response.score >= 5 ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                          'bg-red-50 border-red-200 text-red-700'
                        } font-bold text-sm`}>
                          {response.score}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xl leading-none opacity-30">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {detailedResponses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isAdminOrMaster ? 5 : 4} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                          <FileText className="w-8 h-8 opacity-40" />
                        </div>
                        <p className="font-medium">Nenhuma resposta encontrada.</p>
                        <p className="text-xs mt-1 opacity-70">As respostas aparecerão aqui assim que forem enviadas.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
