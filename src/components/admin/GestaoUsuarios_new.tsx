import { useState } from "react";
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
  Table
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mockUsuarios = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao.silva@empresa.com',
    cargo: 'Analista de Sistemas',
    departamento: 'TI',
    status: 'Ativo',
    ultimoLogin: '2024-01-20',
    diagnosticos: 5,
    planosAtivos: 2
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria.santos@empresa.com',
    cargo: 'Gerente de Projetos',
    departamento: 'Gestão',
    status: 'Ativo',
    ultimoLogin: '2024-01-19',
    diagnosticos: 8,
    planosAtivos: 3
  },
  {
    id: '3',
    name: 'Pedro Oliveira',
    email: 'pedro.oliveira@empresa.com',
    cargo: 'Designer UX',
    departamento: 'Design',
    status: 'Inativo',
    ultimoLogin: '2024-01-15',
    diagnosticos: 3,
    planosAtivos: 1
  }
];

export default function GestaoUsuarios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("todos");
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid');

  const filteredUsuarios = mockUsuarios.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "todos" || user.status.toLowerCase() === filter;
    return matchesSearch && matchesFilter;
  });

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
          { label: `${filteredUsuarios.length} colaboradores`, icon: Users },
          { label: "Sistema RBAC", icon: UserCheck },
          { label: "Controle Total", icon: Building }
        ]}
        actions={[
          { 
            label: "Atualizar", 
            icon: RefreshCw, 
            onClick: () => console.log('Atualizando gestão de usuários...'),
            variant: 'primary' as const
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
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant={filter === "todos" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("todos")}
                  >
                    Todos ({mockUsuarios.length})
                  </Button>
                  <Button 
                    variant={filter === "ativo" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("ativo")}
                  >
                    Ativos ({mockUsuarios.filter(u => u.status === 'Ativo').length})
                  </Button>
                  <Button 
                    variant={filter === "inativo" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("inativo")}
                  >
                    Inativos ({mockUsuarios.filter(u => u.status === 'Inativo').length})
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

        {/* Renderização Condicional dos Usuários */}
        {filteredUsuarios.length > 0 ? (
          <>
            {/* Visualização Grid */}
            {viewMode === 'grid' && (
              <div className="grid gap-6">
                {filteredUsuarios.map((usuario) => (
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
                                <p className="font-semibold text-lg">{usuario.diagnosticos}</p>
                                <p className="text-muted-foreground">Diagnósticos</p>
                              </div>
                              <div className="text-center">
                                <p className="font-semibold text-lg">{usuario.planosAtivos}</p>
                                <p className="text-muted-foreground">Planos Ativos</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground">Último Login</p>
                                <p className="font-medium">{new Date(usuario.ultimoLogin).toLocaleDateString('pt-BR')}</p>
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
                {filteredUsuarios.map((usuario) => (
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
                              <p className="font-medium">{usuario.diagnosticos}</p>
                              <p className="text-xs">Diagnósticos</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium">{usuario.planosAtivos}</p>
                              <p className="text-xs">Planos</p>
                            </div>
                            <div className="text-center">
                              <p className="font-medium">{new Date(usuario.ultimoLogin).toLocaleDateString('pt-BR')}</p>
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
                        <TableHead>Diagnósticos</TableHead>
                        <TableHead>Planos Ativos</TableHead>
                        <TableHead>Último Login</TableHead>
                        <TableHead className="w-[70px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsuarios.map((usuario) => (
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
                            <span className="font-medium">{usuario.diagnosticos}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{usuario.planosAtivos}</span>
                          </TableCell>
                          <TableCell>
                            {new Date(usuario.ultimoLogin).toLocaleDateString('pt-BR')}
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
          </>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
              <p className="text-muted-foreground">
                Tente ajustar os filtros ou termo de busca.
              </p>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
