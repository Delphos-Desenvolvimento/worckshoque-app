import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componentes UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/common/PageHeader";

// Ícones
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle, 
  Clock, 
  FileText, 
  Users, 
  AlertCircle, 
  Loader2, 
  Plus, 
  Download, 
  Upload, 
  Image as ImageIcon,
  Video,
  Music,
  FolderArchive,
  RefreshCw,
  CheckSquare,
  MessageSquare,
  File,
  ChevronRight,
  MoreVertical,
  CheckCheck,
  ListChecks,
  ListTodo,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Search,
  UserPlus,
  X
} from 'lucide-react';

// Utilitários
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { getActionPlan, updateActionPlan } from "@/lib/action-plans-api";
import type { ActionPlanDto, GoalDto } from "@/lib/action-plans-api";
import { api } from "@/lib/api";
// Dados mockados para desenvolvimento
const mockPlanos: { [key: string]: PlanoAcao } = {
  '1': {
    id: '1',
    titulo: 'Plano de Desenvolvimento Pessoal',
    descricao: 'Plano para desenvolvimento de habilidades técnicas e comportamentais',
    dataInicio: '2024-01-01',
    dataFim: '2024-12-31',
    status: 'em_andamento',
    progresso: 65,
    responsaveis: ['João Silva', 'Maria Oliveira'],
    tarefas: [
      { id: '1', descricao: 'Finalizar curso de React', concluida: true, dataConclusao: '2024-03-15' },
      { id: '2', descricao: 'Ler livro sobre TypeScript', concluida: true, dataConclusao: '2024-04-20' },
      { id: '3', descricao: 'Desenvolver projeto prático', concluida: false },
    ],
    anexos: [
      {
        id: '1',
        nome: 'Guia de Estudos.pdf',
        tipo: 'application/pdf',
        tamanho: '2.4 MB',
        dataUpload: '2024-01-10',
        url: '#'
      }
    ],
    historico: [
      { id: '1', acao: 'Plano criado', data: '2024-01-01T10:00:00', usuario: 'João Silva' },
      { id: '2', acao: 'Primeira tarefa concluída', data: '2024-03-15T14:30:00', usuario: 'João Silva' },
    ],
    criadoEm: '2024-01-01T10:00:00',
    atualizadoEm: '2024-04-20T09:15:00',
    criadoPor: 'João Silva'
  },
  // Adicione mais planos mockados conforme necessário
};


// Tipos para o Plano de Ação
type Tarefa = {
  id: string;
  descricao: string;
  concluida: boolean;
  dataConclusao?: string;
};

type Anexo = {
  id: string;
  nome: string;
  tipo: string;
  tamanho: string;
  dataUpload: string;
  url: string;
};

type Historico = {
  id: string;
  acao: string;
  data: string;
  usuario: string;
};

type PlanoAcao = {
  id: string;
  titulo: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  status: 'pendente' | 'em_andamento' | 'concluido' | 'atrasado';
  progresso: number;
  responsaveis: string[];
  tarefas: Tarefa[];
  anexos: Anexo[];
  historico: Historico[];
  criadoEm: string;
  atualizadoEm: string;
  criadoPor: string;
};

