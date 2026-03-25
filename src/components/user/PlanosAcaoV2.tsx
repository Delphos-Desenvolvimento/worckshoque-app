// Bibliotecas principais
// (mantidas conforme versão remota)
import { useState, useEffect, useCallback } from 'react';
import { format, parseISO, isBefore, isToday, isTomorrow, isYesterday, isAfter, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { usePermissions } from '@/contexts/PermissionsContext';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
 

// Componentes UI
// Componentes UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
 
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// Ícones do Lucide
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import PageHeader from "@/components/common/PageHeader";

// Ícones do Lucide
import { 
  Edit, 
  Trash2,
  Eye,
  ArrowLeft,
  Clock,
  CheckCircle2,
  CheckCircle,
  Circle,
  PauseCircle,
  XCircle,
  CheckSquare,
  Search,
  Filter,
  X,
  Target,
  Lock,
  RefreshCw,
  Lightbulb,
  HeartPulse,
  DollarSign,
  Briefcase,
  User,
  Folder,
  FileText,
  LayoutGrid,
  RotateCcw,
  ListChecks,
  Play,
  Calendar as CalendarIcon,
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  Minus,
  ChevronDown,
  ChevronRight,
  Check as CheckIcon,
  GripVertical,
  MoreVertical,
  Inbox,
  Plus,
  PlusCircle,
  Tag,
  Flag,
  Bell,
  BarChart2,
  MessageSquare,
  Paperclip,
  CalendarDays,
  Clock4,
  CheckCheck,
  ListTodo,
  ListPlus,
  ListMinus,
  ListX,
  List as ListIcon,
  ListOrdered,
  ListChecks as ListChecksIcon
} from "lucide-react";
import { listUserPlans, ActionPlanDto, generateActionPlanFromDiagnostic, getGlobalActionPlanStats, listActionPlansByUser, getUserActionPlanStats, ActionPlansGlobalStats, listUsers, ApiUser, listAllActionPlans, GoalDto, deleteActionPlan } from "@/lib/action-plans-api";
import { listDiagnostics, DiagnosticDto } from "@/lib/diagnostics-api";
import { api } from "@/lib/api";

// Tipos
type StatusPlano = 'Rascunho' | 'Em Andamento' | 'Pausado' | 'Concluído' | 'Cancelado' | 'Iniciado' | 'Quase Concluído';
type Prioridade = 'baixa' | 'media' | 'alta';
type Categoria = 'Liderança' | 'Bem-estar' | 'Desenvolvimento' | 'Saúde' | 'Produtividade' | 'Outros';

interface Acao {
  id: string;
  texto: string;
  descricao?: string;
  concluida: boolean;
  responsavel?: string;
  prazo?: string;
}

interface Comentario {
  id: string;
  autor: string;
  avatar?: string;
  texto: string;
  data: string;
}

interface PlanoAcao {
  id: string;
  titulo: string;
  descricao: string;
  progresso: number;
  prazo: string;
  status: StatusPlano;
  prioridade: Prioridade;
  categoria: Categoria;
  acoes: Acao[];
  criadoPor: string;
  criadoEm: string;
  atualizadoEm: string;
  etiquetas?: string[];
  comentarios?: Comentario[];
  anexos?: {
    id: string;
    nome: string;
    tipo: string;
    tamanho: string;
    data: string;
  }[];
}

const isValidGoalId = (raw?: unknown) => {
  if (typeof raw !== 'string') return false;
  const id = raw.trim();
  if (!id || id.startsWith('acao-')) return false;
  const cuidRegex = /^c[0-9a-z]{24,}$/i;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return cuidRegex.test(id) || uuidRegex.test(id);
};

const normalizeGoalId = (raw?: unknown) => {
  return isValidGoalId(raw) ? String(raw).trim() : undefined;
};

// Dados mockados
const mockPlanos: PlanoAcao[] = [
  {
    id: '1',
    titulo: 'Melhoria da Comunicação com Equipe',
    descricao: 'Desenvolver habilidades de comunicação assertiva e feedback construtivo para melhorar a colaboração e produtividade da equipe.',
    progresso: 75,
    prazo: '2024-02-15',
    status: 'Em Andamento',
    prioridade: 'alta',
    categoria: 'Liderança',
    acoes: [
      { id: '1a', texto: 'Participar de workshop de comunicação', concluida: true, responsavel: 'João Silva', prazo: '2024-01-15' },
      { id: '1b', texto: 'Praticar feedback diário com colegas', concluida: true, responsavel: 'Maria Santos', prazo: '2024-01-22' },
      { id: '1c', texto: 'Implementar reuniões 1:1 semanais', concluida: false, responsavel: 'Carlos Oliveira', prazo: '2024-01-30' },
      { id: '1d', texto: 'Avaliar resultados e ajustar abordagem', concluida: false, responsavel: 'Ana Costa', prazo: '2024-02-10' }
    ],
    criadoPor: 'João Silva',
    criadoEm: '2024-01-10T10:00:00',
    atualizadoEm: '2024-01-25T15:30:00',
    etiquetas: ['Comunicação', 'Liderança', 'Equipe'],
    comentarios: [
      {
        id: 'c1',
        autor: 'Maria Santos',
        avatar: '',
        texto: 'O workshop foi muito produtivo! Já estou aplicando as técnicas aprendidas.',
        data: '2024-01-16T09:15:00'
      },
      {
        id: 'c2',
        autor: 'Carlos Oliveira',
        avatar: '',
        texto: 'Vamos marcar nossa primeira reunião 1:1 para a próxima semana?',
        data: '2024-01-20T14:30:00'
      }
    ],
    anexos: [
      {
        id: 'a1',
        nome: 'apresentacao-comunicacao.pdf',
        tipo: 'PDF',
        tamanho: '2.4 MB',
        data: '2024-01-12T11:20:00'
      }
    ]
  },
  {
    id: '2',
    titulo: 'Gestão de Estresse e Ansiedade',
    descricao: 'Implementar técnicas para redução do estresse e promoção do bem-estar no ambiente de trabalho.',
    progresso: 30,
    prazo: '2024-03-01',
    status: 'Iniciado',
    prioridade: 'media',
    categoria: 'Bem-estar',
    acoes: [
      { id: '2a', texto: 'Realizar pesquisa de satisfação', concluida: true, responsavel: 'Ana Costa', prazo: '2024-01-20' },
      { id: '2b', texto: 'Criar guia de práticas de bem-estar', concluida: false, responsavel: 'Pedro Almeida', prazo: '2024-02-10' },
      { id: '2c', texto: 'Implementar pausas ativas diárias', concluida: false, responsavel: 'Fernanda Lima', prazo: '2024-02-15' },
      { id: '2d', texto: 'Avaliar impacto das mudanças', concluida: false, responsavel: 'Rafaela Souza', prazo: '2024-02-28' }
    ],
    criadoPor: 'Ana Costa',
    criadoEm: '2024-01-05T14:20:00',
    atualizadoEm: '2024-01-20T10:15:00',
    etiquetas: ['Bem-estar', 'Saúde', 'Equipe']
  },
  {
    id: '3',
    titulo: 'Otimização de Processos',
    descricao: 'Identificar e implementar melhorias nos processos internos para aumentar a eficiência operacional.',
    progresso: 10,
    prazo: '2024-04-15',
    status: 'Rascunho',
    prioridade: 'alta',
    categoria: 'Produtividade',
    acoes: [
      { id: '3a', texto: 'Mapear processos atuais', concluida: false, responsavel: 'Carlos Oliveira', prazo: '2024-02-01' },
      { id: '3b', texto: 'Identificar gargalos', concluida: false, responsavel: 'João Silva', prazo: '2024-02-15' },
      { id: '3c', texto: 'Propor melhorias', concluida: false, responsavel: 'Maria Santos', prazo: '2024-03-01' },
      { id: '3d', texto: 'Implementar mudanças', concluida: false, responsavel: 'Ana Costa', prazo: '2024-03-15' },
      { id: '3e', texto: 'Treinar equipe', concluida: false, responsavel: 'Pedro Almeida', prazo: '2024-03-30' },
      { id: '3f', texto: 'Avaliar resultados', concluida: false, responsavel: 'Fernanda Lima', prazo: '2024-04-10' }
    ],
    criadoPor: 'Carlos Oliveira',
    criadoEm: '2024-01-15T09:30:00',
    atualizadoEm: '2024-01-15T09:30:00',
    etiquetas: ['Processos', 'Eficiência', 'Melhoria Contínua']
  }
];

// Componentes auxiliares
const StatusBadge = ({ status }: { status: StatusPlano }) => {
  const statusConfig = {
    'Rascunho': { bg: 'bg-gray-100 text-gray-800', icon: FileText, label: 'Rascunho' },
    'Iniciado': { bg: 'bg-blue-100 text-blue-800', icon: Play, label: 'Iniciado' },
    'Em Andamento': { bg: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Em Andamento' },
    'Pausado': { bg: 'bg-orange-100 text-orange-800', icon: PauseCircle, label: 'Pausado' },
    'Quase Concluído': { bg: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Quase Concluído' },
    'Concluído': { bg: 'bg-green-600 text-white', icon: CheckCircle, label: 'Concluído' },
    'Cancelado': { bg: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelado' }
  };

  const { bg, icon: Icon, label } = statusConfig[status] || statusConfig['Rascunho'];

  return (
    <Badge className={`${bg} hover:${bg} flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </Badge>
  );
};

const PrioridadeBadge = ({ prioridade }: { prioridade: Prioridade }) => {
  const prioridadeConfig = {
    'baixa': { bg: 'bg-green-100 text-green-800', icon: ArrowDown, label: 'Baixa' },
    'media': { bg: 'bg-yellow-100 text-yellow-800', icon: Minus, label: 'Média' },
    'alta': { bg: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Alta' }
  };

  const { bg, icon: Icon, label } = prioridadeConfig[prioridade] || prioridadeConfig['media'];

  return (
    <Badge variant="outline" className={`${bg} hover:${bg} flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </Badge>
  );
};

const DataVencimento = ({ data }: { data: string }) => {
  if (!data) {
    return <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
      <CalendarIcon className="w-3 h-3" />
      <span>Sem prazo definido</span>
    </Badge>;
  }
  
  try {
    const dataObj = parseISO(data);
    if (isNaN(dataObj.getTime())) {
      return <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
        <CalendarIcon className="w-3 h-3" />
        <span>Data inválida</span>
      </Badge>;
    }
    
    const hoje = new Date();
    
    let bgClass = 'bg-gray-100 text-gray-800';
    let texto = format(dataObj, 'dd/MM/yyyy');
    
    if (isToday(dataObj)) {
      bgClass = 'bg-blue-100 text-blue-800';
      texto = 'Hoje';
    } else if (isTomorrow(dataObj)) {
      bgClass = 'bg-yellow-100 text-yellow-800';
      texto = 'Amanhã';
    } else if (isYesterday(dataObj)) {
      bgClass = 'bg-green-100 text-green-800';
      texto = 'Ontem';
    } else if (isBefore(dataObj, hoje)) {
      bgClass = 'bg-red-100 text-red-800';
      texto = `Atrasado (${format(dataObj, 'dd/MM/yyyy')})`;
    } else if (isAfter(dataObj, hoje)) {
      const diffDays = Math.ceil((dataObj.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) {
        bgClass = 'bg-green-50 text-green-800';
        texto = `Em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
      }
    }
    
    return (
      <Badge className={`${bgClass} hover:${bgClass} flex items-center gap-1`}>
        <CalendarIcon className="w-3 h-3" />
        <span>{texto}</span>
      </Badge>
    );
  } catch {
    return (
      <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
        <CalendarIcon className="w-3 h-3" />
        <span>Data inválida</span>
      </Badge>
    );
  }
};

// Componente de Card de Plano
const PlanoCard = ({ 
  plano, 
  onEdit, 
  onDelete,
  onToggleStatus,
  podeEditar,
  podeExcluir,
  modoVisualizacao = 'grid'
}: { 
  plano: PlanoAcao;
  onEdit: (plano: PlanoAcao) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (plano: PlanoAcao) => void;
  podeEditar: boolean;
  podeExcluir: boolean;
  modoVisualizacao?: 'grid' | 'lista';
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const prazo = plano.prazo ? parseISO(plano.prazo) : null;
  const prazoValido = prazo && !isNaN(prazo.getTime());
  const estaAtrasado = prazoValido && isBefore(prazo, new Date()) && plano.status !== 'Concluído';
  
  // Cores baseadas na prioridade
  const coresPrioridade = {
    alta: 'bg-red-50 border-red-200',
    media: 'bg-yellow-50 border-yellow-200',
    baixa: 'bg-green-50 border-green-200'
  };

  // Ícones de categoria
  const iconesCategoria = {
    'Saúde': <HeartPulse className="h-5 w-5 text-red-500" />,
    'Financeiro': <DollarSign className="h-5 w-5 text-green-500" />,
    'Carreira': <Briefcase className="h-5 w-5 text-blue-500" />,
    'Pessoal': <User className="h-5 w-5 text-purple-500" />,
    'Outros': <Folder className="h-5 w-5 text-gray-500" />
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
        <Card 
          className={cn(
            "relative overflow-hidden transition-all duration-200 hover:shadow-lg h-full flex flex-col border-l-4 hover:-translate-y-0.5",
            estaAtrasado ? 'border-destructive' : 'border-transparent',
            modoVisualizacao === 'lista' ? 'flex-row' : ''
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
        {/* Cabeçalho com cor baseada na prioridade */}
        <div className={cn(
          "px-4 py-2 border-b flex items-center justify-between",
          coresPrioridade[plano.prioridade] || 'bg-gray-50',
          modoVisualizacao === 'lista' ? 'w-48 flex-shrink-0 border-r h-full' : ''
        )}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-white/80">
              {iconesCategoria[plano.categoria] || <Folder className="h-4 w-4" />}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {plano.categoria}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <StatusBadge status={plano.status} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onEdit(plano)} disabled={!podeEditar}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Editar</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(plano.id)} 
                  disabled={!podeExcluir}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Excluir</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className={cn("flex-1 flex flex-col", modoVisualizacao === 'lista' ? 'min-w-0' : '')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold line-clamp-2">
              {plano.titulo}
            </CardTitle>
            <CardDescription className="line-clamp-2 text-sm">
              {plano.descricao}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 space-y-3">
            {/* Prazo */}
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className={cn(
                "font-medium",
                estaAtrasado ? 'text-destructive' : 'text-muted-foreground'
              )}>
                {prazoValido ? (
                  <>
                    {format(prazo, "dd MMM yyyy", { locale: ptBR })}
                    {isToday(prazo) && ' (Hoje)'}
                    {isTomorrow(prazo) && ' (Amanhã)'}
                    {estaAtrasado && ' (Atrasado)'}
                  </>
                ) : (
                  'Sem prazo definido'
                )}
              </span>
            </div>

            {/* Progresso */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium">{plano.progresso}%</span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div 
                  className={cn(
                    "h-full rounded-full",
                    plano.progresso === 100 ? 'bg-green-500' : 
                    plano.progresso > 50 ? 'bg-blue-500' : 
                    'bg-yellow-500'
                  )}
                  style={{ width: `${plano.progresso}%` }}
                />
              </div>
            </div>

            {/* Ações rápidas */}
            {isHovered && (
              <div className="absolute top-2 right-2 flex gap-1 bg-background/90 backdrop-blur-sm p-1 rounded-md shadow-sm">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => onToggleStatus(plano)}
                  title="Alterar status"
                >
                  {plano.status === 'Concluído' ? (
                    <RotateCcw className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </Button>
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-2 border-t">
            <div className="w-full flex justify-between items-center text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {plano.criadoPor.split(' ')[0]}
                </span>
                <span>•</span>
                <span>{plano.criadoEm ? (() => {
                  try {
                    const date = parseISO(plano.criadoEm);
                    return !isNaN(date.getTime()) ? format(date, 'dd/MM/yyyy') : 'Data inválida';
                  } catch {
                    return 'Data inválida';
                  }
                })() : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1">
                {plano.etiquetas?.slice(0, 2).map((etiqueta, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] h-5">
                    {etiqueta}
                  </Badge>
                ))}
                {plano.etiquetas && plano.etiquetas.length > 2 && (
                  <Badge variant="outline" className="text-[10px] h-5">
                    +{plano.etiquetas.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          </CardFooter>
        </div>
        </Card>
    </motion.div>
  );
};

// Componente principal
export default function PlanosAcaoV2() {
  const { user } = useAuthStore();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Estados
  const [planos, setPlanos] = useState<PlanoAcao[]>([]);
  // estado de loading removido conforme versão remota
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoAcao | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todos');
  const [busca, setBusca] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [novoPlano, setNovoPlano] = useState<Partial<PlanoAcao>>({
    titulo: '',
    descricao: '',
    status: 'Rascunho',
    prioridade: 'media',
    categoria: 'Outros',
    progresso: 0,
    prazo: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    acoes: [],
    criadoPor: user?.name || 'Usuário Atual',
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    etiquetas: []
  });
  const [novaAcao, setNovaAcao] = useState('');
  const [novaEtiqueta, setNovaEtiqueta] = useState('');
  const [novoComentario, setNovoComentario] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('todos');

  // Verificar permissões
  const podeCriar = hasPermission('plano.create');
  const podeEditar = hasPermission('plano.edit');
  const podeExcluir = hasPermission('plano.delete');
  const podeGlobal = hasPermission('plano.global');

  // Estado para controle do modo de visualização
  const [modoVisualizacao, setModoVisualizacao] = useState<'grid' | 'lista'>('grid');

  // Versão remota mantém helpers e carregamento via APIs da camada lib
  // Helpers de mapeamento backend -> UI
  const mapStatusToUI = (status: string): StatusPlano => {
    switch (status) {
      case 'rascunho':
        return 'Rascunho';
      case 'em_andamento':
        return 'Em Andamento';
      case 'pausado':
        return 'Pausado';
      case 'concluido':
        return 'Concluído';
      case 'cancelado':
        return 'Cancelado';
      default:
        return 'Em Andamento';
    }
  };

  const mapCategoryToUI = (category: string): Categoria => {
    switch (category) {
      case 'leadership':
        return 'Liderança';
      case 'wellness':
        return 'Bem-estar';
      case 'development':
        return 'Desenvolvimento';
      case 'performance':
        return 'Produtividade';
      default:
        return 'Outros';
    }
  };

  const mapPlan = useCallback((p: ActionPlanDto): PlanoAcao => ({
    id: p.id,
    titulo: p.title,
    descricao: p.description ?? '',
    progresso: p.progress ?? 0,
    prazo: p.due_date ?? new Date().toISOString().slice(0, 10),
    status: mapStatusToUI(p.status),
    prioridade: p.priority ?? 'media',
    categoria: mapCategoryToUI(p.category),
    acoes: (p.goals ?? []).map((g: GoalDto, idx: number) => ({
      id: g.id ?? `${p.id}-g${idx}`,
      texto: g.title,
      concluida: g.status === 'concluida',
      prazo: g.due_date ?? undefined
    })),
    criadoPor: p.user?.name || 'Você',
    criadoEm: p.created_at,
    atualizadoEm: p.updated_at,
    etiquetas: []
  }), []);
  const [globalStats, setGlobalStats] = useState<ActionPlansGlobalStats | null>(null);
  const [userStats, setUserStats] = useState<ActionPlansGlobalStats | null>(null);
  const [usuarios, setUsuarios] = useState<ApiUser[]>([]);
  const [buscaUsuario, setBuscaUsuario] = useState('');
  const [usuarioSelecionadoId, setUsuarioSelecionadoId] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    try {
      if (podeGlobal) {
        if (usuarioSelecionadoId) {
          const [plans, stats] = await Promise.all([
            listActionPlansByUser(usuarioSelecionadoId),
            getUserActionPlanStats(usuarioSelecionadoId)
          ]);
          setPlanos(plans.map(mapPlan));
          setUserStats(stats);
        } else {
          const [plans, stats] = await Promise.all([
            listAllActionPlans(),
            getGlobalActionPlanStats()
          ]);
          setPlanos(plans.map(mapPlan));
          setGlobalStats(stats);
          setUserStats(null);
        }
        return;
      }

      const data = await listUserPlans();
      setPlanos(data.map(mapPlan));

      const diagnosticId = searchParams.get('diagnosticId');
      if ((!data || data.length === 0) && diagnosticId) {
        try {
          toast.info('Gerando plano de ação a partir do seu diagnóstico...');
          const created = await generateActionPlanFromDiagnostic(diagnosticId);
          setPlanos([mapPlan(created)]);
          toast.success('Plano de ação criado automaticamente!');
        } catch {
          toast.error('Não foi possível gerar o plano a partir do diagnóstico.');
        }
      } else if (!data || data.length === 0) {
        try {
          const diagnostics: DiagnosticDto[] = await listDiagnostics();
          const latestCompleted = diagnostics.find(d => (d.status === 'concluido') || !!d.completed_at) || diagnostics[0];
          if (latestCompleted?.id) {
            toast.info('Gerando plano de ação com base no seu último diagnóstico...');
            const created = await generateActionPlanFromDiagnostic(latestCompleted.id);
            setPlanos([mapPlan(created)]);
            toast.success('Plano de ação criado automaticamente!');
          }
        } catch (error) {
          console.error(error);
          toast.error('Não foi possível gerar o plano a partir do diagnóstico.');
        }
      }
    } catch {
      toast.error('Não foi possível carregar planos de ação.');
    }
  }, [searchParams, podeGlobal, usuarioSelecionadoId, mapPlan]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!podeGlobal) return;
      try {
        const userList = await listUsers();
        if (!alive) return;
        setUsuarios(userList);
      } catch (error) {
        console.error(error);
        toast.error('Não foi possível carregar usuários.');
      }
    })();
    return () => { alive = false; };
  }, [podeGlobal]);
  

  // Filtrar planos com base nos filtros ativos
  const planosFiltrados = planos.filter(plano => {
    const atendeFiltroStatus = filtroStatus === 'todos' || plano.status === filtroStatus;
    const atendeFiltroPrioridade = filtroPrioridade === 'todos' || plano.prioridade === filtroPrioridade;
    const atendeBusca = busca === '' || 
      plano.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      plano.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      (plano.criadoPor && plano.criadoPor.toLowerCase().includes(busca.toLowerCase())) ||
      (plano.etiquetas && plano.etiquetas.some(etiqueta => 
        etiqueta.toLowerCase().includes(busca.toLowerCase()))
      );
    
    return atendeFiltroStatus && atendeFiltroPrioridade && atendeBusca;
  });

  // Agrupar planos por status para a visualização em abas
  const planosPorStatus = {
    'todos': planosFiltrados,
    'em-andamento': planosFiltrados.filter(p => p.status === 'Em Andamento'),
    'rascunho': planosFiltrados.filter(p => p.status === 'Rascunho'),
    'concluido': planosFiltrados.filter(p => p.status === 'Concluído'),
    'pausado': planosFiltrados.filter(p => p.status === 'Pausado'),
    'atrasado': planosFiltrados.filter(p => {
      if (!p.prazo) return false;
      try {
        const prazo = parseISO(p.prazo);
        return !isNaN(prazo.getTime()) && isBefore(prazo, new Date()) && p.status !== 'Concluído';
      } catch {
        return false;
      }
    })
  };

  // Calcular estatísticas
  const estatisticas = {
    total: planos.length,
    emAndamento: planos.filter(p => p.status === 'Em Andamento').length,
    concluidos: planos.filter(p => p.status === 'Concluído').length,
    atrasados: planos.filter(p => {
      if (!p.prazo) return false;
      try {
        const prazo = parseISO(p.prazo);
        return !isNaN(prazo.getTime()) && isBefore(prazo, new Date()) && p.status !== 'Concluído';
      } catch {
        return false;
      }
    }).length,
    progressoMedio: planos.length > 0 
      ? Math.round(planos.reduce((acc, p) => acc + p.progresso, 0) / planos.length) 
      : 0
  };

  // Manipuladores de eventos
  const handleAdicionarPlano = () => {
    setPlanoSelecionado(null);
    setNovoPlano({
      titulo: '',
      descricao: '',
      status: 'Rascunho',
      prioridade: 'media',
      categoria: 'Outros',
      progresso: 0,
      prazo: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      acoes: [],
      criadoPor: user?.name || 'Usuário Atual',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      etiquetas: []
    });
    setMostrarFormulario(true);
  };

  const handleSalvarPlano = async () => {
    if (!novoPlano.titulo || !novoPlano.descricao || !novoPlano.prazo) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }


    try {
      // Mapear status do frontend para o backend
      const statusMap: Record<string, string> = {
        'Rascunho': 'rascunho',
        'Em Andamento': 'em_andamento',
        'Pausado': 'pausado',
        'Concluído': 'concluido',
        'Cancelado': 'cancelado',
      };

      // Mapear categoria do frontend para o backend
      // Backend espera: 'leadership', 'wellness', 'development', 'performance', 'career'
      const categoryMap: Record<string, string> = {
        'Liderança': 'leadership',
        'Bem-estar': 'wellness',
        'Desenvolvimento': 'development',
        'Produtividade': 'performance',
        'Saúde': 'wellness', // Mapear Saúde para wellness
        'Carreira': 'career',
        'Outros': 'performance' // Mapear Outros para performance como fallback
      };

      if (planoSelecionado) {
        // Atualizar plano existente
        // Limpar descrição e enviar undefined se vazia
        const descricaoLimpa = novoPlano.descricao?.trim();
        const descricaoFinal = descricaoLimpa && descricaoLimpa.length > 0 
          ? descricaoLimpa
          : undefined;
        
        // Mapear ações do frontend para goals do backend
        // Filtrar apenas ações com título não vazio
        type GoalPayload = {
          id?: string;
          title: string;
          description?: string;
          status: string;
          priority: string;
          progress: number;
          due_date?: string;
        };
        const goals: GoalPayload[] = (novoPlano.acoes || [])
          .filter((acao) => acao.texto && acao.texto.trim().length > 0) // Filtrar apenas ações com título não vazio
          .map((acao) => {
            const textoTrimmed = acao.texto.trim();
            
            // Construir goalData sem id inicialmente
            const goalData: GoalPayload = {
              title: textoTrimmed,
              status: acao.concluida ? 'concluida' : 'pendente',
              priority: 'media',
              progress: acao.concluida ? 100 : 0,
            };
            
            const normalizedId = normalizeGoalId(acao.id);
            if (normalizedId) {
              goalData.id = normalizedId;
            }
            
            // Incluir descrição apenas se não estiver vazia
            if (acao.descricao && acao.descricao.trim()) {
              goalData.description = acao.descricao.trim();
            }
            
            // Incluir due_date apenas se tiver prazo válido
            if (acao.prazo) {
              try {
                const date = new Date(acao.prazo);
                if (!isNaN(date.getTime())) {
                  goalData.due_date = date.toISOString();
                }
              } catch {
                // Ignorar se a data for inválida
              }
            }
            
            return goalData;
          });
        
        const statusMapped = statusMap[novoPlano.status || 'Rascunho'] || 'rascunho';
        
        const payload: Record<string, unknown> = {
          title: novoPlano.titulo.trim(),
          status: statusMapped,
          category: categoryMap[novoPlano.categoria || 'Outros'] || 'performance',
          priority: novoPlano.prioridade || 'media',
          progress: novoPlano.progresso || 0,
          goals: goals, // Sempre incluir goals (mesmo que vazio) para garantir atualização
        };
        
        // Incluir descrição apenas se tiver valor
        if (descricaoFinal) {
          payload.description = descricaoFinal;
        }
        
        // Incluir due_date apenas se tiver valor
        if (novoPlano.prazo) {
          payload.due_date = new Date(novoPlano.prazo).toISOString();
        }
        
        console.log('📤 Enviando payload para atualizar plano:', {
          ...payload,
          goals: goals.map(g => {
            const gid = g.id;
            return {
              id: gid,
              title: g.title,
              hasId: !!gid,
              idType: typeof gid,
              idValue: gid ? String(gid) : 'no-id'
            };
          })
        });
        
        // Validar e limpar goals antes de enviar
        const cleanedGoals: GoalPayload[] = goals.map((goal) => ({
          ...goal,
          id: normalizeGoalId(goal.id),
        }));
        
        payload.goals = cleanedGoals;
        
        console.log('✅ Goals limpos:', cleanedGoals.map(g => ({
          hasId: !!g.id,
          id: g.id || 'sem-id',
          title: g.title
        })));
        
        const response = await api.patch(`/action-plans/${planoSelecionado.id}`, payload);

        if (response.ok) {
          const updatedPlan = await response.json();
          
          // Mapear goals (acoes) do backend
          const acoesAtualizadas = updatedPlan.goals?.filter((goal: { title?: string }) => goal.title && goal.title.trim().length > 0)
            .map((goal: {
              id: string;
              title: string;
              description?: string;
              status: string;
              due_date?: string;
            }) => ({
              id: goal.id,
              texto: goal.title.trim(),
              descricao: goal.description || '',
              concluida: goal.status === 'concluido' || goal.status === 'concluida',
              responsavel: '',
              prazo: goal.due_date ? (() => {
                try {
                  const date = new Date(goal.due_date);
                  return isNaN(date.getTime()) ? undefined : format(date, 'yyyy-MM-dd');
                } catch {
                  return undefined;
                }
              })() : undefined
            })) || [];
          
          // Atualizar estado local com os dados do backend
          setPlanos(planos.map(p => 
            p.id === planoSelecionado.id ? {
              ...p,
              titulo: updatedPlan.title,
              descricao: updatedPlan.description || '',
              status: mapStatusToUI(updatedPlan.status),
              prioridade: updatedPlan.priority,
              categoria: mapCategoryToUI(updatedPlan.category),
              progresso: updatedPlan.progress || 0,
              prazo: updatedPlan.due_date ? (() => {
                try {
                  const date = new Date(updatedPlan.due_date);
                  return isNaN(date.getTime()) ? '' : format(date, 'yyyy-MM-dd');
                } catch {
                  return '';
                }
              })() : '',
              acoes: acoesAtualizadas,
              atualizadoEm: updatedPlan.updated_at
            } : p
          ));
          
          // Fechar formulário após salvar
          setMostrarFormulario(false);
          setPlanoSelecionado(null);
          
          toast.success('Plano atualizado com sucesso!');
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.message || 'Erro ao atualizar plano');
          return;
        }
      } else {
        // Criar novo plano
        // Limpar descrição e enviar undefined se vazia
        const descricaoLimpa = novoPlano.descricao?.trim();
        const descricaoFinal = descricaoLimpa && descricaoLimpa.length > 0 
          ? descricaoLimpa
          : undefined;
        
        // Mapear ações do frontend para goals do backend
        // Filtrar apenas ações com título não vazio
        type GoalPayloadCreate = {
          id?: string;
          title: string;
          description?: string;
          status: string;
          priority: string;
          progress: number;
          due_date?: string;
        };
        const goals: GoalPayloadCreate[] = (novoPlano.acoes || [])
          .filter((acao) => acao.texto && acao.texto.trim().length > 0) // Filtrar apenas ações com título não vazio
          .map((acao) => {
            const textoTrimmed = acao.texto.trim();
            
            // Construir goalData sem id inicialmente
            const goalData: GoalPayloadCreate = {
              title: textoTrimmed,
              status: acao.concluida ? 'concluida' : 'pendente',
              priority: 'media',
              progress: acao.concluida ? 100 : 0,
            };
            
            const normalizedId = normalizeGoalId(acao.id);
            if (normalizedId) {
              goalData.id = normalizedId;
            }
            
            // Incluir descrição apenas se não estiver vazia
            if (acao.descricao && acao.descricao.trim()) {
              goalData.description = acao.descricao.trim();
            }
            
            // Incluir due_date apenas se tiver prazo válido
            if (acao.prazo) {
              try {
                const date = new Date(acao.prazo);
                if (!isNaN(date.getTime())) {
                  goalData.due_date = date.toISOString();
                }
              } catch {
                // Ignorar se a data for inválida
              }
            }
            
            return goalData;
          });
        
        const statusMapped = statusMap[novoPlano.status || 'Rascunho'] || 'rascunho';
        
        const payload: Record<string, unknown> = {
          title: novoPlano.titulo.trim(),
          status: statusMapped,
          category: categoryMap[novoPlano.categoria || 'Outros'] || 'performance',
          priority: novoPlano.prioridade || 'media',
          progress: novoPlano.progresso || 0,
          goals: goals, // Sempre incluir goals (mesmo que vazio) para garantir criação
        };
        
        // Incluir descrição apenas se tiver valor
        if (descricaoFinal) {
          payload.description = descricaoFinal;
        }
        
        // Incluir due_date apenas se tiver valor
        if (novoPlano.prazo) {
          payload.due_date = new Date(novoPlano.prazo).toISOString();
        }
        
        console.log('📤 Enviando payload para criar plano:', {
          ...payload,
          goals: goals.map(g => {
            const gid = g.id;
            return {
              id: gid,
              title: g.title,
              hasId: !!gid,
              idType: typeof gid,
              idValue: gid ? String(gid) : 'no-id'
            };
          })
        });
        
        // Validar e limpar goals antes de enviar (mesma lógica da atualização)
        const cleanedGoals: GoalPayloadCreate[] = goals.map((goal) => ({
          ...goal,
          id: normalizeGoalId(goal.id),
        }));
        
        payload.goals = cleanedGoals;
        
        console.log('✅ Goals limpos para criação:', cleanedGoals.map(g => ({
          hasId: !!g.id,
          id: g.id || 'sem-id',
          title: g.title
        })));
        
        const response = await api.post('/action-plans', payload);

        if (response.ok) {
          const newPlan = await response.json();
          // Transformar dados da API para o formato do frontend
          const novoPlanoCompleto: PlanoAcao = {
            id: newPlan.id,
            titulo: newPlan.title,
            descricao: newPlan.description || '',
            status: mapStatusToUI(newPlan.status),
            prioridade: newPlan.priority,
            categoria: novoPlano.categoria ?? 'Outros',
            progresso: newPlan.progress || 0,
            prazo: newPlan.due_date ? format(new Date(newPlan.due_date), 'yyyy-MM-dd') : '',
            acoes: [],
            criadoPor: user?.name || 'Usuário Atual',
            criadoEm: newPlan.created_at,
            atualizadoEm: newPlan.updated_at,
            etiquetas: []
          };
          
          setPlanos([...planos, novoPlanoCompleto]);
          toast.success('Plano criado com sucesso!');
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.message || 'Erro ao criar plano');
          return;
        }
      }
      
      setMostrarFormulario(false);
      setPlanoSelecionado(null);
      setNovoPlano({
        titulo: '',
        descricao: '',
        status: 'Rascunho',
        prioridade: 'media',
        categoria: 'Outros',
        progresso: 0,
        prazo: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        acoes: [],
        criadoPor: user?.name || 'Usuário Atual',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
        etiquetas: []
      });
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar plano. Tente novamente.';
      toast.error(errorMessage);
    }
  };

  const handleExcluirPlano = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await deleteActionPlan(id);
      await loadPlans();
      toast.success('Plano excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir plano:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir plano.';
      toast.error(errorMessage);
    }
  };

  const handleEditarPlano = (plano: PlanoAcao) => {
    setPlanoSelecionado(plano);
    
    // Garantir que o status esteja no formato correto
    const statusFormatado = plano.status || 'Rascunho';
    
    // Garantir que as ações estejam presentes
    const acoesFormatadas = plano.acoes || [];
    
    // Garantir que o prazo esteja formatado corretamente
    let prazoFormatado = '';
    if (plano.prazo) {
      try {
        const date = parseISO(plano.prazo);
        if (!isNaN(date.getTime())) {
          prazoFormatado = format(date, 'yyyy-MM-dd');
        } else {
          prazoFormatado = plano.prazo;
        }
      } catch {
        prazoFormatado = plano.prazo;
      }
    }
    
    setNovoPlano({
      ...plano,
      status: statusFormatado,
      acoes: acoesFormatadas,
      prazo: prazoFormatado || format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
    });
    setMostrarFormulario(true);
  };

  const handleAdicionarAcao = () => {
    const textoTrimmed = novaAcao.trim();
    
    // Validar apenas se não estiver vazio
    if (!textoTrimmed) {
      return;
    }
    
    const novaAcaoObj: Acao = {
      id: `acao-${Date.now()}`,
      texto: textoTrimmed,
      concluida: false,
      responsavel: user?.name || 'Sem responsável',
      prazo: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
    };
    
    setNovoPlano(prev => ({
      ...prev,
      acoes: [...(prev.acoes || []), novaAcaoObj],
      progresso: calcularProgresso([...(prev.acoes || []), novaAcaoObj])
    }));
    
    setNovaAcao('');
  };

  const handleRemoverAcao = (id: string) => {
    const acoesAtualizadas = (novoPlano.acoes || []).filter(a => a.id !== id);
    setNovoPlano(prev => ({
      ...prev,
      acoes: acoesAtualizadas,
      progresso: calcularProgresso(acoesAtualizadas)
    }));
  };

  const handleToggleConcluida = (id: string) => {
    const acoesAtualizadas = (novoPlano.acoes || []).map(a => 
      a.id === id ? { ...a, concluida: !a.concluida } : a
    );
    
    setNovoPlano(prev => ({
      ...prev,
      acoes: acoesAtualizadas,
      progresso: calcularProgresso(acoesAtualizadas)
    }));
  };

  const handleAdicionarEtiqueta = () => {
    if (!novaEtiqueta.trim()) return;
    
    setNovoPlano(prev => ({
      ...prev,
      etiquetas: [...(prev.etiquetas || []), novaEtiqueta.trim()]
    }));
    
    setNovaEtiqueta('');
  };

  const handleRemoverEtiqueta = (etiqueta: string) => {
    setNovoPlano(prev => ({
      ...prev,
      etiquetas: (prev.etiquetas || []).filter(e => e !== etiqueta)
    }));
  };

  const handleAdicionarComentario = () => {
    if (!novoComentario.trim()) return;
    
    const novoComentarioObj: Comentario = {
      id: `comentario-${Date.now()}`,
      autor: user?.name || 'Usuário',
      avatar: undefined,
      texto: novoComentario,
      data: new Date().toISOString()
    };
    
    setNovoPlano(prev => ({
      ...prev,
      comentarios: [...(prev.comentarios || []), novoComentarioObj]
    }));
    
    setNovoComentario('');
  };

  // Funções auxiliares
  const calcularProgresso = (acoes: Acao[]): number => {
    if (acoes.length === 0) return 0;
    const concluidas = acoes.filter(a => a.concluida).length;
    return Math.round((concluidas / acoes.length) * 100);
  };

  const formatarData = (data: string) => {
    return format(parseISO(data), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatarDataRelativa = (data: string) => {
    return formatDistanceToNow(parseISO(data), { addSuffix: true, locale: ptBR });
  };

  // Renderização condicional baseada em permissões
  if (!hasPermission('plano.view')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <Lock className="w-12 h-12 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-medium">Acesso não autorizado</h3>
          <p className="text-sm text-muted-foreground">
            Você não tem permissão para acessar esta área.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <PageHeader
        title="Planos de Ação"
        description="Gerencie seus planos de ação e acompanhe o progresso"
        icon={Target}
        badges={[
          { 
            label: `${planosFiltrados.length} ${planosFiltrados.length === 1 ? 'plano' : 'planos'}`, 
            icon: Target 
          },
          { 
            label: `${estatisticas.concluidos} concluídos`, 
            icon: CheckCircle,
            variant: estatisticas.concluidos > 0 ? 'success' : 'secondary'
          },
          { 
            label: `${estatisticas.atrasados} atrasados`, 
            icon: AlertCircle,
            variant: estatisticas.atrasados > 0 ? 'destructive' : 'secondary'
          },
          { 
            label: `${estatisticas.progressoMedio}% de progresso médio`, 
            icon: BarChart2,
            variant: 'default'
          }
        ]}
        actions={[
          {
            label: "Atualizar",
            icon: RefreshCw,
            onClick: () => {
              // Simulando atualização dos dados
              toast.success('Dados atualizados com sucesso!');
            },
            variant: 'secondary' as const,
            disabled: false
          },
          ...(podeCriar ? [{
            label: "Novo Plano",
            icon: Plus,
            onClick: handleAdicionarPlano,
            variant: 'primary' as const
          }] : [])
        ]}
      />

      {podeGlobal && (
        <div className="grid md:grid-cols-4 gap-6">
          {(() => {
            const stats = userStats || globalStats;
            return (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total</CardTitle>
                    <Target className="h-4 w-4 text-accent" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.summary.total ?? 0}</div>
                    <p className="text-xs text-muted-foreground">planos no sistema</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
                    <CheckCircle className="h-4 w-4 text-accent" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.summary.completed ?? 0}</div>
                    <p className="text-xs text-muted-foreground">finalizados</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ativos</CardTitle>
                    <Play className="h-4 w-4 text-accent" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.summary.active ?? 0}</div>
                    <p className="text-xs text-muted-foreground">em execução</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
                    <AlertCircle className="h-4 w-4 text-accent" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.summary.overdue ?? 0}</div>
                    <p className="text-xs text-muted-foreground">fora do prazo</p>
                  </CardContent>
                </Card>
              </>
            );
          })()}
        </div>
      )}

      {/* Filtros e busca */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-1/3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={podeGlobal ? "Buscar por usuário ou plano..." : "Buscar planos..."}
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="Rascunho">Rascunho</SelectItem>
                  <SelectItem value="Iniciado">Iniciado</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Pausado">Pausado</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filtroPrioridade} onValueChange={setFiltroPrioridade}>
                <SelectTrigger className="w-full sm:w-48">
                  <Flag className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as prioridades</SelectItem>
                  <SelectItem value="alta">Alta prioridade</SelectItem>
                  <SelectItem value="media">Média prioridade</SelectItem>
                  <SelectItem value="baixa">Baixa prioridade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Abas de status */}
      <Tabs 
        value={abaAtiva} 
        onValueChange={setAbaAtiva}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="todos" className="flex items-center gap-2">
            <ListIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Todos</span>
            <Badge variant="secondary" className="ml-1">
              {planosPorStatus.todos.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="em-andamento" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Em Andamento</span>
            <Badge variant="secondary" className="ml-1">
              {planosPorStatus['em-andamento'].length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="rascunho" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Rascunho</span>
            <Badge variant="secondary" className="ml-1">
              {planosPorStatus.rascunho.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="concluido" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Concluídos</span>
            <Badge variant="secondary" className="ml-1">
              {planosPorStatus.concluido.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pausado" className="flex items-center gap-2">
            <PauseCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Pausados</span>
            <Badge variant="secondary" className="ml-1">
              {planosPorStatus.pausado.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="atrasado" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Atrasados</span>
            <Badge variant="destructive" className="ml-1">
              {planosPorStatus.atrasado.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo das abas */}
        {Object.entries(planosPorStatus).map(([aba, planosDaAba]) => (
          <TabsContent key={aba} value={aba} className="mt-4">
            {planosDaAba.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <Inbox className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum plano encontrado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {aba === 'todos' 
                    ? 'Crie um novo plano para começar.' 
                    : `Nenhum plano ${aba === 'em-andamento' ? 'em andamento' : aba} encontrado.`}
                </p>
                {podeCriar && (
                  <Button onClick={handleAdicionarPlano}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Plano
                  </Button>
                )}
              </div>
            ) : (
              <div className={cn(
                "grid gap-4",
                modoVisualizacao === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
              )}>
                <AnimatePresence>
                  {planosDaAba.map((plano) => (
                  <Card
                    key={plano.id}
                    className="group hover:shadow-lg transition-shadow h-full flex flex-col overflow-hidden relative cursor-pointer"
                    onClick={() => navigate(`/planos-acao/${plano.id}`)}
                  >
                    <CardHeader className="pb-2 relative">
                      <div className="absolute right-4 top-4 z-20">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Abrir menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleEditarPlano(plano);
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Editar</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExcluirPlano(plano.id);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Excluir</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-yellow-500" />
                            {plano.titulo}
                          </CardTitle>
                          <CardDescription className="line-clamp-2">
                            {plano.descricao}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="flex-1">
                      <div className="space-y-4">
                        {/* Status e Prioridade */}
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge status={plano.status} />
                          <Badge variant="outline" className={cn(
                            "flex items-center gap-1",
                            plano.prioridade === 'alta' ? 'bg-red-50 text-red-700 border-red-200' :
                            plano.prioridade === 'media' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            'bg-green-50 text-green-700 border-green-200'
                          )}>
                            <Flag className="h-3 w-3" />
                            <span>{plano.prioridade === 'alta' ? 'Alta' : plano.prioridade === 'media' ? 'Média' : 'Baixa'} prioridade</span>
                          </Badge>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            <span>{plano.categoria}</span>
                          </Badge>
                        </div>

                        {/* Prazo */}
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Prazo:</span>
                          <span className={cn(
                            plano.prazo && isBefore(parseISO(plano.prazo), new Date()) && plano.status !== 'Concluído'
                              ? 'text-destructive font-medium'
                              : 'text-muted-foreground'
                          )}>
                            {plano.prazo && !isNaN(parseISO(plano.prazo).getTime()) ? (
                              <>
                                {format(parseISO(plano.prazo), "dd/MM/yyyy")}
                                {isToday(parseISO(plano.prazo)) && ' (Hoje)'}
                                {isTomorrow(parseISO(plano.prazo)) && ' (Amanhã)'}
                                {isBefore(parseISO(plano.prazo), new Date()) && plano.status !== 'Concluído' && ' (Atrasado)'}
                              </>
                            ) : (
                              <span className="text-muted-foreground">Sem prazo definido</span>
                            )}
                          </span>
                        </div>

                        {/* Progresso */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-medium">{plano.progresso}%</span>
                          </div>
                          <Progress value={plano.progresso} className="h-2" />
                        </div>

                        {/* Ações */}
                        {plano.acoes.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium flex items-center gap-1">
                                <ListChecksIcon className="h-4 w-4" />
                                Ações
                              </h4>
                              <span className="text-xs text-muted-foreground">
                                {plano.acoes.filter(a => a.concluida).length} de {plano.acoes.length} concluídas
                              </span>
                            </div>
                            <div className="space-y-1 max-h-40 overflow-y-auto pr-2">
                              {plano.acoes.slice(0, 3).map((acao) => (
                                <div key={acao.id} className="flex items-start gap-2 text-sm">
                                  <button 
                                    onClick={() => {
                                      if (podeEditar) {
                                        const planoAtual = planos.find(p => p.id === plano.id);
                                        if (planoAtual) {
                                          const acoesAtualizadas = planoAtual.acoes.map(a => 
                                            a.id === acao.id ? { ...a, concluida: !a.concluida } : a
                                          );
                                          setPlanos(planos.map(p => 
                                            p.id === plano.id 
                                              ? { 
                                                  ...p, 
                                                  acoes: acoesAtualizadas,
                                                  progresso: calcularProgresso(acoesAtualizadas)
                                                } 
                                              : p
                                          ));
                                        }
                                      }
                                    }}
                                    className="mt-1 flex-shrink-0"
                                    disabled={!podeEditar}
                                  >
                                    {acao.concluida ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <Circle className="h-4 w-4 text-muted-foreground/50" />
                                    )}
                                  </button>
                                  <span className={cn(
                                    "flex-1",
                                    acao.concluida ? 'line-through text-muted-foreground' : ''
                                  )}>
                                    {acao.texto}
                                  </span>
                                </div>
                              ))}
                              {plano.acoes.length > 3 && (
                                <div className="text-xs text-muted-foreground text-center pt-1">
                                  +{plano.acoes.length - 3} ações restantes
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Etiquetas */}
                        {plano.etiquetas && plano.etiquetas.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {plano.etiquetas.slice(0, 3).map((etiqueta, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {etiqueta}
                              </Badge>
                            ))}
                            {plano.etiquetas.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{plano.etiquetas.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                    
                    <CardFooter className="pt-2 border-t">
                      <div className="w-full flex justify-between items-center text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{plano.criadoPor}</span>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{formatarDataRelativa(plano.atualizadoEm)}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Atualizado em {formatarData(plano.atualizadoEm)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Modal de criação/edição de plano */}
      <Dialog open={mostrarFormulario} onOpenChange={setMostrarFormulario}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {planoSelecionado ? 'Editar Plano de Ação' : 'Novo Plano de Ação'}
            </DialogTitle>
            <DialogDescription>
              {planoSelecionado 
                ? `Editando o plano de ação criado em ${formatarData(planoSelecionado.criadoEm)}`
                : 'Preencha os campos abaixo para criar um novo plano de ação.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Informações básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input 
                  id="titulo" 
                  placeholder="Título do plano de ação" 
                  value={novoPlano.titulo || ''}
                  onChange={(e) => setNovoPlano({...novoPlano, titulo: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select 
                  value={novoPlano.categoria} 
                  onValueChange={(value) => setNovoPlano({...novoPlano, categoria: value as Categoria})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Categorias</SelectLabel>
                      {[
                        'Liderança', 'Bem-estar', 'Desenvolvimento', 
                        'Saúde', 'Produtividade', 'Outros'
                      ].map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={novoPlano.status} 
                  onValueChange={(value) => setNovoPlano({...novoPlano, status: value as StatusPlano})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Status do Plano</SelectLabel>
                      <SelectItem value="Rascunho">Rascunho</SelectItem>
                      <SelectItem value="Iniciado">Iniciado</SelectItem>
                      <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                      <SelectItem value="Pausado">Pausado</SelectItem>
                      <SelectItem value="Quase Concluído">Quase Concluído</SelectItem>
                      <SelectItem value="Concluído">Concluído</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="prioridade">Prioridade</Label>
                <Select 
                  value={novoPlano.prioridade} 
                  onValueChange={(value) => setNovoPlano({...novoPlano, prioridade: value as Prioridade})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Nível de Prioridade</SelectLabel>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="prazo">Prazo *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !novoPlano.prazo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {novoPlano.prazo ? (
                        format(parseISO(novoPlano.prazo), "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={novoPlano.prazo ? parseISO(novoPlano.prazo) : undefined}
                      onSelect={(value) => {
                        const date =
                          Array.isArray(value)
                            ? value[0]
                            : value && typeof value === 'object' && 'from' in value
                            ? (value as { from?: Date }).from
                            : (value as Date | undefined);
                        if (date instanceof Date) {
                          setNovoPlano({
                            ...novoPlano,
                            prazo: format(date, 'yyyy-MM-dd'),
                          });
                        }
                      }}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Progresso</Label>
                <div className="flex items-center gap-2">
                  <Progress value={novoPlano.progresso} className="h-2 flex-1" />
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {novoPlano.progresso}%
                  </span>
                </div>
              </div>
            </div>
            
            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva detalhadamente o plano de ação..."
                className="min-h-[100px]"
                value={novoPlano.descricao || ''}
                onChange={(e) => setNovoPlano({...novoPlano, descricao: e.target.value})}
              />
            </div>
            
            {/* Ações */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Ações</Label>
                <span className="text-sm text-muted-foreground">
                  {novoPlano.acoes?.length || 0} ações
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nova ação..."
                    value={novaAcao}
                    onChange={(e) => setNovaAcao(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAdicionarAcao();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    onClick={handleAdicionarAcao}
                    disabled={!novaAcao.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
                
                {novoPlano.acoes && novoPlano.acoes.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                    {novoPlano.acoes.map((acao) => (
                      <div key={acao.id} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-md">
                        <button 
                          onClick={() => handleToggleConcluida(acao.id)}
                          className="flex-shrink-0"
                        >
                          {acao.concluida ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground/50" />
                          )}
                        </button>
                        <span 
                          className={cn("flex-1", acao.concluida ? 'line-through text-muted-foreground' : '')}
                        >
                          {acao.texto}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">
                            {acao.responsavel}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => handleRemoverAcao(acao.id)}
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remover ação</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border rounded-md">
                    <ListChecksIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma ação adicionada. Adicione ações para começar.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Etiquetas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Etiquetas</Label>
                <span className="text-sm text-muted-foreground">
                  {novoPlano.etiquetas?.length || 0} etiquetas
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar etiqueta..."
                    value={novaEtiqueta}
                    onChange={(e) => setNovaEtiqueta(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAdicionarEtiqueta();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    onClick={handleAdicionarEtiqueta}
                    disabled={!novaEtiqueta.trim()}
                    variant="outline"
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
                
                {novoPlano.etiquetas && novoPlano.etiquetas.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                    {novoPlano.etiquetas.map((etiqueta, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="flex items-center gap-1"
                      >
                        {etiqueta}
                        <button 
                          onClick={() => handleRemoverEtiqueta(etiqueta)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Comentários (apenas para visualização) */}
            {planoSelecionado?.comentarios && planoSelecionado.comentarios.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Comentários</h4>
                <div className="space-y-4 max-h-60 overflow-y-auto p-2">
                  {planoSelecionado.comentarios.map((comentario) => (
                    <div key={comentario.id} className="flex gap-3">
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarImage src={comentario.avatar} alt={comentario.autor} />
                        <AvatarFallback>
                          {comentario.autor.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{comentario.autor}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatarDataRelativa(comentario.data)}
                          </span>
                        </div>
                        <p className="text-sm">{comentario.texto}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar um comentário..."
                    value={novoComentario}
                    onChange={(e) => setNovoComentario(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAdicionarComentario();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    onClick={handleAdicionarComentario}
                    disabled={!novoComentario.trim()}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Comentar
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSalvarPlano}>
              {planoSelecionado ? 'Salvar alterações' : 'Criar plano'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
