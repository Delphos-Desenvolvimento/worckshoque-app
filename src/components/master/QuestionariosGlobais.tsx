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

// Mock data para questionários globais
const mockQuestionarios = [
  {
    id: '1',
    titulo: 'Questionário de Estresse Organizacional',
    descricao: 'Avalia o nível de estresse dos colaboradores e identifica fatores de risco',
    tipo: 'estresse',
    status: 'ativo',
    totalPerguntas: 25,
    empresasUsando: 8,
    respostasTotais: 1247,
    dataCriacao: '2024-01-15',
    ultimaAtualizacao: '2024-01-20',
    criadoPor: 'Sistema Master'
  },
  {
    id: '2',
    titulo: 'Clima Organizacional - Q1 2024',
    descricao: 'Pesquisa de clima organizacional para o primeiro trimestre',
    tipo: 'clima',
    status: 'ativo',
    totalPerguntas: 30,
    empresasUsando: 12,
    respostasTotais: 2156,
    dataCriacao: '2024-01-10',
    ultimaAtualizacao: '2024-01-18',
    criadoPor: 'Sistema Master'
  },
  {
    id: '3',
    titulo: 'Burnout e Sobrecarga de Trabalho',
    descricao: 'Identifica sinais de burnout e sobrecarga nos colaboradores',
    tipo: 'burnout',
    status: 'inativo',
    totalPerguntas: 20,
    empresasUsando: 5,
    respostasTotais: 892,
    dataCriacao: '2023-12-01',
    ultimaAtualizacao: '2023-12-15',
    criadoPor: 'Sistema Master'
  }
];

const mockPerguntas = [
  {
    id: '1',
    questionarioId: '1',
    pergunta: 'Como você avalia seu nível de estresse no trabalho?',
    tipo: 'escala',
    ordem: 1,
    opcoes: ['Muito baixo', 'Baixo', 'Médio', 'Alto', 'Muito alto']
  },
  {
    id: '2',
    questionarioId: '1',
    pergunta: 'Você se sente sobrecarregado com suas responsabilidades?',
    tipo: 'multipla_escolha',
    ordem: 2,
    opcoes: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre']
  }
];

const mockEstatisticas = {
  totalQuestionarios: 3,
  questionariosAtivos: 2,
  totalPerguntas: 75,
  mediaRespostasPorQuestionario: 1431.7,
  crescimentoMensal: 8.5
};

