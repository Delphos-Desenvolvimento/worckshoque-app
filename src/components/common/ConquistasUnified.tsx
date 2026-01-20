import React, { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";
import { usePermissions } from "@/contexts/PermissionsContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Award,
  Star,
  Target,
  TrendingUp,
  Trophy,
  RefreshCw,
  Search,
  Plus,
  Users,
  Loader2
} from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: string;
  category: string;
  xp_points: number;
  rarity: string;
  is_active: boolean;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

interface UserStats {
  nivel: number;
  xpAtual: number;
  xpProximo: number;
  conquistasDesbloqueadas: number;
  totalConquistas: number;
}

function getEventIcon(tipo: string) {
  switch (tipo) {
    case "nivel":
      return <Star className="w-5 h-5 text-accent" />;
    case "conquista":
      return <Award className="w-5 h-5 text-accent" />;
    case "acao":
      return <Target className="w-5 h-5 text-accent" />;
    case "diagnostico":
      return <Target className="w-5 h-5 text-accent" />;
    default:
      return <Trophy className="w-5 h-5 text-muted-foreground" />;
  }
}

const mockUserStats = {
  nivel: 5,
  xpAtual: 2450,
  xpProximo: 5000,
  conquistasDesbloqueadas: 12,
  totalConquistas: 50,
  posicaoRanking: 42,
  totalUsuarios: 150
};

const mockAdminConquistas = [
  {
    id: '1',
    nome: 'Primeiros Passos',
    descricao: 'Complete o tutorial inicial da plataforma',
    icone: '🚀',
    nivel: 'iniciante',
    raridade: 'comum',
    status: 'ativa',
    pontos: 100,
    usuariosConquistaram: 125,
    taxaDesbloqueio: 85
  },
  {
    id: '2',
    nome: 'Diagnóstico Completo',
    descricao: 'Realize um diagnóstico completo de sua empresa',
    icone: '📊',
    nivel: 'intermediario',
    raridade: 'rara',
    status: 'ativa',
    pontos: 500,
    usuariosConquistaram: 45,
    taxaDesbloqueio: 30
  }
];

const mockUserTimeline = [
  {
    id: '1',
    titulo: 'Conquista Desbloqueada: Primeiros Passos',
    data: new Date().toISOString(),
    tipo: 'conquista',
    pontos: 100
  },
  {
    id: '2',
    titulo: 'Subiu para o Nível 5',
    data: new Date(Date.now() - 86400000).toISOString(),
    tipo: 'nivel',
    pontos: 0
  }
];

export default function ConquistasUnified() {
  const { user } = useAuthStore();
  const { hasPermission } = usePermissions();
  const role = user?.role || "user";

  const isAdminLike = role === "admin" || role === "master";
  const canManage = isAdminLike && (hasPermission("conquista.view") || hasPermission("conquista.manage") || hasPermission("conquista.create"));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Conquistas"
        description={
          canManage
            ? "Gerencie conquistas do sistema: criação, edição e estatísticas"
            : "Suas conquistas pessoais, ranking e progresso"
        }
        icon={Award}
        badges={[
          { label: `Nível ${mockUserStats.nivel}`, icon: Star },
          { label: `#${mockUserStats.posicaoRanking} no ranking`, icon: Trophy },
          { label: `${mockUserStats.conquistasDesbloqueadas}/${mockUserStats.totalConquistas} conquistas`, icon: Target },
        ]}
        actions={
          canManage
            ? [
                {
                  label: "Nova Conquista",
                  icon: Plus,
                  onClick: () => console.log("Abrir modal de nova conquista"),
                  variant: "primary",
                },
                {
                  label: "Atualizar",
                  icon: RefreshCw,
                  onClick: () => console.log("Atualizando conquistas"),
                  variant: "primary",
                },
              ]
            : [
                {
                  label: "Atualizar",
                  icon: RefreshCw,
                  onClick: () => console.log("Atualizando progresso"),
                  variant: "primary",
                },
              ]
        }
      />

      <div className="container mx-auto px-4">
        {canManage ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <div className="ml-2">
                      <p className="text-sm font-medium text-muted-foreground">Total de Conquistas</p>
                      <p className="text-2xl font-bold">{mockUserStats.totalConquistas}</p>
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
                      <p className="text-2xl font-bold">{mockUserStats.totalUsuarios}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input placeholder="Buscar conquistas..." className="pl-10" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {mockAdminConquistas.map((conquista) => (
                <Card key={conquista.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{conquista.icone}</span>
                          <h3 className="text-lg font-semibold">{conquista.nome}</h3>
                          <Badge variant={"outline"}>{conquista.nivel.toUpperCase()}</Badge>
                          <Badge variant={"outline"}>{conquista.raridade.toUpperCase()}</Badge>
                          <Badge variant={conquista.status === "ativa" ? "default" : "secondary"}>{conquista.status.toUpperCase()}</Badge>
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
                            <span className="text-sm text-muted-foreground">{conquista.taxaDesbloqueio}% conquistaram</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">Editar</Button>
                          <Button size="sm" variant="outline">Excluir</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Star className="w-8 h-8 text-accent" />
                    <div>
                      <p className="text-2xl font-bold">Nível {mockUserStats.nivel}</p>
                      <p className="text-sm text-muted-foreground">
                        {mockUserStats.xpAtual}/{mockUserStats.xpProximo} XP
                      </p>
                    </div>
                  </div>
                  <Progress value={(mockUserStats.xpAtual / mockUserStats.xpProximo) * 100} className="mt-3 h-2" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-yellow-500" />
                    <div>
                      <p className="text-2xl font-bold">#{mockUserStats.posicaoRanking}</p>
                      <p className="text-sm text-muted-foreground">de {mockUserStats.totalUsuarios} usuários</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Award className="w-8 h-8 text-accent" />
                    <div>
                      <p className="text-2xl font-bold">{mockUserStats.conquistasDesbloqueadas}</p>
                      <p className="text-sm text-muted-foreground">de {mockUserStats.totalConquistas} conquistas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Conquistas Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["Primeiro Diagnóstico", "Líder em Desenvolvimento", "Mestre da Comunicação"].map((title, idx) => (
                    <div key={idx} className="flex items-center justify-between border rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        <span className="font-medium">{title}</span>
                      </div>
                      <Badge variant="outline">Desbloqueada</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Timeline de Progresso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockUserTimeline.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="flex-shrink-0">{getEventIcon(item.tipo)}</div>
                      <div className="flex-1">
                        <p className="font-medium">{item.titulo}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(item.data).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Badge variant="outline">+{item.pontos} XP</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}