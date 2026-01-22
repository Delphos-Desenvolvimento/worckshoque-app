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
import { 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Target, 
  Search, 
  Filter,
  Save,
  X,
  Eye,
  EyeOff,
  Users,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Download,
  RefreshCw,
  Clock,
  Activity,
  Brain,
  Zap,
  Home,
  Award,
  Trophy,
  Star,
  Crown,
  Flame,
  Zap as ZapIcon,
  Lightbulb,
  BookOpen,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon
} from 'lucide-react';
import { usePermissions } from '@/contexts/PermissionsContext';

// Interfaces
interface PlanoAcao {
  id: string;
  titulo: string;
  descricao: string;
  categoria: 'saude_mental' | 'produtividade' | 'equilibrio' | 'desenvolvimento' | 'bem_estar' | 'carreira';
  nivel: 'iniciante' | 'intermediario' | 'avancado' | 'expert';
  duracao: number; // em dias
  dificuldade: 'facil' | 'medio' | 'dificil' | 'expert';
  pontos: number;
  status: 'ativo' | 'inativo' | 'arquivado' | 'em_revisao';
  tags: string[];
  passos: {
    id: string;
    titulo: string;
    descricao: string;
    concluido: boolean;
    ordem: number;
  }[];
  criadoPor: string;
  dataCriacao: string;
  dataAtualizacao: string;
  usuariosAtivos: number;
  taxaConclusao: number;
  avaliacao: number;
  observacoes?: string;
}

interface Conquista {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  categoria: 'diagnostico' | 'plano' | 'consistencia' | 'melhoria' | 'social' | 'especial';
  nivel: 'bronze' | 'prata' | 'ouro' | 'diamante' | 'lendario';
  pontos: number;
  requisitos: {
    tipo: 'diagnosticos_completos' | 'planos_concluidos' | 'dias_consecutivos' | 'pontuacao_minima' | 'categoria_especifica';
    valor: number;
    descricao: string;
  }[];
  status: 'ativa' | 'inativa' | 'arquivada';
  raridade: 'comum' | 'rara' | 'epica' | 'lendaria';
  dataCriacao: string;
  dataAtualizacao: string;
  usuariosConquistaram: number;
  taxaConquista: number;
  observacoes?: string;
}

interface Estatisticas {
  totalPlanos: number;
  planosAtivos: number;
  planosConcluidos: number;
  totalConquistas: number;
  conquistasDesbloqueadas: number;
  usuariosAtivos: number;
  pontosDistribuidos: number;
  taxaEngajamento: number;
  planosPopulares: {
    id: string;
    titulo: string;
    usuarios: number;
  }[];
  conquistasRaras: {
    id: string;
    nome: string;
    usuarios: number;
  }[];
}

// Mock data
const mockPlanos: PlanoAcao[] = [
  {
    id: '1',
    titulo: 'Mindfulness para Redução de Estresse',
    descricao: 'Plano completo de mindfulness para reduzir níveis de estresse e ansiedade no trabalho',
    categoria: 'saude_mental',
    nivel: 'iniciante',
    duracao: 21,
    dificuldade: 'facil',
    pontos: 100,
    status: 'ativo',
    tags: ['mindfulness', 'estresse', 'meditação', 'bem-estar'],
    passos: [
      { id: '1', titulo: 'Respiração Consciente', descricao: 'Pratique 5 minutos de respiração consciente diariamente', concluido: false, ordem: 1 },
      { id: '2', titulo: 'Meditação Guiada', descricao: 'Complete 10 minutos de meditação guiada', concluido: false, ordem: 2 },
      { id: '3', titulo: 'Reflexão Diária', descricao: 'Anote 3 coisas pelas quais é grato', concluido: false, ordem: 3 }
    ],
    criadoPor: 'Sistema',
    dataCriacao: '2024-01-15',
    dataAtualizacao: '2024-01-20',
    usuariosAtivos: 45,
    taxaConclusao: 78.5,
    avaliacao: 4.8,
    observacoes: 'Plano mais popular entre usuários iniciantes'
  },
  {
    id: '2',
    titulo: 'Gestão de Tempo e Produtividade',
    descricao: 'Técnicas avançadas de gestão de tempo para aumentar produtividade e reduzir sobrecarga',
    categoria: 'produtividade',
    nivel: 'intermediario',
    duracao: 30,
    dificuldade: 'medio',
    pontos: 200,
    status: 'ativo',
    tags: ['produtividade', 'gestão', 'tempo', 'organização'],
    passos: [
      { id: '1', titulo: 'Análise de Tempo', descricao: 'Monitore como gasta seu tempo por 1 semana', concluido: false, ordem: 1 },
      { id: '2', titulo: 'Técnica Pomodoro', descricao: 'Implemente a técnica Pomodoro por 2 semanas', concluido: false, ordem: 2 },
      { id: '3', titulo: 'Priorização de Tarefas', descricao: 'Use matriz de Eisenhower para priorizar tarefas', concluido: false, ordem: 3 }
    ],
    criadoPor: 'Sistema',
    dataCriacao: '2024-01-10',
    dataAtualizacao: '2024-01-25',
    usuariosAtivos: 32,
    taxaConclusao: 65.2,
    avaliacao: 4.6,
    observacoes: 'Recomendado para profissionais sobrecarregados'
  }
];