const DetalhesPlanoAcao = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plano, setPlano] = useState<PlanoAcao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  
  // Estados para modal de responsáveis
  const [isResponsavelModalOpen, setIsResponsavelModalOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [users, setUsers] = useState<{id: string, name: string, email: string, role: string}[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  
  // Adicionando log para rastrear renderizações
  console.log('🔍 DetalhesPlanoAcao renderizado com ID:', id);
  
  // Função para manipular upload de arquivos
  const handleUploadArquivo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    try {
      // Aqui você pode implementar a lógica de upload real
      // Por enquanto, apenas mostramos uma mensagem de sucesso
      toast.success(`${files.length} arquivo(s) selecionado(s) para upload`);
      
      // Resetar o input para permitir o upload do mesmo arquivo novamente
      event.target.value = '';
    } catch (error) {
      console.error('Erro ao fazer upload do arquivo:', error);
      toast.error('Erro ao fazer upload do arquivo');
    }
  };

  // Função para atualizar o status do plano
  const handleAtualizarStatus = async (novoStatus: PlanoAcao['status']) => {
    if (!plano) return;
    
    try {
      // Mapear status do frontend para o backend
      const statusMap: Record<string, string> = {
        'Rascunho': 'rascunho',
        'Em Andamento': 'em_andamento',
        'Pausado': 'pausado',
        'Concluído': 'concluido',
        'Cancelado': 'cancelado'
      };
      
      const response = await api.patch(`/action-plans/${plano.id}`, {
        status: statusMap[novoStatus] || novoStatus.toLowerCase()
      });
      
      if (response.ok) {
        const updatedPlan = await response.json();
        setPlano({
          ...plano,
          status: novoStatus,
          atualizadoEm: updatedPlan.updated_at || new Date().toISOString()
        });
        toast.success(`Status atualizado para ${getStatusLabel(novoStatus)}`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar status do plano');
    }
  };

  // Carrega usuários quando o modal abre
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        // Busca usuários do sistema. Ajuste o endpoint conforme necessário.
        // O endpoint /auth/users geralmente retorna { users: [], total: 0 } ou array direto
        const response = await api.get('/auth/users?limit=50');
        
        if (response.ok) {
          const data = await response.json();
          // Tenta extrair a lista de usuários de diferentes formatos possíveis
          const userList = Array.isArray(data) ? data : (data.users || data.data || []);
          
          interface ApiUser { id: string; name: string; email: string; role: string }
          setUsers(userList.map((u: ApiUser) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role
          })));
        }
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        // Não mostra erro para o usuário se falhar silenciosamente, apenas loga
      } finally {
        setLoadingUsers(false);
      }
    };

    if (isResponsavelModalOpen && users.length === 0) {
      fetchUsers();
    }
  }, [isResponsavelModalOpen, users.length]);

  // Função para adicionar responsável
  const handleAddResponsavel = (user: {id: string, name: string}) => {
    if (!plano) return;
    
    // Verifica se já existe
    if (plano.responsaveis.some(r => r === user.name)) {
      toast.info(`${user.name} já é um responsável.`);
      return;
    }
    
    // Atualiza estado local
    const novosResponsaveis = [...plano.responsaveis, user.name];
    
    setPlano({
      ...plano,
      responsaveis: novosResponsaveis
    });
    
    setIsResponsavelModalOpen(false);
    toast.success(`${user.name} adicionado com sucesso!`);
    
    // Em um cenário real, faríamos uma chamada à API aqui
    // api.post(`/action-plans/${plano.id}/assignees`, { userId: user.id });
  };

  // Função para remover responsável
  const handleRemoveResponsavel = (name: string) => {
    if (!plano) return;

    // Atualiza estado local
    const novosResponsaveis = plano.responsaveis.filter(r => r !== name);
    
    setPlano({
      ...plano,
      responsaveis: novosResponsaveis
    });
    
    toast.success(`${name} removido com sucesso!`);
    
    // Em um cenário real, faríamos uma chamada à API aqui
    // api.delete(`/action-plans/${plano.id}/assignees/${userId}`);
  };

  // Filtragem de usuários
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  // Função auxiliar para obter o rótulo do status
  const getStatusLabel = (status: PlanoAcao['status']) => {
    const statusMap = {
      pendente: 'Pendente',
      em_andamento: 'Em Andamento',
      concluido: 'Concluído',
      atrasado: 'Atrasado'
    };
    return statusMap[status] || status;
  };

  // Buscar dados do plano de ação
  useEffect(() => {
    // Flag para controle de montagem
    let isMounted = true;
    
    const carregarPlano = async () => {
      if (!id) {
        console.log('⚠️ ID não fornecido');
        if (isMounted) {
          setErro('ID do plano não fornecido');
          setCarregando(false);
        }
        return;
      }

      console.log('🔄 Iniciando carregamento do plano:', id);
      
      try {
        if (isMounted) {
          setCarregando(true);
          setErro(null);
        }
        
        // Adiciona um pequeno atraso para simular carregamento
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const dto = await getActionPlan(id);
        console.log('✅ Dados recebidos para o plano:', id, dto);
        
        if (isMounted) {
          if (!dto) {
            throw new Error('Plano não encontrado');
          }
          // Mapeia DTO do backend para a estrutura usada na UI
          const mapStatus = (s: string): 'pendente' | 'em_andamento' | 'concluido' | 'atrasado' => {
            if (s === 'concluido') return 'concluido';
            return 'em_andamento';
          };
          const planoUI = mapDtoToPlanoUI(dto);
          setPlano(planoUI);
          setCarregando(false);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar plano de ação:', error);
        
        if (isMounted) {
          setErro(error instanceof Error ? error.message : 'Não foi possível carregar o plano de ação');
          toast.error('Erro ao carregar o plano de ação');
          setCarregando(false);
        }
      }
    };

    carregarPlano();
    
    // Cleanup function
    return () => {
      console.log('🧹 Limpando efeito para o ID:', id);
      isMounted = false;
    };
  }, [id]);
  
  // Se estiver carregando, mostra um indicador
  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Carregando plano de ação...</p>
      </div>
    );
  }
  
  // Se houver erro, mostra a mensagem de erro
  if (erro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Não foi possível carregar o plano</h2>
        <p className="text-muted-foreground mb-6">{erro}</p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }
  
  // Se não houver plano (não deve acontecer, mas é uma verificação de segurança)
  if (!plano) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Plano não encontrado</h2>
        <p className="text-muted-foreground mb-6">O plano solicitado não foi encontrado ou você não tem permissão para acessá-lo.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a lista
        </Button>
      </div>
    );
  }

  // Se o plano ainda não foi carregado, exibe o loading
  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando detalhes do plano...</span>
      </div>
    );
  }

  // Se ocorreu um erro ou o plano não foi encontrado
  if (erro || !plano) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Erro ao carregar o plano</h2>
        <p className="text-muted-foreground mb-6">{erro || 'Plano não encontrado'}</p>
        <Button onClick={() => navigate('/planos-acao')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a lista de planos
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluido':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Concluído</Badge>;
      case 'em_andamento':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Em Andamento</Badge>;
      case 'atrasado':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Atrasado</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Pendente</Badge>;
    }
  };

  // Função para formatar a data
  const formatarData = (data: string) => {
    return format(parseISO(data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  // Função para formatar data e hora
  const formatarDataHora = (data: string) => {
    return format(parseISO(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  // Função para baixar anexo
  const handleBaixarAnexo = async (anexo: Anexo) => {
    try {
      // Se o anexo já tiver uma URL, redireciona para o download
      if (anexo.url) {
        window.open(anexo.url, '_blank');
        return;
      }
      
      // Caso contrário, tenta baixar via endpoint do backend
      const response = await fetch(`/action-plans/${plano.id}/attachments/${anexo.id}/download`);
      if (!response.ok) throw new Error('Erro ao baixar arquivo');
      const blob = await response.blob();
      
      // Cria um link temporário para download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', anexo.nome);
      document.body.appendChild(link);
      link.click();
      
      // Limpa o link
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Download iniciado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar anexo:', error);
      toast.error('Não foi possível baixar o arquivo. Tente novamente.');
    }
  };

  // Função para alternar status da tarefa
  const toggleTarefaStatus = async (tarefaId: string, concluida: boolean) => {
    try {
      if (!plano) return;

      // Monta a lista de tarefas atualizada localmente
      const tarefasAtualizadas = plano.tarefas.map(t =>
        t.id === tarefaId ? { ...t, concluida } : t
      );
      const tarefasConcluidas = tarefasAtualizadas.filter(t => t.concluida).length;
      const novoProgresso = Math.round((tarefasConcluidas / tarefasAtualizadas.length) * 100);

      // Otimista: atualiza o estado antes da chamada
      setPlano(prev => prev ? { ...prev, tarefas: tarefasAtualizadas, progresso: novoProgresso } : prev);

      // Envia TODAS as metas para evitar exclusão indevida no backend
      const goalsPayload: GoalDto[] = tarefasAtualizadas.map(t => ({
        id: t.id.startsWith('new-') || t.id.includes('-g') ? undefined : t.id,
        title: t.descricao,
        status: t.concluida ? 'concluida' : 'pendente',
        progress: t.concluida ? 100 : 0,
      }));

      const updated = await updateActionPlan(plano.id, {
        goals: goalsPayload,
        progress: novoProgresso,
      });

      // Sincroniza com backend para garantir IDs e estados consistentes
      const dtoAtualizado = await getActionPlan(plano.id);
      const planoAtualizado = mapDtoToPlanoUI(dtoAtualizado);
      setPlano(planoAtualizado);
      toast.success('Tarefa atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error('Não foi possível atualizar a tarefa. Tente novamente.');

      // Reverte a alteração em caso de erro
      setPlano(prev => {
        if (!prev) return null;
        return {
          ...prev,
          tarefas: prev.tarefas.map(t =>
            t.id === tarefaId ? { ...t, concluida: !concluida } : t
          )
        };
      });
    }
  };

  const handleAddTask = async () => {
    if (!plano) return;

    const description = newTaskDescription.trim();
    if (!description) {
      toast.error('Informe a descrição da tarefa.');
      return;
    }

    const tarefaTemporaria: Tarefa = {
      id: `new-${Date.now()}`,
      descricao: description,
      concluida: false,
    };

    const tarefasAtualizadas = [...plano.tarefas, tarefaTemporaria];
    const tarefasConcluidas = tarefasAtualizadas.filter((t) => t.concluida).length;
    const novoProgresso = Math.round((tarefasConcluidas / tarefasAtualizadas.length) * 100);

    try {
      setPlano((prev) =>
        prev
          ? { ...prev, tarefas: tarefasAtualizadas, progresso: novoProgresso }
          : prev,
      );

      const goalsPayload: GoalDto[] = tarefasAtualizadas.map((t) => ({
        id: t.id.startsWith('new-') || t.id.includes('-g') ? undefined : t.id,
        title: t.descricao,
        description: t.descricao,
        status: t.concluida ? 'concluida' : 'pendente',
        progress: t.concluida ? 100 : 0,
      }));

      await updateActionPlan(plano.id, {
        goals: goalsPayload,
        progress: novoProgresso,
      });

      const dtoAtualizado = await getActionPlan(plano.id);
      const planoAtualizado = mapDtoToPlanoUI(dtoAtualizado);
      setPlano(planoAtualizado);
      setNewTaskDescription('');
      setIsTaskModalOpen(false);
      toast.success('Tarefa adicionada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
      toast.error('Não foi possível adicionar a tarefa. Tente novamente.');
      setPlano((prev) => prev ? { ...prev, tarefas: plano.tarefas, progresso: plano.progresso } : prev);
    }
  };


  if (!plano) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Plano não encontrado</h2>
        <p className="text-muted-foreground mb-6">O plano solicitado não foi encontrado ou não está disponível.</p>
        <Button onClick={() => navigate('/planos-acao')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a lista de planos
        </Button>
      </div>
    );
  }

  // Função para obter o ícone com base no tipo de arquivo
  const getFileIcon = (tipo: string) => {
    const tipoLower = tipo.toLowerCase();

    if (tipoLower.includes('pdf')) {
      return <FileText className="h-6 w-6 text-red-500" />;
    } else if (tipoLower.includes('word') || tipoLower.includes('doc')) {
      return <FileText className="h-6 w-6 text-blue-500" />;
    } else if (tipoLower.includes('excel') || tipoLower.includes('xls')) {
      return <FileText className="h-6 w-6 text-green-500" />;
    } else if (tipoLower.includes('powerpoint') || tipoLower.includes('ppt')) {
      return <FileText className="h-6 w-6 text-orange-500" />;
    } else if (tipoLower.includes('image')) {
      return <ImageIcon className="h-6 w-6 text-purple-500" />;
    } else if (tipoLower.includes('video')) {
      return <Video className="h-6 w-6 text-indigo-500" />;
    } else if (tipoLower.includes('audio')) {
      return <Music className="h-6 w-6 text-pink-500" />;
    } else if (tipoLower.includes('zip') || tipoLower.includes('rar') || tipoLower.includes('7z')) {
      return <FolderArchive className="h-6 w-6 text-amber-500" />;
    } else {
      return <FileText className="h-6 w-6 text-gray-500" />;
    }
  };

  // Função para obter o ícone com base no status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluido':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'em_andamento':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'pendente':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'atrasado':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  // Ações do cabeçalho
  const headerActions = [
    {
      label: 'Nova Tarefa',
      icon: PlusCircle,
      onClick: () => setIsTaskModalOpen(true),
      variant: 'primary' as const
    },
    {
      label: 'Exportar',
      icon: Download,
      onClick: () => toast.info('Funcionalidade de exportação em breve!'),
      variant: 'secondary' as const
    }
  ];

  // Badges do cabeçalho
  const headerBadges = [
    {
      label: getStatusLabel(plano.status),
      variant: (() => {
        switch (plano.status) {
          case 'concluido': return 'success' as const;
          case 'em_andamento': return 'secondary' as const;
          case 'pendente': return 'warning' as const;
          case 'atrasado': return 'destructive' as const;
          default: return 'default' as const;
        }
      })(),
      icon: getStatusIcon(plano.status).type
    },
    {
      label: `${plano.progresso}% concluído`,
      variant: 'default' as const
    }
  ];

  // Estatísticas do cabeçalho
  const headerStats = [
    {
      label: 'Tarefas',
      value: `${plano.tarefas.filter(t => t.concluida).length}/${plano.tarefas.length}`,
      description: 'Concluídas/Total',
      icon: ListChecks,
      color: 'text-blue-500'
    },
    {
      label: 'Prazo',
      value: format(new Date(plano.dataFim), 'dd/MM/yyyy'),
      description: 'Data de conclusão',
      icon: Calendar,
      color: new Date() > new Date(plano.dataFim) && plano.status !== 'concluido' 
        ? 'text-red-500' 
        : 'text-green-500'
    },
    {
      label: 'Responsáveis',
      value: plano.responsaveis.length,
      description: 'Envolvidos',
      icon: Users,
      color: 'text-purple-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <PageHeader
        title={plano.titulo}
        description={`ID: ${plano.id} • Criado em ${formatarData(plano.criadoEm || plano.dataInicio)}`}
        icon={FileText}
        badges={headerBadges}
        actions={headerActions}
        stats={headerStats}
      />

      <Separator />

      <div className="grid gap-4 md:grid-cols-3">
        {/* Card de Progresso */}
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
              Progresso do Plano
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl font-bold">{plano.progresso}%</div>
              <Badge variant={plano.progresso === 100 ? 'secondary' : 'outline'}>
                {plano.progresso === 100 ? 'Concluído' : 'Em andamento'}
              </Badge>
            </div>
            <div className="mt-2">
              <Progress value={plano.progresso} className="h-2" />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{plano.tarefas.filter(t => t.concluida).length} de {plano.tarefas.length} tarefas</span>
              <span>{plano.progresso}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Card de Datas */}
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Período do Plano
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-primary/10 p-2 rounded-md mr-3">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Início</p>
                  <p className="font-medium">
                    {formatarData(plano.dataInicio)}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start">
                <div className="bg-primary/10 p-2 rounded-md mr-3">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Término</p>
                  <p className="font-medium">
                    {formatarData(plano.dataFim)}
                  </p>
                  {new Date() > new Date(plano.dataFim) && plano.status !== 'concluido' && (
                    <Badge variant="destructive" className="mt-1">
                      Vencido
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Responsáveis */}
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Responsáveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {plano.responsaveis.length > 0 ? (
                plano.responsaveis.map((responsavel, index) => (
                  <div key={index} className="flex items-center justify-between group">
                    <div className="flex items-center">
                      <div className="bg-primary/10 p-2 rounded-full mr-3">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{responsavel}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleRemoveResponsavel(responsavel)}
                      title="Remover responsável"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhum responsável atribuído
                </div>
              )}
            </div>
            {/* Botão para adicionar responsáveis */}
            <div className="relative z-10">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-3 text-primary border-primary/20 hover:bg-primary/10 hover:border-primary/50 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsResponsavelModalOpen(true);
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar responsável
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="descricao" className="w-full mt-6">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
          <TabsTrigger value="descricao">
            <FileText className="h-4 w-4 mr-2" />
            Descrição
          </TabsTrigger>
          <TabsTrigger value="tarefas">
            <CheckCircle className="h-4 w-4 mr-2" />
            Tarefas
          </TabsTrigger>
          <TabsTrigger value="anexos">
            <Download className="h-4 w-4 mr-2" />
            Anexos
            {plano?.anexos?.length > 0 && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {plano.anexos.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="historico">
            <Clock className="h-4 w-4 mr-2" />
            Histórico
            {plano?.historico?.length > 0 && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {plano.historico.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="descricao">
          <Card>
            <CardHeader>
              <CardTitle>Descrição do Plano</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                {plano.descricao || 'Nenhuma descrição fornecida.'}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tarefas">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Tarefas</CardTitle>
                <Button size="sm" onClick={() => setIsTaskModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Tarefa
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {plano.tarefas.length > 0 ? (
                <div className="space-y-2">
                  {plano.tarefas.map((tarefa) => (
                    <div key={tarefa.id} className="flex items-start p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex w-full items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleTarefaStatus(tarefa.id, !tarefa.concluida)}
                          className="mt-1 flex-shrink-0"
                          aria-label={tarefa.concluida ? 'Marcar como pendente' : 'Marcar como concluída'}
                        >
                          {tarefa.concluida ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                          )}
                        </button>
                        <div className="flex-1">
                          <p className={`break-words whitespace-normal text-sm font-medium ${tarefa.concluida ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {tarefa.descricao}
                          </p>
                          {tarefa.dataConclusao && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              Concluído em {format(new Date(tarefa.dataConclusao), "dd/MM/yyyy")}
                            </p>
                          )}
                        </div>
                        {!tarefa.concluida && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => toggleTarefaStatus(tarefa.id, true)}
                            className="ml-2"
                          >
                            Concluir
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
                    <CheckCircle className="h-full w-full opacity-30" />
                  </div>
                  <h3 className="text-lg font-medium">Nenhuma tarefa encontrada</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Adicione tarefas para acompanhar o progresso deste plano.
                  </p>
                  <Button onClick={() => setIsTaskModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Tarefa
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anexos">
          <Card>
            <CardHeader>
              <CardTitle>Anexos</CardTitle>
            </CardHeader>
            <CardContent>
              {plano.anexos.length > 0 ? (
                <div className="space-y-4">
                  {plano.anexos.map((anexo) => (
                    <div key={anexo.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                          {getFileIcon(anexo.tipo)}
                        </div>
                        <div>
                          <p className="font-medium">{anexo.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {anexo.tipo} • {anexo.tamanho} • {format(new Date(anexo.dataUpload), "dd/MM/yyyy")}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleBaixarAnexo(anexo)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
                    <FileText className="h-full w-full opacity-30" />
                  </div>
                  <h3 className="text-lg font-medium">Nenhum anexo encontrado</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Adicione anexos para compartilhar arquivos relacionados a este plano.
                  </p>
                  <Button onClick={() => {}}>
                    <Upload className="mr-2 h-4 w-4" />
                    Adicionar Anexo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Alterações</CardTitle>
            </CardHeader>
            <CardContent>
              {plano.historico.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-muted" />
                  <div className="space-y-8">
                    {plano.historico.map((item) => (
                      <div key={item.id} className="relative pl-6 pb-6">
                        <div className="absolute left-0 top-0 h-full w-0.5 bg-muted" />
                        <div className="absolute left-0 top-0 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-white">
                          <Clock className="h-3.5 w-3.5" />
                        </div>
                        <div className="ml-6">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{item.usuario}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatarDataHora(item.data)}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{item.acao}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
                    <Clock className="h-full w-full opacity-30" />
                  </div>
                  <h3 className="text-lg font-medium">Nenhum histórico encontrado</h3>
                  <p className="text-sm text-muted-foreground">
                    O histórico de alterações aparecerá aqui.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Adicionar Responsável */}
      <Dialog open={isResponsavelModalOpen} onOpenChange={setIsResponsavelModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Responsável</DialogTitle>
            <DialogDescription>
              Selecione um usuário da lista abaixo para atribuir a este plano de ação.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuário por nome ou email..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
            
            <ScrollArea className="h-[300px] rounded-md border p-2">
              {loadingUsers ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="space-y-1">
                  {filteredUsers.map((user) => {
                    const isAlreadyAdded = plano.responsaveis.some(r => r === user.name);
                    return (
                      <div 
                        key={user.id} 
                        className={cn(
                          "flex items-center justify-between p-2 rounded-md transition-colors",
                          isAlreadyAdded ? "opacity-50 cursor-not-allowed bg-muted/50" : "hover:bg-muted cursor-pointer"
                        )}
                        onClick={() => !isAlreadyAdded && handleAddResponsavel(user)}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {user.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate">{user.name}</span>
                            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                          </div>
                        </div>
                        {isAlreadyAdded ? (
                          <Badge variant="outline" className="text-xs h-6">Adicionado</Badge>
                        ) : (
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-primary">
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <Users className="h-8 w-8 text-muted-foreground mb-2 opacity-20" />
                  <p className="text-sm text-muted-foreground">
                    {userSearchTerm ? 'Nenhum usuário encontrado.' : 'Sem usuários disponíveis.'}
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Adicionar Tarefa</DialogTitle>
            <DialogDescription>
              Crie uma nova tarefa para este plano de ação.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Descrição da tarefa</div>
              <Input
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="Descreva a tarefa que precisa ser executada..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleAddTask();
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsTaskModalOpen(false);
                setNewTaskDescription('');
              }}
            >
              Cancelar
            </Button>
            <Button onClick={() => void handleAddTask()}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Tarefa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barra de progresso fixa na parte inferior */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gray-200 z-40">
        <div 
          className={cn(
            "h-full transition-all duration-500",
            plano?.progresso === 100 ? 'bg-green-500' : 
            plano?.progresso > 50 ? 'bg-blue-500' : 
            'bg-yellow-500'
          )}
          style={{ width: `${plano?.progresso || 0}%` }}
        />
      </div>
    </div>
  );
};

export default DetalhesPlanoAcao;
  // Helper: mapeia ActionPlanDto do backend para a UI
  const mapDtoToPlanoUI = (dto: ActionPlanDto): PlanoAcao => {
    const mapStatus = (s: ActionPlanDto['status']): 'pendente' | 'em_andamento' | 'concluido' | 'atrasado' => {
      if (s === 'concluido') return 'concluido';
      return 'em_andamento';
    };
    return {
      id: dto.id,
      titulo: dto.title,
      descricao: dto.description ?? '',
      dataInicio: dto.start_date ?? dto.created_at ?? new Date().toISOString(),
      dataFim: dto.due_date ?? new Date().toISOString(),
      status: mapStatus(dto.status),
      progresso: dto.progress ?? 0,
      responsaveis: [],
      tarefas: (dto.goals ?? []).map((g: GoalDto, idx: number) => ({
        id: g.id ?? `${dto.id}-g${idx}`,
        descricao: g.description?.trim() || g.title,
        concluida: g.status === 'concluida',
        dataConclusao: g.status === 'concluida' ? (g.due_date ?? undefined) : undefined,
      })),
      anexos: [],
      historico: [],
      criadoEm: dto.created_at ?? new Date().toISOString(),
      atualizadoEm: dto.updated_at ?? new Date().toISOString(),
      criadoPor: 'Você',
    } as PlanoAcao;
  };
