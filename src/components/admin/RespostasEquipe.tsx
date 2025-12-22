import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  FileText, 
  Search, 
  Filter, 
  Download, 
  TrendingUp, 
  BarChart3,
  Calendar,
  Eye
} from 'lucide-react';
import { usePermissions } from '@/contexts/PermissionsContext';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

interface UserResponse {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  questionnaire: {
    questionnaire_id: string;
    title: string;
    type: string;
  };
  responses_count: number;
  average_score: number;
  completed_at: string;
}

interface QuestionnaireStats {
  questionnaire_id: string;
  title: string;
  total_responses: number;
  average_score: number;
  completion_rate: number;
}

const mockUsers: UserResponse[] = [
  {
    id: '1',
    user: {
      id: '1',
      name: 'João Silva',
      email: 'joao.silva@empresa.com'
    },
    questionnaire: {
      questionnaire_id: '1',
      title: 'Questionário de Estresse Organizacional',
      type: 'estresse'
    },
    responses_count: 25,
    average_score: 7.2,
    completed_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    user: {
      id: '2',
      name: 'Maria Santos',
      email: 'maria.santos@empresa.com'
    },
    questionnaire: {
      questionnaire_id: '1',
      title: 'Questionário de Estresse Organizacional',
      type: 'estresse'
    },
    responses_count: 25,
    average_score: 8.1,
    completed_at: '2024-01-14T15:20:00Z'
  },
  {
    id: '3',
    user: {
      id: '3',
      name: 'Carlos Lima',
      email: 'carlos.lima@empresa.com'
    },
    questionnaire: {
      questionnaire_id: '2',
      title: 'Clima Organizacional - Q1 2024',
      type: 'clima'
    },
    responses_count: 30,
    average_score: 8.5,
    completed_at: '2024-01-13T09:15:00Z'
  }
];

const mockStats: QuestionnaireStats[] = [
  {
    questionnaire_id: '1',
    title: 'Questionário de Estresse Organizacional',
    total_responses: 24,
    average_score: 7.6,
    completion_rate: 80
  },
  {
    questionnaire_id: '2',
    title: 'Clima Organizacional - Q1 2024',
    total_responses: 18,
    average_score: 8.2,
    completion_rate: 60
  },
  {
    questionnaire_id: '3',
    title: 'Burnout e Sobrecarga de Trabalho',
    total_responses: 15,
    average_score: 6.9,
    completion_rate: 75
  }
];

