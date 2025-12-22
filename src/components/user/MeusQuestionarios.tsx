import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, FileText, TrendingUp, Eye, BarChart3, Clock } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';

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
}

const mockQuestionnaires: QuestionnaireSummary[] = [
  {
    questionnaire_id: '1',
    title: 'Questionário de Estresse Organizacional',
    type: 'estresse',
    responses_count: 25,
    average_score: 7.2,
    completed_at: '2024-01-15T10:30:00Z',
    latest_response: '2024-01-15T10:30:00Z'
  },
  {
    questionnaire_id: '2',
    title: 'Clima Organizacional - Q1 2024',
    type: 'clima',
    responses_count: 30,
    average_score: 8.5,
    completed_at: '2024-01-08T14:20:00Z',
    latest_response: '2024-01-08T14:20:00Z'
  },
  {
    questionnaire_id: '3',
    title: 'Burnout e Sobrecarga de Trabalho',
    type: 'burnout',
    responses_count: 20,
    average_score: 6.8,
    completed_at: '2024-01-01T09:15:00Z',
    latest_response: '2024-01-01T09:15:00Z'
  }
];

const mockDetailedResponses: QuestionnaireResponse[] = [
  {
    id: '1',
    questionnaire: {
      title: 'Questionário de Estresse Organizacional',
      type: 'estresse'
    },
    question: {
      question: 'Como você avalia seu nível de estresse no trabalho?',
      type: 'scale'
    },
    response: '4',
    score: 4,
    completed_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    questionnaire: {
      title: 'Questionário de Estresse Organizacional',
      type: 'estresse'
    },
    question: {
      question: 'Você se sente sobrecarregado com suas responsabilidades?',
      type: 'multiple_choice'
    },
    response: 'Às vezes',
    score: null,
    completed_at: '2024-01-15T10:30:00Z'
  }
];

export default function MeusQuestionarios() {
  const { token } = useAuthStore();
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireSummary[]>([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<string | null>(null);
  const [detailedResponses, setDetailedResponses] = useState<QuestionnaireResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    loadQuestionnaires();
  }, []);

  const loadQuestionnaires = async () => {
    try {
      const response = await api.get('/questionnaires/my/responses');
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
            latest_response: completedAt
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
            completed_at: latest
          });
        }
      }

      setQuestionnaires(Array.from(summariesMap.values()));
    } catch (error) {
      console.error('Erro ao carregar questionários:', error);
      setQuestionnaires(mockQuestionnaires);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDetailedResponses = async (questionnaireId: string) => {
    try {
      // Usuários não podem acessar /questionnaires/:id/responses (retorna 403).
      // Buscar as respostas do próprio usuário e filtrar pelo questionnaire_id.
      const response = await api.get('/questionnaires/my/responses');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ao carregar respostas (${response.status})`);
      }
      const data: QuestionnaireResponse[] = await response.json();
      const filtered = Array.isArray(data)
        ? data.filter(r => r.questionnaire_id === questionnaireId)
        : [];
      setDetailedResponses(filtered.length > 0 ? filtered : mockDetailedResponses);
    } catch (error) {
      console.error('Erro ao carregar respostas detalhadas:', error);
    }
  };

  const handleViewDetails = async (questionnaireId: string) => {
    setSelectedQuestionnaire(questionnaireId);
    await loadDetailedResponses(questionnaireId);
    setIsDetailsModalOpen(true);
  };

  const getTypeBadge = (type: string) => {
    const types = {
      estresse: { label: 'Estresse', color: 'bg-red-100 text-red-800' },
      clima: { label: 'Clima', color: 'bg-blue-100 text-blue-800' },
      burnout: { label: 'Burnout', color: 'bg-orange-100 text-orange-800' }
    };
    const typeInfo = types[type as keyof typeof types] || { label: type, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={typeInfo.color}>{typeInfo.label}</Badge>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Meus Questionários</h1>
        <p className="text-muted-foreground">
          Histórico completo dos questionários que você respondeu
        </p>
      </div>

      {questionnaires.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum questionário respondido</h3>
              <p className="text-muted-foreground mb-4">
                Você ainda não respondeu nenhum questionário.
              </p>
              <Button>
                Responder Questionário
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {questionnaires.map((questionnaire) => (
            <Card key={questionnaire.questionnaire_id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {questionnaire.title}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(questionnaire.completed_at).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex items-center gap-1">
                        <BarChart3 className="w-4 h-4" />
                        {questionnaire.responses_count} perguntas
                      </div>
                      {questionnaire.average_score > 0 && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          <span className={getScoreColor(questionnaire.average_score)}>
                            Score: {questionnaire.average_score}/10
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
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
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Última resposta: {new Date(questionnaire.latest_response).toLocaleString('pt-BR')}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Comparar
                    </Button>
                    <Button variant="ghost" size="sm">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Evolução
                    </Button>
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
              Visualize suas respostas para este questionário
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pergunta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Sua Resposta</TableHead>
                  <TableHead>Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailedResponses.map((response) => (
                  <TableRow key={response.id}>
                    <TableCell className="max-w-md">
                      <div className="font-medium">{response.question.question}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {response.question.type === 'scale' ? 'Escala' : 'Múltipla Escolha'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{response.response}</div>
                    </TableCell>
                    <TableCell>
                      {response.score !== null ? (
                        <span className={getScoreColor(response.score)}>
                          {response.score}/10
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
