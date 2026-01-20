import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Clock, 
  Users, 
  Target, 
  TrendingUp, 
  Play, 
  Eye, 
  Plus, 
  Edit, 
  Settings,
  CheckCircle,
  AlertCircle,
  Activity,
  Check,
  BarChart3,
  Calendar,
  Grid3X3,
  List,
  Table,
  Search,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { usePermissions } from '@/contexts/PermissionsContext';
import ModalLayout from '@/components/common/ModalLayout';
import PageHeader from '@/components/common/PageHeader';
import CreateQuestionnaireForm from '@/components/common/CreateQuestionnaireForm';
import QuestionnaireGrid from '@/components/common/QuestionnaireGrid';
import QuestionnaireList from '@/components/common/QuestionnaireList';
import QuestionnaireTable from '@/components/common/QuestionnaireTable';
import QuestionnaireTimeline from '@/components/common/QuestionnaireTimeline';
import { api, axiosInstance } from '@/lib/api';

interface QuestionOption {
  id: string;
  value: string;
  label: string;
  score: number;
  order: number;
}

interface Question {
  id: string;
  question: string;
  type: string;
  order: number;
  required: boolean;
  options: QuestionOption[];
}

interface Questionnaire {
  id: string;
  title: string;
  description?: string;
  type: string;
  is_active: boolean;
  questions_count: number;
  estimated_time: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  questions?: Question[];
}

import { toast } from 'sonner';