export default function RespostasEquipe() {
  const { hasPermission } = usePermissions();
  const { user } = useAuthStore();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [stats, setStats] = useState<QuestionnaireStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterQuestionnaire, setFilterQuestionnaire] = useState('todos');
  const [filterScore, setFilterScore] = useState('todos');
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user || (user.role !== 'admin' && user.role !== 'master')) {
        throw new Error('Apenas administradores e masters podem visualizar respostas da equipe');
      }

      const qRes = await api.get('/questionnaires');
      if (!qRes.ok) {
        const errorData = await qRes.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ao carregar questionários (${qRes.status})`);
      }
      const questionnaires: Array<{ id: string; title: string; type: string }> = await qRes.json();

      const totalUsersRes = await api.get('/auth/users');
      const totalUsersData = totalUsersRes.ok ? await totalUsersRes.json() : [];
      const totalUsersCount = Array.isArray(totalUsersData) ? totalUsersData.length : 0;

      const aggregatedUsers: UserResponse[] = [];
      const aggregatedStats: QuestionnaireStats[] = [];

      for (const q of questionnaires) {
        const respRes = await api.get(`/questionnaires/${q.id}/responses`);
        if (respRes.ok) {
          const respData: Array<{
            id: string;
            user: { id: string; name: string; email: string };
            score: number | null;
            completed_at: string;
            question: { question: string; type: string };
          }> = await respRes.json();

          const byUser = new Map<string, { count: number; sumScore: number; scoreCount: number; latest: string; user: { id: string; name: string; email: string } }>();

          for (const r of respData) {
            const u = r.user;
            const key = u.id;
            const existing = byUser.get(key);
            const scoreVal = typeof r.score === 'number' ? r.score : null;
            const completedAt = r.completed_at;
            if (!existing) {
              byUser.set(key, {
                count: 1,
                sumScore: scoreVal ?? 0,
                scoreCount: scoreVal !== null ? 1 : 0,
                latest: completedAt,
                user: u,
              });
            } else {
              existing.count += 1;
              if (scoreVal !== null) {
                existing.sumScore += scoreVal;
                existing.scoreCount += 1;
              }
              if (new Date(completedAt).getTime() > new Date(existing.latest).getTime()) {
                existing.latest = completedAt;
              }
            }
          }

          for (const [, info] of byUser) {
            const avg = info.scoreCount > 0 ? Math.round((info.sumScore / info.scoreCount) * 10) / 10 : 0;
            aggregatedUsers.push({
              id: `${q.id}-${info.user.id}`,
              user: info.user,
              questionnaire: {
                questionnaire_id: q.id,
                title: q.title,
                type: q.type,
              },
              responses_count: info.count,
              average_score: avg,
              completed_at: info.latest,
            });
          }
        }

        const statRes = await api.get(`/questionnaires/statistics?questionnaire_id=${q.id}`);
        if (statRes.ok) {
          const statData: { totalResponses: number; averageScore: number; uniqueRespondents: number } = await statRes.json();
          const completionRate =
            totalUsersCount > 0
              ? Math.min(100, Math.round((statData.uniqueRespondents / totalUsersCount) * 100))
              : 0;
          aggregatedStats.push({
            questionnaire_id: q.id,
            title: q.title,
            total_responses: statData.totalResponses,
            average_score: Math.round((statData.averageScore || 0) * 10) / 10,
            completion_rate: completionRate,
          });
        }
      }

      setUsers(aggregatedUsers.length > 0 ? aggregatedUsers : mockUsers);
      setStats(aggregatedStats.length > 0 ? aggregatedStats : mockStats);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados');
      setUsers(mockUsers);
      setStats(mockStats);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesQuestionnaire = filterQuestionnaire === 'todos' || 
                                user.questionnaire.questionnaire_id === filterQuestionnaire;
    const matchesScore = filterScore === 'todos' || 
                        (filterScore === 'alto' && user.average_score >= 8) ||
                        (filterScore === 'medio' && user.average_score >= 6 && user.average_score < 8) ||
                        (filterScore === 'baixo' && user.average_score < 6);
    
    return matchesSearch && matchesQuestionnaire && matchesScore;
  });

  const handleViewUserDetails = (user: UserResponse) => {
    setSelectedUser(user);
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

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Respostas da Equipe</h1>
          <p className="text-muted-foreground">
            Acompanhe as respostas dos questionários da sua equipe
          </p>
        </div>
        {hasPermission('relatorio.export') && (
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Exportar Relatório
          </Button>
        )}
      </div>

      {/* Estatísticas dos Questionários */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.questionnaire_id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stat.total_responses}</span>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Score Médio</span>
                <span className={getScoreColor(stat.average_score)}>
                  {stat.average_score}/10
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Taxa de Conclusão</span>
                <span className={getCompletionColor(stat.completion_rate)}>
                  {stat.completion_rate}%
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterQuestionnaire} onValueChange={setFilterQuestionnaire}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Questionário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os questionários</SelectItem>
                {stats.map((stat) => (
                  <SelectItem key={stat.questionnaire_id} value={stat.questionnaire_id}>
                    {stat.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterScore} onValueChange={setFilterScore}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os scores</SelectItem>
                <SelectItem value="alto">Alto (8+)</SelectItem>
                <SelectItem value="medio">Médio (6-8)</SelectItem>
                <SelectItem value="baixo">Baixo (&lt;6)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Respostas dos Colaboradores</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Questionário</TableHead>
                <TableHead>Respostas</TableHead>
                <TableHead>Score Médio</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{user.questionnaire.title}</div>
                      {getTypeBadge(user.questionnaire.type)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      {user.responses_count}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={getScoreColor(user.average_score)}>
                      {user.average_score}/10
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {new Date(user.completed_at).toLocaleDateString('pt-BR')}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {hasPermission('questionario.view') && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewUserDetails(user)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Usuário */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes das Respostas</DialogTitle>
            <DialogDescription>
              Respostas detalhadas de {selectedUser?.user.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">Colaborador</div>
                  <div className="font-medium">{selectedUser.user.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedUser.user.email}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Questionário</div>
                  <div className="font-medium">{selectedUser.questionnaire.title}</div>
                  {getTypeBadge(selectedUser.questionnaire.type)}
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Score Médio</div>
                  <div className={`text-2xl font-bold ${getScoreColor(selectedUser.average_score)}`}>
                    {selectedUser.average_score}/10
                  </div>
                </div>
              </div>
              
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="mx-auto h-12 w-12 mb-4" />
                <p>Detalhes das respostas serão carregados aqui</p>
                <p className="text-sm">(Implementação futura)</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