const mockConquistas: Conquista[] = [
  {
    id: '1',
    nome: 'Primeiro Diagnóstico',
    descricao: 'Complete seu primeiro diagnóstico de bem-estar',
    icone: '🎯',
    categoria: 'diagnostico',
    nivel: 'bronze',
    pontos: 50,
    requisitos: [
      { tipo: 'diagnosticos_completos', valor: 1, descricao: 'Complete 1 diagnóstico' }
    ],
    status: 'ativa',
    raridade: 'comum',
    dataCriacao: '2024-01-01',
    dataAtualizacao: '2024-01-01',
    usuariosConquistaram: 150,
    taxaConquista: 95.2,
    observacoes: 'Conquista de boas-vindas'
  },
  {
    id: '2',
    nome: 'Mestre do Mindfulness',
    descricao: 'Complete 5 planos de mindfulness consecutivos',
    icone: '🧘',
    categoria: 'plano',
    nivel: 'ouro',
    pontos: 500,
    requisitos: [
      { tipo: 'planos_concluidos', valor: 5, descricao: 'Complete 5 planos de mindfulness' }
    ],
    status: 'ativa',
    raridade: 'rara',
    dataCriacao: '2024-01-01',
    dataAtualizacao: '2024-01-01',
    usuariosConquistaram: 12,
    taxaConquista: 8.5,
    observacoes: 'Conquista rara para usuários dedicados'
  },
  {
    id: '3',
    nome: 'Lenda do Bem-Estar',
    descricao: 'Mantenha 90 dias consecutivos de atividades de bem-estar',
    icone: '👑',
    categoria: 'consistencia',
    nivel: 'lendario',
    pontos: 1000,
    requisitos: [
      { tipo: 'dias_consecutivos', valor: 90, descricao: '90 dias consecutivos de atividades' }
    ],
    status: 'ativa',
    raridade: 'lendaria',
    dataCriacao: '2024-01-01',
    dataAtualizacao: '2024-01-01',
    usuariosConquistaram: 3,
    taxaConquista: 0.8,
    observacoes: 'A conquista mais rara do sistema'
  }
];

const mockEstatisticas: Estatisticas = {
  totalPlanos: 2,
  planosAtivos: 2,
  planosConcluidos: 0,
  totalConquistas: 3,
  conquistasDesbloqueadas: 0,
  usuariosAtivos: 150,
  pontosDistribuidos: 25000,
  taxaEngajamento: 85.5,
  planosPopulares: [
    { id: '1', titulo: 'Mindfulness para Redução de Estresse', usuarios: 45 },
    { id: '2', titulo: 'Gestão de Tempo e Produtividade', usuarios: 32 }
  ],
  conquistasRaras: [
    { id: '3', nome: 'Lenda do Bem-Estar', usuarios: 3 },
    { id: '2', nome: 'Mestre do Mindfulness', usuarios: 12 }
  ]
};