export default function QuestionariosGlobais() {
  const { hasPermission } = usePermissions();
  const [questionarios, setQuestionarios] = useState(mockQuestionarios);
  const [perguntas, setPerguntas] = useState(mockPerguntas);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPerguntasDialogOpen, setIsPerguntasDialogOpen] = useState(false);
  const [selectedQuestionario, setSelectedQuestionario] = useState(null);
  const [editingQuestionario, setEditingQuestionario] = useState(null);

  // Estados para formulários
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipo: '',
    status: 'ativo'
  });

  const [perguntaForm, setPerguntaForm] = useState({
    pergunta: '',
    tipo: 'escala',
    ordem: 1,
    opcoes: []
  });

  const handleCreateQuestionario = () => {
    const newQuestionario = {
      id: Date.now().toString(),
      ...formData,
      totalPerguntas: 0,
      empresasUsando: 0,
      respostasTotais: 0,
      dataCriacao: new Date().toISOString().split('T')[0],
      ultimaAtualizacao: new Date().toISOString().split('T')[0],
      criadoPor: 'Sistema Master'
    };
    setQuestionarios([...questionarios, newQuestionario]);
    setFormData({ titulo: '', descricao: '', tipo: '', status: 'ativo' });
    setIsCreateDialogOpen(false);
  };

  const handleEditQuestionario = (questionario) => {
    setEditingQuestionario(questionario);
    setFormData({
      titulo: questionario.titulo,
      descricao: questionario.descricao,
      tipo: questionario.tipo,
      status: questionario.status
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateQuestionario = () => {
    const updatedQuestionarios = questionarios.map(q => 
      q.id === editingQuestionario.id 
        ? { ...q, ...formData, ultimaAtualizacao: new Date().toISOString().split('T')[0] }
        : q
    );
    setQuestionarios(updatedQuestionarios);
    setEditingQuestionario(null);
    setIsEditDialogOpen(false);
  };

  const handleDeleteQuestionario = (questionarioId) => {
    setQuestionarios(questionarios.filter(q => q.id !== questionarioId));
  };

  const handleViewPerguntas = (questionario) => {
    setSelectedQuestionario(questionario);
    setIsPerguntasDialogOpen(true);
  };

  const filteredQuestionarios = questionarios.filter(questionario => {
    const matchesSearch = questionario.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         questionario.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'todos' || questionario.status === filterStatus;
    const matchesTipo = filterTipo === 'todos' || questionario.tipo === filterTipo;
    
    return matchesSearch && matchesStatus && matchesTipo;
  });

  const getTipoBadge = (tipo) => {
    const tipos = {
      estresse: { label: 'Estresse', color: 'bg-red-100 text-red-800' },
      clima: { label: 'Clima', color: 'bg-blue-100 text-blue-800' },
      burnout: { label: 'Burnout', color: 'bg-orange-100 text-orange-800' }
    };
    const tipoInfo = tipos[tipo] || { label: tipo, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={tipoInfo.color}>{tipoInfo.label}</Badge>;
  };

  const getStatusBadge = (status) => {
    const statuses = {
      ativo: { label: 'Ativo', color: 'bg-green-100 text-green-800' },
      inativo: { label: 'Inativo', color: 'bg-gray-100 text-gray-800' }
    };
    const statusInfo = statuses[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
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
            <div className="text-2xl font-bold">{mockEstatisticas.totalQuestionarios}</div>
            <p className="text-xs text-muted-foreground">Questionários</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockEstatisticas.questionariosAtivos}</div>
            <p className="text-xs text-muted-foreground">Em uso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perguntas</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockEstatisticas.totalPerguntas}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Respostas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(mockEstatisticas.mediaRespostasPorQuestionario)}</div>
            <p className="text-xs text-muted-foreground">Média por questionário</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{mockEstatisticas.crescimentoMensal}%</div>
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
                <TableHead>Empresas</TableHead>
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
                      <div className="font-medium">{questionario.titulo}</div>
                      <div className="text-sm text-gray-500">{questionario.descricao}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getTipoBadge(questionario.tipo)}</TableCell>
                  <TableCell>{getStatusBadge(questionario.status)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{questionario.totalPerguntas} perguntas</Badge>
                  </TableCell>
                  <TableCell>{questionario.empresasUsando}</TableCell>
                  <TableCell>{questionario.respostasTotais.toLocaleString()}</TableCell>
                  <TableCell>{questionario.ultimaAtualizacao}</TableCell>
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
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Digite o título do questionário"
              />
            </div>
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva o objetivo do questionário"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
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
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
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
              <Label htmlFor="edit-titulo">Título</Label>
              <Input
                id="edit-titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Digite o título do questionário"
              />
            </div>
            <div>
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Textarea
                id="edit-descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva o objetivo do questionário"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-tipo">Tipo</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
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
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
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
              {selectedQuestionario?.titulo} - {selectedQuestionario?.totalPerguntas} perguntas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Lista de Perguntas</h3>
              {hasPermission('questionario.edit') && (
                <Button size="sm">
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
                {perguntas.filter(p => p.questionarioId === selectedQuestionario?.id).map((pergunta) => (
                  <TableRow key={pergunta.id}>
                    <TableCell>{pergunta.ordem}</TableCell>
                    <TableCell>{pergunta.pergunta}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {pergunta.tipo === 'escala' ? 'Escala' : 'Múltipla Escolha'}
                      </Badge>
                    </TableCell>
                    <TableCell>{pergunta.opcoes.length} opções</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {hasPermission('questionario.edit') && (
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {hasPermission('questionario.delete') && (
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
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
    </div>
  );
}
