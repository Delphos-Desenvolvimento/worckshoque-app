import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// Tipos e Interfaces
type ContentType = 'article' | 'video' | 'infographic' | 'document' | 'link';
type ContentStatus = 'draft' | 'published' | 'archived';

interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
}

interface Content {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  category: string;
  status: ContentStatus;
  views: number;
  downloads: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isFavorite?: boolean;
  tags: string[];
  coverImage?: string;
  difficulty?: string;
  duration?: number;
  metadata?: {
    difficulty?: string;
    duration?: number;
    tags?: string[];
  };
}

// Componentes básicos
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

// Componentes de Card
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

// Componentes de Diálogo
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';

// Componentes de Seleção
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from '@/components/ui/select';

// Componentes de Tabela
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption } from '@/components/ui/table';

// Componentes de Input
// Removed unused and invalid input group elements

// Ícones
import {
  Search as SearchIcon,
  FileText,
  FileVideo,
  FileImage,
  File as FileIcon,
  Tag as TagIcon,
  Heart as HeartIcon,
  Star as StarIcon,
  Trash2 as TrashIcon,
  Plus as PlusIcon,
  Eye,
  Pencil,
  X,
  Check,
  ChevronDown,
  Sliders as SlidersIcon,
  Download,
  Share2,
  BarChart2,
  Settings as SettingsIcon,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lightbulb,
  BookOpen,
  MessageCircle,
  Award,
  Briefcase,
  Camera,
  FileQuestion,
  Film,
  Folder,
  Headphones,
  HelpCircle,
  Home,
  Image as ImageIcon,
  Info,
  Layers,
  Layout,
  LifeBuoy,
  Link as LinkIcon,
  List,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Moon,
  MoreHorizontal,
  MoreVertical,
  Paperclip,
  Phone,
  PieChart,
  Play,
  PlusCircle,
  Power,
  Radio,
  RefreshCw,
  Save,
  Scissors,
  Send,
  Server,
  Shield as ShieldIcon,
  Sidebar,
  Smartphone,
  Speaker,
  Sun,
  Tablet,
  Target,
  Terminal,
  Thermometer,
  ThumbsUp,
  ThumbsDown,
  ToggleLeft,
  ToggleRight,
  User,
  Users,
  Video,
  Volume,
  Volume2,
  Wifi,
  WifiOff,
  XCircle as XCircleIcon,
  Zap,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

// Componentes personalizados
import PageHeader from '@/components/common/PageHeader';

// Dados de exemplo
const mockConteudos: Content[] = [
  {
    id: '1',
    title: 'Guia de Boas Práticas de Saúde Mental',
    description: 'Material completo sobre práticas de saúde mental no ambiente de trabalho',
    type: 'article',
    category: 'Saúde Mental',
    status: 'published',
    views: 1247,
    downloads: 543,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
    createdBy: 'Admin',
    isFavorite: true,
    tags: [],
    metadata: {
      tags: ['saúde mental', 'bem-estar', 'trabalho'],
      difficulty: 'intermediário',
      duration: 15
    }
  },
  {
    id: '2',
    title: 'Vídeo: Técnicas de Meditação',
    description: 'Aprenda técnicas básicas de meditação para o dia a dia',
    type: 'video',
    category: 'Bem-estar',
    status: 'published',
    views: 2456,
    downloads: 0,
    createdAt: '2024-02-10',
    updatedAt: '2024-02-10',
    createdBy: 'Admin',
    tags: [],
    metadata: {
      tags: ['meditação', 'relaxamento', 'estresse'],
      difficulty: 'iniciante',
      duration: 10
    }
  },
  {
    id: '3',
    title: 'Infográfico: Sinais de Estresse',
    description: 'Identifique os principais sinais de estresse no ambiente de trabalho',
    type: 'infographic',
    category: 'Saúde Ocupacional',
    status: 'draft',
    views: 0,
    downloads: 0,
    createdAt: '2024-03-01',
    updatedAt: '2024-03-01',
    createdBy: 'Usuário Teste',
    tags: [],
    metadata: {
      tags: ['estresse', 'saúde ocupacional', 'bem-estar'],
      difficulty: 'iniciante'
    }
  }
];

const mockCategories: Category[] = [
  { id: '1', name: 'Saúde Mental', color: '#3b82f6', icon: 'heart', isActive: true },
  { id: '2', name: 'Segurança', color: '#ef4444', icon: 'shield', isActive: true },
  { id: '3', name: 'Bem-estar', color: '#10b981', icon: 'smile', isActive: true },
  { id: '4', name: 'Treinamento', color: '#f59e0b', icon: 'book-open', isActive: true },
];

const ContentManager = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'master';
  
  // Estados para o gerenciamento de conteúdo
  const [contents, setContents] = useState<Content[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingConteudo, setEditingConteudo] = useState<Content | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({});
  
  // Estados para os filtros
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterType, setFilterType] = useState<string>('todos');
  const [filterCategoria, setFilterCategoria] = useState<string>('todos');
  
  // Estados para o formulário
  const [formData, setFormData] = useState<Omit<Content, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'views' | 'downloads'>>({
    title: '',
    description: '',
    type: 'article',
    category: '',
    status: 'draft',
    tags: [],
    isFavorite: false,
    metadata: {}
  });

  

  // Ícones disponíveis para categorias
  const categoryIcons = [
    { name: 'tag', icon: TagIcon },
    { name: 'book', icon: FileText },
    { name: 'heart', icon: HeartIcon },
    { name: 'star', icon: StarIcon },
    { name: 'file-text', icon: FileText },
  ];

  // Funções de manipulação de categorias
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm(category);
    setIsCategoryModalOpen(true);
  };

  // Carregar conteúdos e categorias da API
  const fetchContents = async () => {
    try {
      setLoading(true);
      // Buscar conteúdos reais do backend
      const response = await api.get('/contents');
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error('Erro ao carregar conteúdos:', errorText);
        toast.error('Não foi possível carregar conteúdos do servidor.');
        setContents([]);
      } else {
        const contentsData = await response.json();
        const list = Array.isArray(contentsData) ? contentsData : (contentsData?.items ?? []);
        const transformedContents: Content[] = list.map((c: {
          id: string;
          title: string;
          description: string;
          type: string;
          category: { name: string };
          status: string;
          views: number;
          downloads: number;
          created_at: string;
          updated_at: string;
          created_by: string;
          is_featured?: boolean;
          metadata?: Record<string, unknown>;
        }) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          type: c.type as ContentType,
          category: c.category?.name || '',
          status: c.status as ContentStatus,
          views: c.views || 0,
          downloads: c.downloads || 0,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
          createdBy: c.created_by,
          isFavorite: c.is_featured || false,
          tags: (() => {
            const m = c.metadata as unknown as { tags?: unknown };
            return Array.isArray(m?.tags) ? (m.tags as string[]) : [];
          })(),
          metadata: (c.metadata as unknown) as {
            difficulty?: string;
            duration?: number;
            tags?: string[];
          } || {}
        }));
        setContents(transformedContents);
      }

      const catRes = await api.get('/categories?type=content');
      if (catRes.ok) {
        const categoriesData = await catRes.json();
        const listRaw = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.items ?? []);
        const flattenCategories = (arr: unknown[]): unknown[] => {
          const result: unknown[] = [];
          const stack: unknown[] = Array.isArray(arr) ? [...arr] : [];
          while (stack.length) {
            const node = stack.shift() as unknown;
            result.push(node);
            const children = (node as { children?: unknown[] }).children;
            if (children && Array.isArray(children)) {
              for (const child of children) stack.push(child);
            }
          }
          return result;
        };
        const flat = flattenCategories(listRaw) as Array<{
          id: string;
          name: string;
          description?: string | null;
          color?: string | null;
          icon?: string | null;
          isActive?: boolean;
          is_active?: boolean;
        }>;
        const mapped = flat.map((cat) => ({
          id: cat.id,
          name: cat.name,
          description: cat.description ?? undefined,
          color: cat.color ?? undefined,
          icon: cat.icon ?? undefined,
          isActive: cat.isActive ?? (cat.is_active !== false),
        }));
        setCategories(mapped);
      } else {
        setCategories([]);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, []);

  const handleDeleteCategory = async (id: string) => {
    const categoryName = categories.find(cat => cat.id === id)?.name || 'esta categoria';
    
    if (!window.confirm(`Tem certeza que deseja excluir ${categoryName}?`)) {
      return;
    }

    try {
      const response = await api.delete(`/categories/${id}`);
      if (response.ok) {
        setCategories(prev => prev.filter(cat => cat.id !== id));
        toast.success('Categoria excluída com sucesso!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Erro ao excluir categoria');
      }
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast.error('Erro ao excluir categoria. Tente novamente.');
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name?.trim()) {
      toast.error('Por favor, preencha o nome da categoria.');
      return;
    }

    try {
      setLoading(true);

      if (editingCategory) {
        // Editar categoria existente
        const response = await api.put(`/categories/${editingCategory.id}`, {
          name: categoryForm.name,
          description: categoryForm.description,
          color: categoryForm.color,
          icon: categoryForm.icon,
        });

        if (response.ok) {
          const updatedCategory = await response.json();
          setCategories(prev => prev.map(cat => 
            cat.id === editingCategory.id
              ? {
                  ...cat,
                  name: updatedCategory.name || categoryForm.name || '',
                  description: updatedCategory.description || categoryForm.description,
                  color: updatedCategory.color || categoryForm.color,
                  icon: updatedCategory.icon || categoryForm.icon,
                  isActive: true
                }
              : cat
          ));
          toast.success('Categoria atualizada com sucesso!');
          
          // Fechar modal e resetar formulário
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
          setCategoryForm({ name: '', isActive: true });
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.message || 'Erro ao atualizar categoria');
        }
      } else {
        // Criar nova categoria
        const response = await api.post('/categories', {
          name: categoryForm.name,
          description: categoryForm.description,
          type: 'content',
          color: categoryForm.color,
          icon: categoryForm.icon,
          isActive: categoryForm.isActive !== false,
        });

        if (response.ok) {
          const newCategory = await response.json();
          setCategories(prev => [...prev, {
            id: newCategory.id,
            name: newCategory.name,
            description: newCategory.description,
            color: newCategory.color,
            icon: newCategory.icon,
            isActive: true
          }]);
          toast.success('Categoria criada com sucesso!');
          
          // Fechar modal e resetar formulário
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
          setCategoryForm({ name: '', isActive: true });
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.message || 'Erro ao criar categoria');
        }
      }
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast.error('Erro ao salvar categoria. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const openCategoryModal = (category: Category | null = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm(category);
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', isActive: true });
    }
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
  };

  // Handlers para Conteúdos
  const handleCreateConteudo = () => {
    setIsCreateModalOpen(true);
    setFormData({
      title: '',
      description: '',
      type: 'article',
      category: '',
      status: 'draft',
      tags: [],
      isFavorite: false,
      metadata: {}
    });
  };

  const handleEditConteudo = (conteudo: Content) => {
    setEditingConteudo(conteudo);
    // Buscar ID da categoria pelo nome
    const categoryId = categories.find(cat => cat.name === conteudo.category)?.id || conteudo.category;
    
    setFormData({
      title: conteudo.title,
      description: conteudo.description,
      type: conteudo.type,
      category: categoryId,
      status: conteudo.status,
      tags: conteudo.tags || [],
      isFavorite: conteudo.isFavorite || false,
      metadata: conteudo.metadata || {}
    });
    setIsEditModalOpen(true);
  };

  const handleSaveConteudo = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!formData.category) {
      toast.error('Por favor, selecione uma categoria.');
      return;
    }

    try {
      setLoading(true);
      
      const apiData = {
        title: formData.title,
        description: formData.description,
        content: formData.description,
        type: formData.type,
        category_id: formData.category,
        status: formData.status,
        is_featured: formData.isFavorite,
        metadata: {
          ...formData.metadata,
          tags: formData.tags
        }
      };

      let response: Response;

      if (isCreateModalOpen) {
        // Criar novo conteúdo
        response = await api.post('/contents', apiData);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
        }

        const newContentData = await response.json();
        // Transformar dados da API para o formato do frontend
        const newContent: Content = {
          id: newContentData.id,
          title: newContentData.title,
          description: newContentData.description,
          type: newContentData.type as ContentType,
          category: newContentData.category?.name || '',
          status: newContentData.status as ContentStatus,
          views: newContentData.views || 0,
          downloads: newContentData.downloads || 0,
          createdAt: newContentData.created_at,
          updatedAt: newContentData.updated_at,
          createdBy: newContentData.created_by,
          isFavorite: newContentData.is_featured || false,
          tags: Array.isArray(newContentData.metadata?.tags) ? newContentData.metadata.tags as string[] : [],
          metadata: newContentData.metadata || {}
        };
        
        setContents(prev => [...prev, newContent]);
        toast.success('Conteúdo criado com sucesso!');
      } else if (isEditModalOpen && editingConteudo) {
        // Editar conteúdo existente
        response = await api.put(`/contents/${editingConteudo.id}`, {
          ...apiData,
          content: formData.description
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
        }

        const updatedContentData = await response.json();
        // Transformar dados da API para o formato do frontend
        const updatedContent: Content = {
          id: updatedContentData.id,
          title: updatedContentData.title,
          description: updatedContentData.description,
          type: updatedContentData.type as ContentType,
          category: updatedContentData.category?.name || '',
          status: updatedContentData.status as ContentStatus,
          views: updatedContentData.views || 0,
          downloads: updatedContentData.downloads || 0,
          createdAt: updatedContentData.created_at,
          updatedAt: updatedContentData.updated_at,
          createdBy: updatedContentData.created_by,
          isFavorite: updatedContentData.is_featured || false,
          tags: Array.isArray(updatedContentData.metadata?.tags) ? updatedContentData.metadata.tags as string[] : [],
          metadata: updatedContentData.metadata || {}
        };

        setContents(prev => prev.map(content => 
          content.id === editingConteudo.id ? updatedContent : content
        ));
        toast.success('Conteúdo atualizado com sucesso!');
      }

      // Fechar modal e resetar formulário
      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
      setEditingConteudo(null);
      setFormData({
        title: '',
        description: '',
        type: 'article',
        category: '',
        status: 'draft',
        tags: [],
        isFavorite: false,
        metadata: {}
      });
    } catch (error) {
      console.error('Erro ao salvar conteúdo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar conteúdo. Tente novamente.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConteudo = async (id: string) => {
    const contentTitle = contents.find(c => c.id === id)?.title || 'este conteúdo';
    
    if (!window.confirm(`Tem certeza que deseja excluir "${contentTitle}"?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.delete(`/contents/${id}`);
      
      if (response.ok) {
        setContents(prev => prev.filter(content => content.id !== id));
        toast.success('Conteúdo excluído com sucesso!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Erro ao excluir conteúdo');
      }
    } catch (error) {
      console.error('Erro ao excluir conteúdo:', error);
      toast.error('Erro ao excluir conteúdo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gerenciador de Conteúdos"
        description="Gerencie todo o conteúdo da plataforma"
        icon={BookOpen}
        actions={[
          {
            label: 'Gerenciar Categorias',
            icon: TagIcon,
            onClick: () => openCategoryModal(),
            variant: 'secondary'
          },
          {
            label: 'Novo Conteúdo',
            icon: PlusIcon,
            onClick: handleCreateConteudo
          }
        ]}
      />

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Conteúdos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contents.length}</div>
            <p className="text-xs text-muted-foreground">
              {contents.filter(c => c.status === 'published').length} publicados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contents.reduce((acc, curr) => acc + curr.views, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contents.reduce((acc, curr) => acc + curr.downloads, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +8% em relação ao mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Engajamento Médio</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">
              +5% em relação ao mês passado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Tabela de Conteúdos */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="w-full md:w-1/3">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar conteúdo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="published">Publicados</SelectItem>
                  <SelectItem value="draft">Rascunhos</SelectItem>
                  <SelectItem value="archived">Arquivados</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo de conteúdo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="article">Artigos</SelectItem>
                  <SelectItem value="video">Vídeos</SelectItem>
                  <SelectItem value="infographic">Infográficos</SelectItem>
                  <SelectItem value="document">Documentos</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Visualizações</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contents.map((content) => (
                <TableRow key={content.id}>
                  <TableCell className="font-medium">{content.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {content.type === 'article' && 'Artigo'}
                      {content.type === 'video' && 'Vídeo'}
                      {content.type === 'infographic' && 'Infográfico'}
                      {content.type === 'document' && 'Documento'}
                    </Badge>
                  </TableCell>
                  <TableCell>{content.category}</TableCell>
                  <TableCell>
                    <Badge
                      variant={content.status === 'published' ? 'default' : 'secondary'}
                      className={content.status === 'published' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {content.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </Badge>
                  </TableCell>
                  <TableCell>{content.views.toLocaleString()}</TableCell>
                  <TableCell>{content.downloads.toLocaleString()}</TableCell>
                  <TableCell>
                    {format(new Date(content.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {isAdmin && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditConteudo(content)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteConteudo(content.id)}
                          >
                            <TrashIcon className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modais */}
      {/* Modal de Criação/Edição de Conteúdo */}
      <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setEditingConteudo(null);
        }
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {isCreateModalOpen ? 'Adicionar Novo Conteúdo' : 'Editar Conteúdo'}
            </DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para {isCreateModalOpen ? 'adicionar um novo' : 'editar o'} conteúdo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Título
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="col-span-3"
                placeholder="Digite o título do conteúdo"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="col-span-3"
                rows={3}
                placeholder="Digite uma descrição para o conteúdo"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Tipo
              </Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({...formData, type: value as ContentType})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o tipo de conteúdo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Artigo</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="infographic">Infográfico</SelectItem>
                  <SelectItem value="document">Documento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Categoria
              </Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({...formData, category: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({...formData, status: value as ContentStatus})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Destaque
              </Label>
              <div className="col-span-3">
                <Switch
                  id="isFavorite"
                  checked={formData.isFavorite}
                  onCheckedChange={(checked) => setFormData({...formData, isFavorite: checked})}
                />
                <Label htmlFor="isFavorite" className="ml-2 text-sm font-medium">
                  Marcar como destaque
                </Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateModalOpen(false);
              setIsEditModalOpen(false);
              setEditingConteudo(null);
            }}>
              Cancelar
            </Button>
            <Button 
              type="button"
              onClick={handleSaveConteudo}
              disabled={loading}
            >
              {loading ? 'Salvando...' : (isCreateModalOpen ? 'Criar Conteúdo' : 'Salvar Alterações')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Categorias */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? 'Atualize os dados da categoria' 
                : 'Preencha os campos para criar uma nova categoria'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categoryName" className="text-right">
                Nome
              </Label>
              <Input
                id="categoryName"
                value={categoryForm.name || ''}
                onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                className="col-span-3"
                placeholder="Digite o nome da categoria"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categoryDescription" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="categoryDescription"
                value={categoryForm.description || ''}
                onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                className="col-span-3"
                rows={2}
                placeholder="Digite uma descrição para a categoria"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categoryColor" className="text-right">
                Cor
              </Label>
              <Input
                id="categoryColor"
                type="color"
                value={categoryForm.color || '#3b82f6'}
                onChange={(e) => setCategoryForm({...categoryForm, color: e.target.value})}
                className="h-10 w-16 p-1"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Status
              </Label>
              <div className="col-span-3">
                <Switch
                  id="categoryStatus"
                  checked={categoryForm.isActive !== false}
                  onCheckedChange={(checked) => setCategoryForm({...categoryForm, isActive: checked})}
                />
                <Label htmlFor="categoryStatus" className="ml-2 text-sm font-medium">
                  {categoryForm.isActive !== false ? 'Ativo' : 'Inativo'}
                </Label>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Ícone
              </Label>
              <div className="col-span-3 flex flex-wrap gap-2">
                {categoryIcons.map((item) => (
                  <Button
                    key={item.name}
                    variant="outline"
                    size="icon"
                    className={`h-10 w-10 ${
                      categoryForm.icon === item.name ? 'border-primary' : ''
                    }`}
                    onClick={() => setCategoryForm({...categoryForm, icon: item.name})}
                  >
                    <item.icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            {editingCategory && (
              <Button 
                variant="destructive" 
                className="mr-auto"
                onClick={() => {
                  if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
                    handleDeleteCategory(editingCategory.id);
                    setIsCategoryModalOpen(false);
                  }
                }}
              >
                Excluir Categoria
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => setIsCategoryModalOpen(false)}
            >
              Cancelar
            </Button>
            
            <Button 
              type="button"
              onClick={handleSaveCategory}
            >
              {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentManager;
