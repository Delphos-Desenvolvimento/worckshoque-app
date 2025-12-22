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
  Settings
} from 'lucide-react';

// Mock data para diagnósticos globais
const mockDiagnosticos = [
  {
    id: '1',
    titulo: 'Diagnóstico de Estresse Organizacional',
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
    diagnosticoId: '1',
    pergunta: 'Como você avalia seu nível de estresse no trabalho?',
    tipo: 'escala',
    ordem: 1,
    opcoes: ['Muito baixo', 'Baixo', 'Médio', 'Alto', 'Muito alto']
  },
  {
    id: '2',
    diagnosticoId: '1',
    pergunta: 'Você se sente sobrecarregado com suas responsabilidades?',
    tipo: 'multipla_escolha',
    ordem: 2,
    opcoes: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre']
  }
];

const mockEstatisticas = {
  totalDiagnosticos: 3,
  diagnosticosAtivos: 2,
  totalRespostas: 4295,
  empresasParticipantes: 12,
  mediaRespostasPorDiagnostico: 1431.7,
  crescimentoMensal: 8.5
};

export default function DiagnosticosGlobais() {
  const [diagnosticos, setDiagnosticos] = useState(mockDiagnosticos);
  const [perguntas, setPerguntas] = useState(mockPerguntas);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPerguntasDialogOpen, setIsPerguntasDialogOpen] = useState(false);
  const [selectedDiagnostico, setSelectedDiagnostico] = useState(null);
  const [editingDiagnostico, setEditingDiagnostico] = useState(null);

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

  const handleCreateDiagnostico = () => {
    const newDiagnostico = {
      id: Date.now().toString(),
      ...formData,
      totalPerguntas: 0,
      empresasUsando: 0,
      respostasTotais: 0,
      dataCriacao: new Date().toISOString().split('T')[0],
      ultimaAtualizacao: new Date().toISOString().split('T')[0],
      criadoPor: 'Sistema Master'
    };
    setDiagnosticos([...diagnosticos, newDiagnostico]);
    setFormData({ titulo: '', descricao: '', tipo: '', status: 'ativo' });
    setIsCreateDialogOpen(false);
  };

  const handleEditDiagnostico = (diagnostico) => {
    setEditingDiagnostico(diagnostico);
    setFormData({
      titulo: diagnostico.titulo,
      descricao: diagnostico.descricao,
      tipo: diagnostico.tipo,
      status: diagnostico.status
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateDiagnostico = () => {
    setDiagnosticos(diagnosticos.map(d => 
      d.id === editingDiagnostico.id 
        ? { ...d, ...formData, ultimaAtualizacao: new Date().toISOString().split('T')[0] }
        : d
    ));
    setEditingDiagnostico(null);
    setFormData({ titulo: '', descricao: '', tipo: '', status: 'ativo' });
    setIsEditDialogOpen(false);
  };

  const handleDeleteDiagnostico = (id) => {
    setDiagnosticos(diagnosticos.filter(d => d.id !== id));
  };

  const handleToggleStatus = (id) => {
    setDiagnosticos(diagnosticos.map(d => 
      d.id === id 
        ? { ...d, status: d.status === 'ativo' ? 'inativo' : 'ativo' }
        : d
    ));
  };

  const handleViewPerguntas = (diagnostico) => {
    setSelectedDiagnostico(diagnostico);
    setIsPerguntasDialogOpen(true);
  };

  const filteredDiagnosticos = diagnosticos.filter(diagnostico => {
    const matchesSearch = diagnostico.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         diagnostico.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'todos' || diagnostico.status === filterStatus;
    const matchesTipo = filterTipo === 'todos' || diagnostico.tipo === filterTipo;
    
    return matchesSearch && matchesStatus && matchesTipo;
  });

  const getStatusBadge = (status) => {
    return status === 'ativo' 
      ? <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>
      : <Badge variant="secondary" className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />Inativo</Badge>;
  };

  const getTipoBadge = (tipo) => {
    const tipos = {
      'estresse': { label: 'Estresse', color: 'bg-red-100 text-red-800' },
      'clima': { label: 'Clima', color: 'bg-blue-100 text-blue-800' },
      'burnout': { label: 'Burnout', color: 'bg-orange-100 text-orange-800' }
    };
    const tipoInfo = tipos[tipo] || { label: tipo, color: 'bg-gray-100 text-gray-800' };
    return <Badge variant="outline" className={tipoInfo.color}>{tipoInfo.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Diagnósticos Globais</h1>
          <p className="text-gray-600 mt-1">Gerencie os questionários de diagnóstico disponíveis para todas as empresas</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Diagnóstico
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Diagnósticos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockEstatisticas.totalDiagnosticos}</div>
            <p className="text-xs text-muted-foreground">
              {mockEstatisticas.diagnosticosAtivos} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Respostas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockEstatisticas.totalRespostas.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{mockEstatisticas.crescimentoMensal}% este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Participantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockEstatisticas.empresasParticipantes}</div>
            <p className="text-xs text-muted-foreground">
              Média: {mockEstatisticas.mediaRespostasPorDiagnostico.toFixed(0)} respostas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Participação</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.3%</div>
            <p className="text-xs text-muted-foreground">
              +5.2% vs mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar por título ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="min-w-[150px]">
              <Label htmlFor="status">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[150px]">
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="estresse">Estresse</SelectItem>
                  <SelectItem value="clima">Clima</SelectItem>
                  <SelectItem value="burnout">Burnout</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Diagnósticos */}
      <Card>
        <CardHeader>
          <CardTitle>Diagnósticos Disponíveis</CardTitle>
          <CardDescription>
            {filteredDiagnosticos.length} diagnóstico(s) encontrado(s)
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
              {filteredDiagnosticos.map((diagnostico) => (
                <TableRow key={diagnostico.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{diagnostico.titulo}</div>
                      <div className="text-sm text-gray-500">{diagnostico.descricao}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getTipoBadge(diagnostico.tipo)}</TableCell>
                  <TableCell>{getStatusBadge(diagnostico.status)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{diagnostico.totalPerguntas} perguntas</Badge>
                  </TableCell>
                  <TableCell>{diagnostico.empresasUsando}</TableCell>
                  <TableCell>{diagnostico.respostasTotais.toLocaleString()}</TableCell>
                  <TableCell>{diagnostico.ultimaAtualizacao}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewPerguntas(diagnostico)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditDiagnostico(diagnostico)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(diagnostico.id)}
                      >
                        {diagnostico.status === 'ativo' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDiagnostico(diagnostico.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para Criar Diagnóstico */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Diagnóstico</DialogTitle>
            <DialogDescription>
              Crie um novo questionário de diagnóstico para ser usado por todas as empresas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Digite o título do diagnóstico"
              />
            </div>
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva o objetivo do diagnóstico"
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
            <Button onClick={handleCreateDiagnostico}>
              <Save className="w-4 h-4 mr-2" />
              Criar Diagnóstico
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Editar Diagnóstico */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Diagnóstico</DialogTitle>
            <DialogDescription>
              Edite as informações do diagnóstico selecionado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-titulo">Título</Label>
              <Input
                id="edit-titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Digite o título do diagnóstico"
              />
            </div>
            <div>
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Textarea
                id="edit-descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva o objetivo do diagnóstico"
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
            <Button onClick={handleUpdateDiagnostico}>
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
            <DialogTitle>Perguntas do Diagnóstico</DialogTitle>
            <DialogDescription>
              {selectedDiagnostico?.titulo} - {selectedDiagnostico?.totalPerguntas} perguntas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Lista de Perguntas</h3>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Pergunta
              </Button>
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
                {perguntas.filter(p => p.diagnosticoId === selectedDiagnostico?.id).map((pergunta) => (
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
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
