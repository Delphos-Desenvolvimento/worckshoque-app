import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  RefreshCw,
  Building,
  Grid3X3,
  List,
  Table,
  Loader2,
  AlertCircle
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";

// Interface para usuário da API
interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: 'master' | 'admin' | 'user';
  company_id: string | null;
  is_active: boolean;
  last_login: string | null;
  allowed: Record<string, boolean> | boolean;
  created_at: string;
  updated_at: string;
  permissions: string[];
}

// Interface para usuário formatado para o componente
interface FormattedUser {
  id: string;
  name: string;
  email: string;
  cargo: string;
  departamento: string;
  status: 'Ativo' | 'Inativo';
  ultimoLogin: string;
  role: 'master' | 'admin' | 'user';
  permissions: string[];
  created_at: string;
}

// Gerar dados mockados mais realistas para demonstrar paginação
const generateMockUsers = () => {
  const names = [
    'João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Lima',
    'Fernanda Souza', 'Ricardo Alves', 'Juliana Pereira', 'Roberto Ferreira', 'Camila Rodrigues',
    'Eduardo Martins', 'Patrícia Gomes', 'Felipe Barbosa', 'Luciana Araújo', 'Marcos Ribeiro',
    'Gabriela Cardoso', 'Thiago Nascimento', 'Renata Silva', 'Diego Santos', 'Vanessa Lima',
    'Bruno Costa', 'Priscila Almeida', 'Gustavo Rocha', 'Tatiana Moreira', 'André Vieira',
    'Cristina Dias', 'Leonardo Pinto', 'Mônica Carvalho', 'Rodrigo Teixeira', 'Simone Reis',
    'Fábio Machado', 'Elaine Nunes', 'Vinicius Campos', 'Denise Correia', 'Márcio Freitas'
  ];
  
  const cargos = [
    'Analista de Sistemas', 'Gerente de Projetos', 'Designer UX', 'Desenvolvedor Frontend',
    'Desenvolvedor Backend', 'Product Owner', 'Scrum Master', 'Analista de Negócios',
    'Arquiteto de Software', 'DevOps Engineer', 'QA Tester', 'UI Designer',
    'Gerente de TI', 'Coordenador de Projetos', 'Especialista em Dados'
  ];
  
  const departamentos = ['TI', 'Design', 'Gestão', 'Desenvolvimento', 'Qualidade', 'Produto', 'Dados'];
  const statuses = ['Ativo', 'Inativo'];
  
  return names.map((name, index) => ({
    id: (index + 1).toString(),
    name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}.${Math.floor(Math.random() * 100)}@empresa.com`,
    cargo: cargos[Math.floor(Math.random() * cargos.length)],
    departamento: departamentos[Math.floor(Math.random() * departamentos.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    ultimoLogin: new Date(2024, 0, Math.floor(Math.random() * 30) + 1).toISOString().split('T')[0],
    diagnosticos: Math.floor(Math.random() * 15) + 1,
    planosAtivos: Math.floor(Math.random() * 5) + 1
  }));
};

const mockUsuarios = generateMockUsers();

// Função para mapear dados da API para o formato do componente
const mapApiUserToFormattedUser = (apiUser: ApiUser): FormattedUser => {
  // Mapear role para cargo em português
  const roleMapping = {
    'master': 'Master',
    'admin': 'Administrador',
    'user': 'Usuário'
  };

  // Mapear departamento baseado no role (pode ser expandido futuramente)
  const departmentMapping = {
    'master': 'Plataforma',
    'admin': 'Gestão',
    'user': 'Operacional'
  };

  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    cargo: roleMapping[apiUser.role],
    departamento: departmentMapping[apiUser.role],
    status: apiUser.is_active ? 'Ativo' : 'Inativo',
    ultimoLogin: apiUser.last_login ? 
      new Date(apiUser.last_login).toISOString().split('T')[0] : 
      'Nunca logou',
    role: apiUser.role,
    permissions: apiUser.permissions,
    created_at: apiUser.created_at
  };
};

export default function GestaoUsuarios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("todos");
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('table');
  
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Estados para dados reais
  const [usuarios, setUsuarios] = useState<FormattedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Função para buscar usuários da API
  const fetchUsuarios = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await api.get('/auth/users');
      
      if (!response.ok) {
        if (response.status === 0 || response.status >= 500) {
          throw new Error('Servidor backend não está disponível - verifique se está rodando na porta 3000');
        }
        throw new Error(`Erro ${response.status}: Erro ao carregar usuários`);
      }

      // Verificar se a resposta é JSON válido
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Resposta do servidor não é JSON válido - verifique se o backend está rodando');
      }

      const apiUsers: ApiUser[] = await response.json();
      
      const formattedUsers: FormattedUser[] = apiUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        cargo: user.role === 'master' ? 'Master' : user.role === 'admin' ? 'Administrador' : 'Usuário',
        departamento: user.company_id ? 'Empresa' : 'Geral',
        status: user.is_active ? 'Ativo' : 'Inativo',
        ultimoLogin: user.last_login ? new Date(user.last_login).toLocaleDateString('pt-BR') : 'Nunca',
        role: user.role,
        permissions: user.permissions || [],
        created_at: user.created_at
      }));
      
      setUsuarios(formattedUsers);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      
      // Tratar erro específico de JSON
      if (err instanceof SyntaxError && err.message.includes('JSON')) {
        setError('Erro na resposta do servidor - verifique se o backend está rodando');
      } else if (err instanceof Error) {
        setError(`Erro ao carregar usuários: ${err.message}`);
      } else {
        setError('Erro desconhecido ao carregar usuários');
      }
      // Não usar dados mockados em caso de erro para forçar o uso da API real
      setUsuarios([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Filtrar usuários (usar dados reais ao invés de mockados)
  const filteredUsuarios = usuarios.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "todos" || 
                         (filter === "ativo" && user.status === "Ativo") ||
                         (filter === "inativo" && user.status === "Inativo") ||
                         (filter === "master" && user.role === "master") ||
                         (filter === "admin" && user.role === "admin") ||
                         (filter === "user" && user.role === "user");
    return matchesSearch && matchesFilter;
  });

  // Calcular paginação
  const totalItems = filteredUsuarios.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsuarios = filteredUsuarios.slice(startIndex, endIndex);

  // Handlers de paginação
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Resetar para primeira página
  };

  // Resetar página quando filtros mudam
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    return status === 'Ativo' ? 
      <Badge variant="default" className="bg-green-100 text-green-800">Ativo</Badge> :
      <Badge variant="secondary" className="bg-red-100 text-red-800">Inativo</Badge>;
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestão de Usuários"
        description="Gerencie colaboradores da sua empresa"
        icon={Users}
        badges={[
          { label: `${totalItems} colaboradores`, icon: Users },
          { label: `Página ${currentPage} de ${totalPages}`, icon: UserCheck },
          { label: `${paginatedUsuarios.length} visíveis`, icon: Building }
        ]}
        actions={[
          { 
            label: refreshing ? "Atualizando..." : "Atualizar", 
            icon: refreshing ? Loader2 : RefreshCw, 
            onClick: () => fetchUsuarios(true),
            variant: 'primary' as const,
            disabled: refreshing
          },
          { 
            label: "Novo Usuário", 
            icon: Plus, 
            onClick: () => console.log('Criando novo usuário...'),
            variant: 'primary' as const
          }
        ]}
      />

      <div className="container mx-auto px-4">

        {/* Controles */}
        <Card className="mb-6">
        <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
                <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant={filter === "todos" ? "default" : "outline"}
                size="sm"
                    onClick={() => handleFilterChange("todos")}
                  >
                    Todos ({usuarios.length})
                  </Button>
                  <Button 
                    variant={filter === "master" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterChange("master")}
                  >
                    Master ({usuarios.filter(u => u.role === 'master').length})
              </Button>
              <Button 
                    variant={filter === "admin" ? "default" : "outline"}
                size="sm"
                    onClick={() => handleFilterChange("admin")}
              >
                    Admin ({usuarios.filter(u => u.role === 'admin').length})
              </Button>
              <Button 
                    variant={filter === "user" ? "default" : "outline"}
                size="sm"
                    onClick={() => handleFilterChange("user")}
              >
                    Usuários ({usuarios.filter(u => u.role === 'user').length})
              </Button>
                </div>
              </div>

              {/* Controles de Visualização */}
              <div className="flex items-center gap-2 mt-4 lg:mt-0">
                <span className="text-sm font-medium text-muted-foreground mr-2">Visualização:</span>
                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'list' | 'table')}>
                  <TabsList>
                    <TabsTrigger value="grid" className="p-2">
                      <Grid3X3 className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="list" className="p-2">
                      <List className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="table" className="p-2">
                      <Table className="h-4 w-4" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

        {/* Estados de Loading e Error */}
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="w-12 h-12 mx-auto text-muted-foreground mb-4 animate-spin" />
              <h3 className="text-lg font-semibold mb-2">Carregando usuários...</h3>
              <p className="text-muted-foreground">
                Por favor, aguarde enquanto buscamos os dados.
              </p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-red-600">Erro ao carregar usuários</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => fetchUsuarios()} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        ) : totalItems > 0 ? (
          <>
            {/* Visualização Grid */}
            {viewMode === 'grid' && (
              <div className="grid gap-6">
                {paginatedUsuarios.map((usuario) => (
          <Card key={usuario.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {usuario.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{usuario.name}</h3>
                      {getStatusBadge(usuario.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{usuario.cargo}</p>
                            <p className="text-sm text-muted-foreground">{usuario.departamento}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                        {usuario.email}
                              </span>
                    </div>
                  </div>
                </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right space-y-1">
                            <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                                <p className="text-sm text-muted-foreground">Criado em</p>
                                <p className="font-medium">{new Date(usuario.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="text-center">
                                <p className="text-sm text-muted-foreground">Último Login</p>
                                <p className="font-medium">
                                  {usuario.ultimoLogin === 'Nunca logou' ? 
                                    'Nunca logou' : 
                                    new Date(usuario.ultimoLogin).toLocaleDateString('pt-BR')
                                  }
                                </p>
                  </div>
                  <div className="text-center">
                                <p className="text-sm text-muted-foreground">Permissões</p>
                                <p className="font-medium">{usuario.permissions.length}</p>
                              </div>
                            </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                            <DropdownMenuContent>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <UserCheck className="w-4 h-4 mr-2" />
                                Ativar
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                            <UserX className="w-4 h-4 mr-2" />
                            Desativar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
            )}

            {/* Visualização List */}
            {viewMode === 'list' && (
              <div className="space-y-3">
                {paginatedUsuarios.map((usuario) => (
                  <Card key={usuario.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="text-sm">
                              {usuario.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground truncate">{usuario.name}</h3>
                              {getStatusBadge(usuario.status)}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{usuario.cargo} • {usuario.departamento}</p>
                            <p className="text-xs text-muted-foreground truncate">{usuario.email}</p>
                          </div>

                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="text-center">
                              <p className="font-medium">{new Date(usuario.created_at).toLocaleDateString('pt-BR')}</p>
                              <p className="text-xs">Criado em</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium">{usuario.permissions.length}</p>
                              <p className="text-xs">Permissões</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium">
                                {usuario.ultimoLogin === 'Nunca logou' ? 
                                  'Nunca logou' : 
                                  new Date(usuario.ultimoLogin).toLocaleDateString('pt-BR')
                                }
                              </p>
                              <p className="text-xs">Último Login</p>
                            </div>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <UserCheck className="w-4 h-4 mr-2" />
                              Ativar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <UserX className="w-4 h-4 mr-2" />
                              Desativar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Visualização Table */}
            {viewMode === 'table' && (
              <Card>
                <CardContent className="p-0">
                  <TableComponent>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Cargo/Departamento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Permissões</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Último Login</TableHead>
                        <TableHead className="w-[70px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUsuarios.map((usuario) => (
                        <TableRow key={usuario.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {usuario.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{usuario.name}</p>
                                <p className="text-sm text-muted-foreground">{usuario.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{usuario.cargo}</p>
                              <p className="text-sm text-muted-foreground">{usuario.departamento}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(usuario.status)}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{usuario.permissions.length}</span>
                          </TableCell>
                          <TableCell>
                            {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            {usuario.ultimoLogin === 'Nunca logou' ? 
                              <Badge variant="outline" className="text-muted-foreground">Nunca logou</Badge> : 
                              new Date(usuario.ultimoLogin).toLocaleDateString('pt-BR')
                            }
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Ativar
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <UserX className="w-4 h-4 mr-2" />
                                  Desativar
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </TableComponent>
                </CardContent>
              </Card>
            )}

            {/* Componente de Paginação */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  showPageSizeSelector={true}
                  pageSizeOptions={[5, 10, 25, 50]}
                  className="border-t pt-4"
                />
              </div>
            )}
          </>
        ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
            <p className="text-muted-foreground">
                {searchTerm || filter !== "todos" 
                  ? "Tente ajustar os filtros ou termo de busca."
                  : "Nenhum usuário cadastrado no sistema."
                }
            </p>
          </CardContent>
        </Card>
      )}

      </div>
    </div>
  );
}