export default function Questionarios() {
  const { token, user } = useAuthStore();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();

  // Estados
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);
  const [isRespondModalOpen, setIsRespondModalOpen] = useState(false);
  
  // Estados para responder questionário
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingQuestionnaireData, setPendingQuestionnaireData] = useState<{
    title: string;
    description: string;
    type: string;
    estimated_time: number;
    is_active: boolean;
    questions: Array<{
      question: string;
      type: string;
      required: boolean;
      options?: Array<{
        value: string;
        label?: string;
        score?: number;
      }>;
    }>;
  } | null>(null);
  const [editingQuestionnaire, setEditingQuestionnaire] = useState<Questionnaire | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  // Estados para visualização
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table' | 'timeline'>('grid');
  const [sortBy, setSortBy] = useState<'title' | 'created_at' | 'type'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === '1') {
      setModalMode('create');
      setEditingQuestionnaire(null);
      setIsCreateModalOpen(true);
      params.delete('create');
      const nextSearch = params.toString();
      navigate(
        { pathname: location.pathname, search: nextSearch ? `?${nextSearch}` : '' },
        { replace: true },
      );
    }
  }, [location.pathname, location.search, navigate]);

  // Memoizar função de carregamento para evitar recriações
  const loadQuestionnaires = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar token novamente antes de fazer a requisição
      const currentToken = useAuthStore.getState().token;
      console.log('Token no componente:', !!token, 'Token no store:', !!currentToken);
      
      if (!token && !currentToken) {
        throw new Error('Token de autenticação não encontrado. Por favor, faça login novamente.');
      }
      
      // Usar o token mais atualizado do store
      const tokenToUse = currentToken || token;
      
      const response = await api.get('/questionnaires');
      
      // Verificar se a resposta foi bem-sucedida antes de processar
      if (!response.ok) {
        let errorData: { message?: string; error?: string } = {};
        try {
          const responseText = await response.clone().text();
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { message: 'Erro ao carregar questionários' };
        }
        
        // Se for 401, verificar se é realmente um problema de token
        if (response.status === 401) {
          const errorMessage = errorData.message || errorData.error || 'Não autorizado';
          console.error('Erro 401:', errorMessage);
          console.error('Token no store:', !!token);
          
          // Verificar se o token existe no store
          if (!token) {
            throw new Error('Token de autenticação não encontrado. Por favor, faça login novamente.');
          }
          
          // Só lançar erro se realmente for problema de autenticação
          if (errorMessage.includes('token') || errorMessage.includes('expired') || errorMessage.includes('unauthorized') || errorMessage.includes('jwt')) {
            throw new Error('Sua sessão expirou. Por favor, faça login novamente.');
          }
          throw new Error(`Acesso negado: ${errorMessage}`);
        }
        
        throw new Error(errorData.message || errorData.error || `Erro ao carregar questionários (${response.status})`);
      }
      
      const data = await response.json();
      
      // Verificar se data é um array antes de fazer map
      if (!Array.isArray(data)) {
        console.error('Resposta da API não é um array:', data);
        throw new Error('Formato de dados inválido recebido do servidor');
      }
      
      // Transformar dados da API para o formato esperado pelo frontend
      const questionnaires = data.map((q: {
        id: string;
        title: string;
        description?: string;
        type: string;
        is_active: boolean;
        created_at: string;
        updated_at: string;
        created_by: string;
        questions?: Question[];
        estimated_time?: number;
      }) => ({
        ...q,
        questions: q.questions || [],
        questions_count: q.questions?.length || 0,
        estimated_time: q.estimated_time || 15
      }));
      
      setQuestionnaires(questionnaires);
    } catch (err: unknown) {
      console.error('Erro ao carregar questionários:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar questionários';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Carregar questionários
  useEffect(() => {
    loadQuestionnaires();
  }, [loadQuestionnaires]);

  // Carregar preferências de visualização
  useEffect(() => {
    const savedViewMode = localStorage.getItem('questionnaire-view-mode');
    if (savedViewMode && ['grid', 'list', 'table', 'timeline'].includes(savedViewMode)) {
      setViewMode(savedViewMode as 'grid' | 'list' | 'table' | 'timeline');
    }
  }, []);

  // Salvar preferência de visualização
  useEffect(() => {
    localStorage.setItem('questionnaire-view-mode', viewMode);
  }, [viewMode]);

  // Processar dados com filtros e ordenação
  const filteredAndSortedQuestionnaires = useMemo(() => {
    const filtered = questionnaires.filter(q => {
      const matchesSearch = q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           q.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || q.type === filterType;
      return matchesSearch && matchesFilter;
    });

    return filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [questionnaires, searchTerm, filterType, sortBy, sortOrder]);


  const handleRespond = (questionnaire: Questionnaire) => {
    setSelectedQuestionnaire(questionnaire);
    setIsRespondModalOpen(true);
  };

  const handleViewDetails = (questionnaire: Questionnaire) => {
    setSelectedQuestionnaire(questionnaire);
    setIsDetailsModalOpen(true);
  };

  const handleCreateQuestionnaire = () => {
    setModalMode('create');
    setEditingQuestionnaire(null);
    setIsCreateModalOpen(true);
  };

  const handleSaveQuestionnaire = (questionnaireData: {
    title: string;
    description: string;
    type: string;
    estimated_time: number;
    is_active: boolean;
    questions: Array<{
      question: string;
      type: string;
      required: boolean;
      options?: Array<{
        value: string;
        label?: string;
        score?: number;
      }>;
    }>;
  }) => {
    // Armazenar dados e abrir modal de confirmação
    setPendingQuestionnaireData(questionnaireData);
    setIsConfirmModalOpen(true);
  };

  const confirmSaveQuestionnaire = async () => {
    if (!pendingQuestionnaireData) return;
    
    try {
      setCreateLoading(true);
      setIsConfirmModalOpen(false);
      
      // Verificar token atualizado
      const currentToken = useAuthStore.getState().token;
      const currentUser = useAuthStore.getState().user;
      
      console.log('🔍 [confirmSaveQuestionnaire] Token:', !!currentToken);
      console.log('🔍 [confirmSaveQuestionnaire] User:', currentUser ? { id: currentUser.id, name: currentUser.name, role: currentUser.role } : 'null');
      
      if (!currentToken) {
        throw new Error('Token de autenticação não encontrado. Por favor, faça login novamente.');
      }
      
      // Verificar se o usuário tem permissão para criar questionários
      if (!currentUser || !['master', 'admin'].includes(currentUser.role)) {
        throw new Error('Apenas administradores e masters podem criar questionários.');
      }
      
      // Transformar dados do formulário para o formato da API
      const apiData = {
        title: pendingQuestionnaireData.title,
        description: pendingQuestionnaireData.description,
        type: pendingQuestionnaireData.type,
        estimated_time: pendingQuestionnaireData.estimated_time,
        is_active: pendingQuestionnaireData.is_active,
        questions: pendingQuestionnaireData.questions.map((q, index: number) => ({
          question: q.question,
          type: q.type,
          order: index + 1,
          required: q.required,
          is_active: true,
          options: q.options?.map((opt, optIndex: number) => ({
            value: String(opt.value || ''),
            label: String(opt.label || opt.value || ''),
            score: Number(opt.score) || 1,
            order: optIndex + 1
          })) || []
        }))
      };
      
      let actionText;
      let response: Response;
      
      if (modalMode === 'create') {
        // Criar novo questionário
        console.log('Criando questionário:', apiData);
        response = await api.post('/questionnaires', apiData);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          let errorMessage = errorData.message || `Erro HTTP: ${response.status}`;
          
          // Tratar diferentes tipos de erro
          if (response.status === 401) {
            const checkToken = useAuthStore.getState().token;
            if (!checkToken) {
              errorMessage = 'Sua sessão expirou. Por favor, faça login novamente.';
            } else {
              errorMessage = 'Você não tem permissão para criar questionários. Apenas administradores e masters podem criar questionários.';
            }
          } else if (response.status === 403) {
            errorMessage = 'Você não tem permissão para criar questionários. Apenas administradores e masters podem criar questionários.';
          }
          
          throw new Error(errorMessage);
        }
        
        const responseData = await response.json();
        actionText = 'criado';
        console.log('Questionário criado:', responseData);
      } else {
        // Editar questionário existente
        if (!editingQuestionnaire) {
          throw new Error('Questionário para edição não encontrado');
        }
        
        console.log('Editando questionário:', apiData);
        response = await api.put(`/questionnaires/${editingQuestionnaire.id}`, apiData);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          let errorMessage = errorData.message || `Erro HTTP: ${response.status}`;
          
          // Tratar diferentes tipos de erro
          if (response.status === 401) {
            const checkToken = useAuthStore.getState().token;
            if (!checkToken) {
              errorMessage = 'Sua sessão expirou. Por favor, faça login novamente.';
            } else {
              errorMessage = 'Você não tem permissão para editar questionários.';
            }
          } else if (response.status === 403) {
            errorMessage = 'Você não tem permissão para editar questionários.';
          }
          
          throw new Error(errorMessage);
        }
        
        const responseData = await response.json();
        actionText = 'editado';
        console.log('Questionário editado:', responseData);
      }
      
      // Recarregar lista de questionários
      await loadQuestionnaires();
      
      setIsCreateModalOpen(false);
      setEditingQuestionnaire(null);
      setIsSuccessModalOpen(true);
      
    } catch (error: unknown) {
      console.error(`Erro ao ${modalMode === 'create' ? 'criar' : 'editar'} questionário:`, error);
      
      // Capturar erro específico da API
      let errorMsg = `Erro ao ${modalMode === 'create' ? 'criar' : 'editar'} questionário. Tente novamente.`;
      
      if (error instanceof Error) {
        // Verificar se é erro de permissão ou autenticação
        if (error.message.includes('permissão') || error.message.includes('permission')) {
          errorMsg = error.message;
        } else if (error.message.includes('Unauthorized') || error.message.includes('401')) {
          // Verificar se o token ainda existe
          const currentToken = useAuthStore.getState().token;
          if (!currentToken) {
            errorMsg = 'Sua sessão expirou. Por favor, faça login novamente.';
          } else {
            errorMsg = 'Você não tem permissão para esta ação. Apenas administradores e masters podem criar/editar questionários.';
          }
        } else {
          errorMsg = error.message;
        }
      } else if (error && typeof error === 'object') {
        // Tentar extrair mensagem de erro de diferentes formatos
        if ('message' in error && typeof error.message === 'string') {
          errorMsg = error.message;
        } else if ('response' in error && error.response && typeof error.response === 'object') {
          const response = error.response as { data?: { message?: string }; status?: number };
          if (response.data?.message) {
            errorMsg = response.data.message;
          } else if (response.status) {
            errorMsg = `Erro HTTP ${response.status}`;
          }
        }
      }
      
      setErrorMessage(errorMsg);
      setIsErrorModalOpen(true);
    } finally {
      setCreateLoading(false);
      setPendingQuestionnaireData(null);
    }
  };

  const handleCancelCreate = () => {
    setIsCreateModalOpen(false);
    setEditingQuestionnaire(null);
    setModalMode('create');
  };

  const handleEditQuestionnaire = (questionnaire: Questionnaire) => {
    setModalMode('edit');
    setEditingQuestionnaire(questionnaire);
    setIsCreateModalOpen(true);
  };

  const handleToggleActive = async (questionnaire: Questionnaire) => {
    try {
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      await axiosInstance.patch(`/questionnaires/${questionnaire.id}/toggle-active`, {});

      // Recarregar lista de questionários
      await loadQuestionnaires();
      
      console.log(`Questionário ${questionnaire.title} ${questionnaire.is_active ? 'desativado' : 'ativado'} com sucesso`);
      
    } catch (error: unknown) {
      console.error('Erro ao alterar status do questionário:', error);
      
      let errorMsg = 'Erro ao alterar status do questionário. Tente novamente.';
      
      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMsg = String(error.message);
      }
      
      setErrorMessage(errorMsg);
      setIsErrorModalOpen(true);
    }
  };

  const handleNextQuestion = () => {
    if (!selectedQuestionnaire?.questions) return;
    
    if (currentQuestionIndex < selectedQuestionnaire.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Finalizar
      handleSubmitResponse();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleAnswerChange = (value: string) => {
    if (!selectedQuestionnaire?.questions) return;
    
    const currentQuestion = selectedQuestionnaire.questions[currentQuestionIndex];
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleSubmitResponse = async () => {
    if (!selectedQuestionnaire) return;

    try {
      setSubmittingResponse(true);
      
      const response = await api.post(`/questionnaires/${selectedQuestionnaire.id}/respond`, {
        responses: answers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao enviar respostas');
      }

      toast.success('Questionário respondido com sucesso!');
      setIsRespondModalOpen(false);
      
      // Opcional: recarregar dados ou redirecionar
    } catch (error: unknown) {
      console.error('Erro ao enviar respostas:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar respostas. Tente novamente.';
      toast.error(errorMessage);
    } finally {
      setSubmittingResponse(false);
    }
  };

  // Verificar permissões
  const canCreate = hasPermission('questionario.create');
  const canEdit = hasPermission('questionario.edit');
  const canDelete = hasPermission('questionario.delete');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando questionários...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erro ao carregar questionários</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadQuestionnaires}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Questionários"
        description={questionnaires.length > 0 
          ? "Selecione um questionário para responder e gerar seu diagnóstico"
          : "Crie questionários personalizados para coleta de dados"
        }
        icon={FileText}
        badges={[
          { label: `${filteredAndSortedQuestionnaires.length} questionários disponíveis`, icon: Target },
          { label: "Sistema de Diagnósticos Ativo", icon: Activity }
        ]}
        actions={[
          {
            label: canCreate ? "Respostas (Admin)" : "Minhas Respostas",
            icon: List,
            onClick: () => navigate('/meus-questionarios'),
            variant: 'secondary'
          },
          ...(canCreate ? [{
            label: "Criar Questionário", 
            icon: Plus, 
            onClick: handleCreateQuestionnaire,
            variant: 'primary' as const
          }] : [])
        ]}
      />

      {/* Barra de Controles */}
      <div className="bg-background border border-border rounded-lg p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Controles de Visualização */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground mr-2">Visualização:</span>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8"
            >
              <Table className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'timeline' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('timeline')}
              className="h-8"
            >
              <Clock className="w-4 h-4" />
            </Button>
          </div>

          {/* Busca */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar questionários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-8"
              />
            </div>
          </div>

          {/* Filtros e Ordenação */}
          <div className="flex items-center gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="stress">Estresse</SelectItem>
                <SelectItem value="climate">Clima</SelectItem>
                <SelectItem value="burnout">Burnout</SelectItem>
                <SelectItem value="geral">Geral</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'title' | 'created_at' | 'type')}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Nome</SelectItem>
                <SelectItem value="created_at">Data</SelectItem>
                <SelectItem value="type">Tipo</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="h-8 w-8 p-0"
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Renderização Condicional dos Questionários */}
      {filteredAndSortedQuestionnaires.length > 0 ? (
        <>
          {viewMode === 'grid' && (
            <QuestionnaireGrid
              questionnaires={filteredAndSortedQuestionnaires}
              onRespond={handleRespond}
              onViewDetails={handleViewDetails}
              onEdit={handleEditQuestionnaire}
              onDelete={() => {}}
              onToggleActive={handleToggleActive}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          )}
          {viewMode === 'list' && (
            <QuestionnaireList
              questionnaires={filteredAndSortedQuestionnaires}
              onRespond={handleRespond}
              onViewDetails={handleViewDetails}
              onEdit={handleEditQuestionnaire}
              onDelete={() => {}}
              onToggleActive={handleToggleActive}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          )}
          {viewMode === 'table' && (
            <QuestionnaireTable
              questionnaires={filteredAndSortedQuestionnaires}
              onRespond={handleRespond}
              onViewDetails={handleViewDetails}
              onEdit={handleEditQuestionnaire}
              onDelete={() => {}}
              onToggleActive={handleToggleActive}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          )}
          {viewMode === 'timeline' && (
            <QuestionnaireTimeline
              questionnaires={filteredAndSortedQuestionnaires}
              onRespond={handleRespond}
              onViewDetails={handleViewDetails}
              onEdit={handleEditQuestionnaire}
              onDelete={() => {}}
              onToggleActive={handleToggleActive}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          )}
        </>
      ) : questionnaires.length > 0 ? (
        /* Estado de filtro sem resultados */
        <div className="flex items-center justify-center py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nenhum questionário encontrado
            </h3>
            <p className="text-muted-foreground mb-6">
              Tente ajustar os filtros ou termo de busca para encontrar questionários.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      ) : (
        /* Estado vazio original */
        <div className="flex items-center justify-center py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-amber-100 flex items-center justify-center">
                <FileText className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Nenhum questionário criado
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Comece criando seu primeiro questionário personalizado para coleta de dados e geração de diagnósticos.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {canCreate 
                    ? "Use o botão flutuante no canto inferior direito para criar questionários"
                    : "Você não tem permissão para criar questionários. Entre em contato com um administrador."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Responder Questionário */}
      <ModalLayout
        isOpen={isRespondModalOpen}
        onClose={() => setIsRespondModalOpen(false)}
        title={`Responder: ${selectedQuestionnaire?.title}`}
        size="xl"
      >
        {selectedQuestionnaire && (
          <div className="space-y-6">
            <div className="bg-muted p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Tempo estimado:</span>
                  <span className="ml-2 font-medium">{selectedQuestionnaire.estimated_time} minutos</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="ml-2 font-medium">{selectedQuestionnaire.type}</span>
                </div>
              </div>
            </div>
            
            {!selectedQuestionnaire.questions || selectedQuestionnaire.questions.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Este questionário não possui perguntas</h3>
                <p className="text-muted-foreground mb-6">
                  Entre em contato com o administrador para verificar este questionário.
                </p>
                <Button onClick={() => setIsRespondModalOpen(false)}>
                  Fechar
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <span>Questão {currentQuestionIndex + 1} de {selectedQuestionnaire.questions.length}</span>
                  <span>{Math.round(((currentQuestionIndex + 1) / selectedQuestionnaire.questions.length) * 100)}%</span>
                </div>
                <Progress value={((currentQuestionIndex + 1) / selectedQuestionnaire.questions.length) * 100} className="h-2" />
                
                <div className="py-4">
                  <h3 className="text-xl font-medium mb-4">
                    {selectedQuestionnaire.questions[currentQuestionIndex].question}
                    {selectedQuestionnaire.questions[currentQuestionIndex].required && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                  
                  {selectedQuestionnaire.questions[currentQuestionIndex].type === 'text' && (
                    <Textarea 
                      placeholder="Sua resposta..."
                      value={answers[selectedQuestionnaire.questions[currentQuestionIndex].id] || ''}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      rows={4}
                    />
                  )}
                  
                  {/* Renderização de opções para Scale, Choice e Boolean */}
                  {(selectedQuestionnaire.questions[currentQuestionIndex].type === 'choice' || 
                    selectedQuestionnaire.questions[currentQuestionIndex].type === 'multiple_choice' || 
                    selectedQuestionnaire.questions[currentQuestionIndex].type === 'escala' || 
                    selectedQuestionnaire.questions[currentQuestionIndex].type === 'scale' ||
                    selectedQuestionnaire.questions[currentQuestionIndex].type === 'boolean') && (
                    <RadioGroup 
                      value={answers[selectedQuestionnaire.questions[currentQuestionIndex].id] || ''} 
                      onValueChange={handleAnswerChange}
                      className="space-y-3"
                    >
                      {/* Lógica especial para Scale/Escala */}
                      {(selectedQuestionnaire.questions[currentQuestionIndex].type === 'escala' || 
                        selectedQuestionnaire.questions[currentQuestionIndex].type === 'scale') ? (
                        <div className="space-y-3">
                          <div className="flex justify-between text-xs text-muted-foreground mb-2">
                            <span>Muito Ruim</span>
                            <span>Excelente</span>
                          </div>
                          <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
                            {Array.from({ length: 11 }, (_, i) => ({
                              id: `scale-${i}`,
                              value: String(i),
                              label: String(i),
                              score: i,
                              order: i
                            })).map((option) => (
                              <div key={option.value} className="flex flex-col items-center">
                                <RadioGroupItem 
                                  value={option.value} 
                                  id={`scale-${option.value}`} 
                                  className="mb-1" 
                                />
                                <Label 
                                  htmlFor={`scale-${option.value}`} 
                                  className="cursor-pointer text-xs text-center font-medium"
                                >
                                  {option.value}
                                </Label>
                              </div>
                            ))}
                          </div>
                          <div className="text-center mt-3">
                            {answers[selectedQuestionnaire.questions[currentQuestionIndex].id] && (
                              <span className="text-sm font-medium text-primary">
                                Nota selecionada: {answers[selectedQuestionnaire.questions[currentQuestionIndex].id]}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Lógica padrão para Choice/Boolean */
                        selectedQuestionnaire.questions[currentQuestionIndex].options.map((option) => (
                          <div key={option.id} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 cursor-pointer" onClick={() => handleAnswerChange(option.value)}>
                            <RadioGroupItem value={option.value} id={`option-${option.id}`} />
                            <Label htmlFor={`option-${option.id}`} className="flex-1 cursor-pointer font-normal">
                              {option.label || option.value}
                            </Label>
                          </div>
                        ))
                      )}
                    </RadioGroup>
                  )}
                </div>
                
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0 || submittingResponse}
                  >
                    Anterior
                  </Button>
                  
                  <Button
                    onClick={handleNextQuestion}
                    disabled={
                      (selectedQuestionnaire.questions[currentQuestionIndex].required && !answers[selectedQuestionnaire.questions[currentQuestionIndex].id]) || 
                      submittingResponse
                    }
                  >
                    {submittingResponse ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enviando...
                      </>
                    ) : currentQuestionIndex === selectedQuestionnaire.questions.length - 1 ? (
                      'Finalizar'
                    ) : (
                      'Próxima'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </ModalLayout>

      {/* Modal para Ver Detalhes */}
      <ModalLayout
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Detalhes: ${selectedQuestionnaire?.title}`}
        size="lg"
      >
        {selectedQuestionnaire && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Título</h4>
                  <p className="text-lg font-semibold">{selectedQuestionnaire.title}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Descrição</h4>
                  <p className="text-sm">{selectedQuestionnaire.description || 'Sem descrição'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Tipo</h4>
                  <Badge variant="outline">{selectedQuestionnaire.type}</Badge>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Status</h4>
                  <Badge variant={selectedQuestionnaire.is_active ? "default" : "secondary"}>
                    {selectedQuestionnaire.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Criado em</h4>
                  <p className="text-sm">{new Date(selectedQuestionnaire.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Última atualização</h4>
                  <p className="text-sm">{new Date(selectedQuestionnaire.updated_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Perguntas</span>
                </div>
                <p className="text-2xl font-bold text-primary">{selectedQuestionnaire.questions_count}</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Tempo Estimado</span>
                </div>
                <p className="text-2xl font-bold text-primary">{selectedQuestionnaire.estimated_time} min</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  handleRespond(selectedQuestionnaire);
                }}
                className="flex-1"
                disabled={!selectedQuestionnaire.is_active}
              >
                <Play className="w-4 h-4 mr-2" />
                Responder Questionário
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </ModalLayout>

      {/* Modal para Criar/Editar Questionário */}
      <ModalLayout
        isOpen={isCreateModalOpen}
        onClose={handleCancelCreate}
        title={modalMode === 'create' ? "Criar Questionário" : "Editar Questionário"}
        size="xl"
        className="max-h-[90vh] overflow-y-auto"
      >
        <CreateQuestionnaireForm
          mode={modalMode}
          initialData={editingQuestionnaire}
          onSave={handleSaveQuestionnaire}
          onCancel={handleCancelCreate}
          loading={createLoading}
        />
      </ModalLayout>

      {/* Modal de Confirmação */}
      <ModalLayout
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirmar Criação"
        size="md"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {modalMode === 'create' ? 'Criar Questionário' : 'Editar Questionário'}
              </h3>
              <p className="text-muted-foreground">
                {modalMode === 'create' 
                  ? 'Tem certeza que deseja criar este questionário?'
                  : 'Tem certeza que deseja salvar as alterações?'
                }
              </p>
            </div>
          </div>
          
          {pendingQuestionnaireData && (
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Detalhes do Questionário:</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Título:</strong> {pendingQuestionnaireData.title}</p>
                <p><strong>Tipo:</strong> {pendingQuestionnaireData.type}</p>
                <p><strong>Perguntas:</strong> {pendingQuestionnaireData.questions?.length || 0}</p>
                <p><strong>Tempo estimado:</strong> {pendingQuestionnaireData.estimated_time} minutos</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsConfirmModalOpen(false)}
              className="flex-1"
              disabled={createLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmSaveQuestionnaire}
              className="flex-1 bg-gradient-to-r from-primary via-primary/90 to-accent"
              disabled={createLoading}
            >
              {createLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {modalMode === 'create' ? 'Criando...' : 'Salvando...'}
                </>
              ) : (
                modalMode === 'create' ? 'Criar' : 'Salvar'
              )}
            </Button>
          </div>
        </div>
      </ModalLayout>

      {/* Modal de Sucesso */}
      <ModalLayout
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Sucesso!"
        size="md"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {modalMode === 'create' ? 'Questionário Criado!' : 'Questionário Atualizado!'}
              </h3>
              <p className="text-muted-foreground">
                {modalMode === 'create' 
                  ? 'O questionário foi criado com sucesso e já está disponível na lista.'
                  : 'As alterações foram salvas com sucesso e já estão visíveis na lista.'
                }
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={() => setIsSuccessModalOpen(false)}
              className="bg-gradient-to-r from-primary via-primary/90 to-accent"
            >
              <Check className="w-4 h-4 mr-2" />
              OK
            </Button>
          </div>
        </div>
      </ModalLayout>

      {/* Modal de Erro */}
      <ModalLayout
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        title="Erro ao Criar Questionário"
        size="md"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Erro na Criação
              </h3>
              <p className="text-muted-foreground">
                Ocorreu um erro ao criar o questionário.
              </p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">Detalhes do erro:</h4>
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsErrorModalOpen(false)}
              className="flex-1"
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                setIsErrorModalOpen(false);
                setIsCreateModalOpen(true);
              }}
              className="flex-1"
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      </ModalLayout>

      {/* Botão Flutuante para Criar Questionário */}
      {canCreate && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={handleCreateQuestionnaire}
            size="lg"
            className="h-14 w-14 rounded-full bg-gradient-to-r from-primary via-primary/90 to-accent hover:from-primary/90 hover:via-primary/80 hover:to-accent/90 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      )}
    </div>
  );
}
