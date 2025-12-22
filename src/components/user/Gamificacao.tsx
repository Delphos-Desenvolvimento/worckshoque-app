import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Target, TrendingUp, Award, Medal, Crown, RefreshCw, Gamepad2 } from "lucide-react";
import SimpleAchievementBadge from "@/components/common/SimpleAchievementBadge";
import PageHeader from "@/components/common/PageHeader";

const mockStats = {
  nivel: 8,
  xpAtual: 1750,
  xpProximo: 2000,
  posicaoRanking: 3,
  totalUsuarios: 47,
  conquistasDesbloqueadas: 12,
  totalConquistas: 25
};

const mockRanking = [
  { posicao: 1, nome: 'Ana Costa', xp: 2850, avatar: '👩‍💼' },
  { posicao: 2, nome: 'Pedro Silva', xp: 2320, avatar: '👨‍💻' },
  { posicao: 3, nome: 'João Silva', xp: 1750, avatar: '👤', isCurrentUser: true },
  { posicao: 4, nome: 'Maria Santos', xp: 1650, avatar: '👩‍🔬' },
  { posicao: 5, nome: 'Carlos Lima', xp: 1420, avatar: '👨‍🎨' }
];

const mockConquistas = [
  {
    id: '1',
    title: 'Primeiro Diagnóstico',
    description: 'Complete seu primeiro diagnóstico',
    unlocked: true,
    date: '2024-01-10',
    xp: 100,
    rarity: 'comum'
  },
  {
    id: '2',
    title: 'Líder em Desenvolvimento',
    description: 'Complete 5 planos de ação',
    unlocked: true,
    date: '2024-01-15',
    xp: 250,
    rarity: 'raro'
  },
  {
    id: '3',
    title: 'Mestre da Comunicação',
    description: 'Obtenha nota 9+ em comunicação',
    unlocked: false,
    date: null,
    xp: 500,
    rarity: 'epico'
  }
];

const mockTimeline = [
  { data: '2024-01-20', evento: 'Subiu para nível 8', tipo: 'nivel', xp: 200 },
  { data: '2024-01-18', evento: 'Conquistou "Líder em Desenvolvimento"', tipo: 'conquista', xp: 250 },
  { data: '2024-01-15', evento: 'Completou Plano de Ação', tipo: 'acao', xp: 50 },
  { data: '2024-01-12', evento: 'Fez novo diagnóstico', tipo: 'diagnostico', xp: 100 }
];

export default function Gamificacao() {
  const progressoProximoNivel = (mockStats.xpAtual / mockStats.xpProximo) * 100;

  const getRankingIcon = (posicao: number) => {
    switch (posicao) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">{posicao}</span>;
    }
  };

  const getEventIcon = (tipo: string) => {
    switch (tipo) {
      case 'nivel': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'conquista': return <Trophy className="w-4 h-4 text-accent" />;
      case 'acao': return <Target className="w-4 h-4 text-blue-500" />;
      case 'diagnostico': return <TrendingUp className="w-4 h-4 text-green-500" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gamificação"
        description="Suas conquistas pessoais, ranking e progresso"
        icon={Trophy}
        badges={[
          { label: `Nível ${mockStats.nivel}`, icon: Star },
          { label: `#${mockStats.posicaoRanking} no ranking`, icon: Award },
          { label: `${mockStats.conquistasDesbloqueadas}/${mockStats.totalConquistas} conquistas`, icon: Target }
        ]}
        actions={[
          { 
            label: "Atualizar", 
            icon: RefreshCw, 
            onClick: () => console.log('Atualizando gamificação...'),
            variant: 'primary' as const
          },
          { 
            label: "Ver Ranking Completo", 
            icon: Trophy, 
            onClick: () => console.log('Abrindo ranking completo...'),
            variant: 'primary' as const
          }
        ]}
      />

      <div className="container mx-auto px-4">

        {/* Stats Principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Star className="w-8 h-8 text-accent" />
                <div>
                  <p className="text-2xl font-bold">Nível {mockStats.nivel}</p>
                  <p className="text-sm text-muted-foreground">
                    {mockStats.xpAtual}/{mockStats.xpProximo} XP
                  </p>
                </div>
              </div>
              <Progress value={progressoProximoNivel} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">#{mockStats.posicaoRanking}</p>
                  <p className="text-sm text-muted-foreground">
                    de {mockStats.totalUsuarios} usuários
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-accent" />
                <div>
                  <p className="text-2xl font-bold">{mockStats.conquistasDesbloqueadas}</p>
                  <p className="text-sm text-muted-foreground">
                    de {mockStats.totalConquistas} conquistas
                  </p>
                </div>
              </div>
              <Progress 
                value={(mockStats.conquistasDesbloqueadas / mockStats.totalConquistas) * 100} 
                className="mt-3 h-2" 
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{mockStats.xpAtual}</p>
                  <p className="text-sm text-muted-foreground">XP Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Ranking Interno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockRanking.map((user) => (
                <div 
                  key={user.posicao}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    user.isCurrentUser ? 'bg-accent/10 border border-accent/30' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getRankingIcon(user.posicao)}
                    <span className="text-2xl">{user.avatar}</span>
                    <div>
                      <div className={`font-medium ${user.isCurrentUser ? 'text-accent-foreground' : ''}`}>
                        {user.nome}
                        {user.isCurrentUser && <Badge variant="outline" className="ml-2">Você</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{user.xp} XP</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conquistas Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Conquistas Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockConquistas.map((conquista) => (
                <SimpleAchievementBadge
                  key={conquista.id}
                  title={conquista.title}
                  description={conquista.description}
                  unlocked={conquista.unlocked}
                  date={conquista.date}
                />
              ))}
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Timeline de Progresso */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Timeline de Progresso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockTimeline.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {getEventIcon(item.tipo)}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.evento}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(item.data).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Badge variant="outline">
                  +{item.xp} XP
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      </div>
    </div>
  );
}