export default function PlanosConquistasGlobais() {
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState('planos');
  
  // Estados principais
  const [planos, setPlanos] = useState<PlanoAcao[]>(mockPlanos);
  const [conquistas, setConquistas] = useState<Conquista[]>(mockConquistas);
  const [estatisticas, setEstatisticas] = useState<Estatisticas>(mockEstatisticas);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<'all' | PlanoAcao['categoria']>('all');
  const [filterNivel, setFilterNivel] = useState<'all' | PlanoAcao['nivel']>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | PlanoAcao['status']>('all');
  
  // Estados para modais
  const [selectedPlano, setSelectedPlano] = useState<PlanoAcao | null>(null);
  const [selectedConquista, setSelectedConquista] = useState<Conquista | null>(null);
  const [isViewPlanoModalOpen, setIsViewPlanoModalOpen] = useState(false);
  const [isViewConquistaModalOpen, setIsViewConquistaModalOpen] = useState(false);
  const [isCreatePlanoModalOpen, setIsCreatePlanoModalOpen] = useState(false);
  const [isCreateConquistaModalOpen, setIsCreateConquistaModalOpen] = useState(false);

  // Filtrar planos
  const filteredPlanos = planos.filter(plano => {
    const matchesSearch = plano.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plano.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plano.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategoria = filterCategoria === 'all' || plano.categoria === filterCategoria;
    const matchesNivel = filterNivel === 'all' || plano.nivel === filterNivel;
    const matchesStatus = filterStatus === 'all' || plano.status === filterStatus;
    return matchesSearch && matchesCategoria && matchesNivel && matchesStatus;
  });

  // Filtrar conquistas
  const filteredConquistas = conquistas.filter(conquista => {
    const matchesSearch = conquista.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conquista.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Funções
  const openViewPlanoModal = (plano: PlanoAcao) => {
    setSelectedPlano(plano);
    setIsViewPlanoModalOpen(true);
  };

  const openViewConquistaModal = (conquista: Conquista) => {
    setSelectedConquista(conquista);
    setIsViewConquistaModalOpen(true);
  };

  // Função para obter cor da categoria
  const getCategoriaColor = (categoria: PlanoAcao['categoria']) => {
    switch (categoria) {
      case 'saude_mental': return 'destructive';
      case 'produtividade': return 'default';
      case 'equilibrio': return 'outline';
      case 'desenvolvimento': return 'secondary';
      case 'bem_estar': return 'default';
      case 'carreira': return 'outline';
      default: return 'outline';
    }
  };

  // Função para obter cor do nível
  const getNivelColor = (nivel: PlanoAcao['nivel']) => {
    switch (nivel) {
      case 'iniciante': return 'default';
      case 'intermediario': return 'outline';
      case 'avancado': return 'secondary';
      case 'expert': return 'destructive';
      default: return 'outline';
    }
  };

  // Função para obter cor da conquista
  const getConquistaColor = (nivel: Conquista['nivel']) => {
    switch (nivel) {
      case 'bronze': return 'outline';
      case 'prata': return 'secondary';
      case 'ouro': return 'default';
      case 'diamante': return 'destructive';
      case 'lendario': return 'destructive';
      default: return 'outline';
    }
  };

  // Função para obter cor da raridade
  const getRaridadeColor = (raridade: Conquista['raridade']) => {
    switch (raridade) {
      case 'comum': return 'outline';
      case 'rara': return 'secondary';
      case 'epica': return 'default';
      case 'lendaria': return 'destructive';
      default: return 'outline';
    }
  };

  if (!hasPermission('plano.global')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Acesso Negado</h3>
          <p className="text-muted-foreground">Você não tem permissão para visualizar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Planos & Conquistas Globais</h1>
          <p className="text-muted-foreground">
            Gerencie planos de ação e sistema de conquistas do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total de Planos</p>
                <p className="text-2xl font-bold">{estatisticas.totalPlanos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Award className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total de Conquistas</p>
                <p className="text-2xl font-bold">{estatisticas.totalConquistas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Usuários Ativos</p>
                <p className="text-2xl font-bold">{estatisticas.usuariosAtivos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Taxa de Engajamento</p>
                <p className="text-2xl font-bold">{estatisticas.taxaEngajamento}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="planos" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Planos de Ação
          </TabsTrigger>
          <TabsTrigger value="conquistas" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Conquistas
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Planos de Ação */}
        <TabsContent value="planos" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Planos de Ação</h2>
              <p className="text-muted-foreground">
                Gerencie planos de ação disponíveis no sistema
              </p>
            </div>
            {hasPermission('plano.create') && (
              <Button onClick={() => setIsCreatePlanoModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Plano
              </Button>
            )}
          </div>

          {/* Filtros para Planos */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar planos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select
                  value={filterCategoria}
                  onValueChange={(value) =>
                    setFilterCategoria(value as 'all' | PlanoAcao['categoria'])
                  }
                >
                  <SelectTrigger className="w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    <SelectItem value="saude_mental">Saúde Mental</SelectItem>
                    <SelectItem value="produtividade">Produtividade</SelectItem>
                    <SelectItem value="equilibrio">Equilíbrio</SelectItem>
                    <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                    <SelectItem value="bem_estar">Bem-estar</SelectItem>
                    <SelectItem value="carreira">Carreira</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filterNivel}
                  onValueChange={(value) =>
                    setFilterNivel(value as 'all' | PlanoAcao['nivel'])
                  }
                >
                  <SelectTrigger className="w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Níveis</SelectItem>
                    <SelectItem value="iniciante">Iniciante</SelectItem>
                    <SelectItem value="intermediario">Intermediário</SelectItem>
                    <SelectItem value="avancado">Avançado</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filterStatus}
                  onValueChange={(value) =>
                    setFilterStatus(value as 'all' | PlanoAcao['status'])
                  }
                >
                  <SelectTrigger className="w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="arquivado">Arquivado</SelectItem>
                    <SelectItem value="em_revisao">Em Revisão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Planos */}
          <div className="grid gap-4">
            {filteredPlanos.map((plano) => (
              <Card key={plano.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{plano.titulo}</h3>
                        <Badge variant={getCategoriaColor(plano.categoria)}>
                          {plano.categoria.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge variant={getNivelColor(plano.nivel)}>
                          {plano.nivel.toUpperCase()}
                        </Badge>
                        <Badge variant={plano.status === 'ativo' ? 'default' : 'secondary'}>
                          {plano.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground mb-3">{plano.descricao}</p>
                      
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{plano.duracao} dias</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{plano.avaliacao}/5</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{plano.usuariosAtivos} usuários</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{plano.pontos} pontos</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium">Tags:</span>
                        {plano.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{plano.passos.length}</p>
                          <p className="text-sm text-muted-foreground">Passos</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{plano.taxaConclusao}%</p>
                          <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">{plano.usuariosAtivos}</p>
                          <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">{plano.avaliacao}/5</p>
                          <p className="text-sm text-muted-foreground">Avaliação</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {hasPermission('plano.view') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openViewPlanoModal(plano)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {hasPermission('plano.edit') && (
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {hasPermission('plano.delete') && (
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 2: Conquistas */}
        <TabsContent value="conquistas" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Sistema de Conquistas</h2>
              <p className="text-muted-foreground">
                Gerencie conquistas e recompensas do sistema
              </p>
            </div>
            {hasPermission('conquista.create') && (
              <Button onClick={() => setIsCreateConquistaModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Conquista
              </Button>
            )}
          </div>

          {/* Filtros para Conquistas */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar conquistas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Conquistas */}
          <div className="grid gap-4">
            {filteredConquistas.map((conquista) => (
              <Card key={conquista.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{conquista.icone}</span>
                        <h3 className="text-lg font-semibold">{conquista.nome}</h3>
                        <Badge variant={getConquistaColor(conquista.nivel)}>
                          {conquista.nivel.toUpperCase()}
                        </Badge>
                        <Badge variant={getRaridadeColor(conquista.raridade)}>
                          {conquista.raridade.toUpperCase()}
                        </Badge>
                        <Badge variant={conquista.status === 'ativa' ? 'default' : 'secondary'}>
                          {conquista.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground mb-3">{conquista.descricao}</p>
                      
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{conquista.pontos} pontos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{conquista.usuariosConquistaram} usuários</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{conquista.taxaConquista}% conquistaram</span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-3">
                        <span className="text-sm font-medium">Requisitos:</span>
                        {conquista.requisitos.map((requisito, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm">{requisito.descricao}</span>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{conquista.pontos}</p>
                          <p className="text-sm text-muted-foreground">Pontos</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{conquista.usuariosConquistaram}</p>
                          <p className="text-sm text-muted-foreground">Usuários</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">{conquista.taxaConquista}%</p>
                          <p className="text-sm text-muted-foreground">Taxa de Conquista</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">{conquista.requisitos.length}</p>
                          <p className="text-sm text-muted-foreground">Requisitos</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {hasPermission('conquista.view') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openViewConquistaModal(conquista)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {hasPermission('conquista.edit') && (
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {hasPermission('conquista.delete') && (
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Visualização de Plano */}
      <Dialog open={isViewPlanoModalOpen} onOpenChange={setIsViewPlanoModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Plano</DialogTitle>
            <DialogDescription>
              Informações completas do plano de ação
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlano && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Título</Label>
                  <p className="text-sm text-muted-foreground">{selectedPlano.titulo}</p>
                </div>
                <div>
                  <Label className="font-medium">Categoria</Label>
                  <Badge variant={getCategoriaColor(selectedPlano.categoria)} className="mt-1">
                    {selectedPlano.categoria.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label className="font-medium">Descrição</Label>
                <p className="text-sm text-muted-foreground mt-2">{selectedPlano.descricao}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="font-medium">Nível</Label>
                  <Badge variant={getNivelColor(selectedPlano.nivel)} className="mt-1">
                    {selectedPlano.nivel.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="font-medium">Duração</Label>
                  <p className="text-sm text-muted-foreground mt-2">{selectedPlano.duracao} dias</p>
                </div>
                <div>
                  <Label className="font-medium">Pontos</Label>
                  <p className="text-sm text-muted-foreground mt-2">{selectedPlano.pontos}</p>
                </div>
              </div>

              <div>
                <Label className="font-medium">Passos</Label>
                <div className="space-y-2 mt-2">
                  {selectedPlano.passos.map((passo, index) => (
                    <div key={passo.id} className="flex items-start gap-2">
                      <span className="text-sm font-medium">{passo.ordem}.</span>
                      <div>
                        <p className="text-sm font-medium">{passo.titulo}</p>
                        <p className="text-sm text-muted-foreground">{passo.descricao}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPlano.observacoes && (
                <div>
                  <Label className="font-medium">Observações</Label>
                  <p className="text-sm text-muted-foreground mt-2">{selectedPlano.observacoes}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewPlanoModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização de Conquista */}
      <Dialog open={isViewConquistaModalOpen} onOpenChange={setIsViewConquistaModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Conquista</DialogTitle>
            <DialogDescription>
              Informações completas da conquista
            </DialogDescription>
          </DialogHeader>
          
          {selectedConquista && (
            <div className="space-y-6">
              <div className="text-center">
                <span className="text-4xl mb-2 block">{selectedConquista.icone}</span>
                <h3 className="text-xl font-semibold">{selectedConquista.nome}</h3>
                <p className="text-muted-foreground">{selectedConquista.descricao}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Nível</Label>
                  <Badge variant={getConquistaColor(selectedConquista.nivel)} className="mt-1">
                    {selectedConquista.nivel.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="font-medium">Raridade</Label>
                  <Badge variant={getRaridadeColor(selectedConquista.raridade)} className="mt-1">
                    {selectedConquista.raridade.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Pontos</Label>
                  <p className="text-2xl font-bold text-blue-600">{selectedConquista.pontos}</p>
                </div>
                <div>
                  <Label className="font-medium">Usuários Conquistaram</Label>
                  <p className="text-2xl font-bold text-green-600">{selectedConquista.usuariosConquistaram}</p>
                </div>
              </div>

              <div>
                <Label className="font-medium">Requisitos</Label>
                <div className="space-y-2 mt-2">
                  {selectedConquista.requisitos.map((requisito, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{requisito.descricao}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedConquista.observacoes && (
                <div>
                  <Label className="font-medium">Observações</Label>
                  <p className="text-sm text-muted-foreground mt-2">{selectedConquista.observacoes}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewConquistaModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}






