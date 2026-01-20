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
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Search, 
  Filter,
  Save,
  X,
  Eye,
  EyeOff,
  Users,
  Calendar,
  BarChart3,
  TrendingUp,
  Activity,
  Target,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Upload,
  Settings,
  HelpCircle
} from 'lucide-react';
import { usePermissions } from '@/contexts/PermissionsContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Questionnaire {
  id: string;
  title: string;
  description: string;
  type: string;
  is_active: boolean;
  questions_count?: number;
  responses_count?: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  questions?: Question[];
}

interface Question {
  id: string;
  question: string;
  type: string;
  order: number;
  options?: QuestionOption[];
}

interface QuestionOption {
  value: string;
  label: string;
  score?: number;
}

interface Statistics {
  totalQuestionarios: number;
  questionariosAtivos: number;
  totalPerguntas: number;
  mediaRespostasPorQuestionario: number;
  crescimentoMensal: number;
}

export default function QuestionariosGlobais() {
  const { hasPermission } = usePermissions();
  const [questionarios, setQuestionarios] = useState<Questionnaire[]>([]);
  const [estatisticas, setEstatisticas] = useState<Statistics>({
    totalQuestionarios: 0,
    questionariosAtivos: 0,
    totalPerguntas: 0,
    mediaRespostasPorQuestionario: 0,
    crescimentoMensal: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPerguntasDialogOpen, setIsPerguntasDialogOpen] = useState(false);
  const [selectedQuestionario, setSelectedQuestionario] = useState<Questionnaire | null>(null);
  const [editingQuestionario, setEditingQuestionario] = useState<Questionnaire | null>(null);

  // Estados para formulários
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    is_active: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [questionariosRes, statsRes] = await Promise.all([
        api.get('/questionnaires'),
        api.get('/questionnaires/statistics')
      ]);

      const questionariosData = await questionariosRes.json();
      const statsData = await statsRes.json();

      if (questionariosData) {
        setQuestionarios(questionariosData.map((q: Questionnaire & { questions?: unknown[]; _count?: { responses: number } }) => ({
          ...q,
          questions_count: q.questions?.length || 0,
          responses_count: q._count?.responses || 0
        })));
      }

      if (statsData) {
        setEstatisticas(statsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar questionários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [perguntaForm, setPerguntaForm] = useState({
    question: '',
    type: 'escala',
    order: 1,
    options: [] as QuestionOption[]
  });

  const handleCreateQuestionario = async () => {
    try {
      await api.post('/questionnaires', {
        ...formData,
        questions: []
      });
      toast.success('Questionário criado com sucesso');
      setIsCreateDialogOpen(false);
      setFormData({ title: '', description: '', type: '', is_active: true });
      fetchData();
    } catch (error) {
      console.error('Erro ao criar questionário:', error);
      toast.error('Erro ao criar questionário');
    }
  };

  const handleEditQuestionario = (questionario: Questionnaire) => {
    setEditingQuestionario(questionario);
    setFormData({
      title: questionario.title,
      description: questionario.description,
      type: questionario.type,
      is_active: questionario.is_active
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateQuestionario = async () => {
    if (!editingQuestionario) return;

    try {
      await api.put(`/questionnaires/${editingQuestionario.id}`, formData);
      toast.success('Questionário atualizado com sucesso');
      setIsEditDialogOpen(false);
      setEditingQuestionario(null);
      fetchData();
    } catch (error) {
      console.error('Erro ao atualizar questionário:', error);
      toast.error('Erro ao atualizar questionário');
    }
  };

  const handleDeleteQuestionario = async (questionarioId: string) => {
    if (!confirm('Tem certeza que deseja excluir este questionário?')) return;

    try {
      await api.delete(`/questionnaires/${questionarioId}`);
      toast.success('Questionário excluído com sucesso');
      fetchData();
    } catch (error) {
      console.error('Erro ao excluir questionário:', error);
      toast.error('Erro ao excluir questionário');
    }
  };

  const handleViewPerguntas = async (questionario: Questionnaire) => {
    try {
      // Fetch detailed questionnaire with questions
      const res = await api.get(`/questionnaires/${questionario.id}`);
      const data = await res.json();
      if (data) {
        setSelectedQuestionario(data);
        setIsPerguntasDialogOpen(true);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      toast.error('Erro ao carregar detalhes do questionário');
    }
  };

  const handleAddQuestion = () => {
    const nextOrder = (selectedQuestionario?.questions?.length || 0) + 1;
    setPerguntaForm({
      question: '',
      type: 'escala',
      order: nextOrder,
      options: []
    });
    setEditingQuestion(null);
    setIsQuestionDialogOpen(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setPerguntaForm({
      question: question.question,
      type: question.type,
      order: question.order,
      options: question.options || []
    });
    setIsQuestionDialogOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!selectedQuestionario) return;

    try {
      const updatedQuestions = [...(selectedQuestionario.questions || [])];
      
      if (editingQuestion) {
        // Update existing question
        const index = updatedQuestions.findIndex(q => q.id === editingQuestion.id);
        if (index !== -1) {
          updatedQuestions[index] = {
            ...editingQuestion,
            ...perguntaForm
          };
        }
      } else {
        // Add new question
        updatedQuestions.push({
          id: `temp-${Date.now()}`, // Temporary ID until saved
          ...perguntaForm
        });
      }

      // Sort by order
      updatedQuestions.sort((a, b) => a.order - b.order);

      // Save to backend
      await api.put(`/questionnaires/${selectedQuestionario.id}`, {
        title: selectedQuestionario.title,
        description: selectedQuestionario.description,
        type: selectedQuestionario.type,
        is_active: selectedQuestionario.is_active,
        questions: updatedQuestions
      });

      toast.success(editingQuestion ? 'Pergunta atualizada' : 'Pergunta adicionada');
      setIsQuestionDialogOpen(false);
      
      // Refresh data
      const res = await api.get(`/questionnaires/${selectedQuestionario.id}`);
      const data = await res.json();
      if (data) {
        setSelectedQuestionario(data);
      }
      fetchData(); // Refresh list stats
    } catch (error) {
      console.error('Erro ao salvar pergunta:', error);
      toast.error('Erro ao salvar pergunta');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!selectedQuestionario || !confirm('Tem certeza que deseja excluir esta pergunta?')) return;

    try {
      const updatedQuestions = selectedQuestionario.questions?.filter(q => q.id !== questionId) || [];
      
      // Reorder remaining questions
      const reorderedQuestions = updatedQuestions.map((q, index) => ({
        ...q,
        order: index + 1
      }));

      await api.put(`/questionnaires/${selectedQuestionario.id}`, {
        title: selectedQuestionario.title,
        description: selectedQuestionario.description,
        type: selectedQuestionario.type,
        is_active: selectedQuestionario.is_active,
        questions: reorderedQuestions
      });

      toast.success('Pergunta excluída');
      
      // Refresh data
      const res = await api.get(`/questionnaires/${selectedQuestionario.id}`);
      const data = await res.json();
      if (data) {
        setSelectedQuestionario(data);
      }
      fetchData();
    } catch (error) {
      console.error('Erro ao excluir pergunta:', error);
      toast.error('Erro ao excluir pergunta');
    }
  };

  const filteredQuestionarios = questionarios.filter(questionario => {
    const matchesSearch = questionario.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         questionario.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'todos' || 
      (filterStatus === 'ativo' ? questionario.is_active : !questionario.is_active);
    const matchesTipo = filterTipo === 'todos' || questionario.type === filterTipo;
    
    return matchesSearch && matchesStatus && matchesTipo;
  });

  const getTipoBadge = (tipo: string) => {
    const tipos: Record<string, { label: string; color: string }> = {
      estresse: { label: 'Estresse', color: 'bg-red-100 text-red-800' },
      clima: { label: 'Clima', color: 'bg-blue-100 text-blue-800' },
      burnout: { label: 'Burnout', color: 'bg-orange-100 text-orange-800' }
    };
    const tipoInfo = tipos[tipo] || { label: tipo, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={tipoInfo.color}>{tipoInfo.label}</Badge>;
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge className="bg-green-100 text-green-800">Ativo</Badge>
      : <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Questionários Globais</h1>
          <p className="text-muted-foreground">
            Gerencie questionários disponíveis para todas as empresas
          </p>
        </div>
        {hasPermission('questionario.create') && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Questionário
          </Button>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.totalQuestionarios}</div>
            <p className="text-xs text-muted-foreground">Questionários</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.questionariosAtivos}</div>
            <p className="text-xs text-muted-foreground">Em uso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perguntas</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.totalPerguntas}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Respostas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(estatisticas.mediaRespostasPorQuestionario)}</div>
            <p className="text-xs text-muted-foreground">Média por questionário</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{estatisticas.crescimentoMensal}%</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar questionários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="estresse">Estresse</SelectItem>
                <SelectItem value="clima">Clima</SelectItem>
                <SelectItem value="burnout">Burnout</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Questionários */}
      <Card>
        <CardHeader>
          <CardTitle>Questionários Disponíveis</CardTitle>
          <CardDescription>
            Gerencie os questionários que serão utilizados para coleta de dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Perguntas</TableHead>
                <TableHead>Respostas</TableHead>
                <TableHead>Última Atualização</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuestionarios.map((questionario) => (
                <TableRow key={questionario.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{questionario.title}</div>
                      <div className="text-sm text-gray-500">{questionario.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getTipoBadge(questionario.type)}</TableCell>
                  <TableCell>{getStatusBadge(questionario.is_active)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{questionario.questions_count} perguntas</Badge>
                  </TableCell>
                  <TableCell>{questionario.responses_count}</TableCell>
                  <TableCell>{new Date(questionario.updated_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {hasPermission('questionario.view') && (
                        <Button variant="ghost" size="sm" onClick={() => handleViewPerguntas(questionario)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {hasPermission('questionario.edit') && (
                        <Button variant="ghost" size="sm" onClick={() => handleEditQuestionario(questionario)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {hasPermission('questionario.delete') && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteQuestionario(questionario.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para Criar Questionário */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Questionário</DialogTitle>
            <DialogDescription>
              Crie um novo questionário para ser usado por todas as empresas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Digite o título do questionário"
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o objetivo do questionário"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="estresse">Estresse</SelectItem>
                    <SelectItem value="clima">Clima</SelectItem>
                    <SelectItem value="burnout">Burnout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.is_active ? 'ativo' : 'inativo'} 
                  onValueChange={(value) => setFormData({ ...formData, is_active: value === 'ativo' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateQuestionario}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Questionário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Editar Questionário */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Questionário</DialogTitle>
            <DialogDescription>
              Edite as informações do questionário selecionado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Título</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Digite o título do questionário"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o objetivo do questionário"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-type">Tipo</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="estresse">Estresse</SelectItem>
                    <SelectItem value="clima">Clima</SelectItem>
                    <SelectItem value="burnout">Burnout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={formData.is_active ? 'ativo' : 'inativo'} 
                  onValueChange={(value) => setFormData({ ...formData, is_active: value === 'ativo' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateQuestionario}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Visualizar Perguntas */}
      <Dialog open={isPerguntasDialogOpen} onOpenChange={setIsPerguntasDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Perguntas do Questionário</DialogTitle>
            <DialogDescription>
              {selectedQuestionario?.title} - {selectedQuestionario?.questions_count} perguntas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Lista de Perguntas</h3>
              {hasPermission('questionario.edit') && (
                <Button size="sm" onClick={handleAddQuestion}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Pergunta
                </Button>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Pergunta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Opções</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedQuestionario?.questions?.map((pergunta) => (
                  <TableRow key={pergunta.id}>
                    <TableCell>{pergunta.order}</TableCell>
                    <TableCell>{pergunta.question}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {pergunta.type === 'escala' ? 'Escala' : 'Múltipla Escolha'}
                      </Badge>
                    </TableCell>
                    <TableCell>{pergunta.options?.length || 0} opções</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {hasPermission('questionario.edit') && (
                          <Button variant="ghost" size="sm" onClick={() => handleEditQuestion(pergunta)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {hasPermission('questionario.delete') && (
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteQuestion(pergunta.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPerguntasDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Adicionar/Editar Pergunta */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Editar Pergunta' : 'Nova Pergunta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Pergunta</Label>
              <Input
                value={perguntaForm.question}
                onChange={(e) => setPerguntaForm({ ...perguntaForm, question: e.target.value })}
                placeholder="Digite a pergunta"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select 
                  value={perguntaForm.type} 
                  onValueChange={(value) => setPerguntaForm({ ...perguntaForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="escala">Escala (1-5)</SelectItem>
                    <SelectItem value="multipla_escolha">Múltipla Escolha</SelectItem>
                    <SelectItem value="texto">Texto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={perguntaForm.order}
                  onChange={(e) => setPerguntaForm({ ...perguntaForm, order: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            
            {perguntaForm.type === 'multipla_escolha' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Opções</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPerguntaForm({
                      ...perguntaForm,
                      options: [
                        ...perguntaForm.options,
                        { value: '', label: '', score: 0 }
                      ]
                    })}
                  >
                    Adicionar Opção
                  </Button>
                </div>
                {perguntaForm.options.map((option, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder="Opção"
                      value={option.label}
                      onChange={(e) => {
                        const newOptions = [...perguntaForm.options];
                        newOptions[index] = { 
                          ...option, 
                          label: e.target.value,
                          value: e.target.value.toLowerCase().replace(/\s+/g, '_')
                        };
                        setPerguntaForm({ ...perguntaForm, options: newOptions });
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newOptions = perguntaForm.options.filter((_, i) => i !== index);
                        setPerguntaForm({ ...perguntaForm, options: newOptions });
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveQuestion}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
