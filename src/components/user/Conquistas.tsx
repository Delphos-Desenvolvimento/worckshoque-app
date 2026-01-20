import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Target, Zap, Medal, Crown, Lock, Loader2 } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import AchievementBadge from '@/components/common/AchievementBadge';
import Modal from '@/components/ui/modal';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface ApiAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: string;
  category: string;
  xp_points: number;
  rarity: string;
  unlocked: boolean;
  unlockedAt?: string | null;
  progress?: number;
  maxProgress?: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: 'bronze' | 'silver' | 'gold' | 'diamond' | 'crown';
  category: string;
  unlocked: boolean;
  unlockedAt?: Date;
  points: number;
  progress?: number;
  maxProgress?: number;
}

const categories = [
  { id: 'todas', label: 'Todas', icon: Trophy },
  { id: 'diagnosticos', label: 'Diagnósticos', icon: Target },
  { id: 'planos', label: 'Planos de Ação', icon: Star },
  { id: 'engajamento', label: 'Engajamento', icon: Zap },
  { id: 'especiais', label: 'Especiais', icon: Crown }
];

const Conquistas = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        setLoading(true);
        const res = await api.get('/achievements/my');
        if (!res.ok) {
          throw new Error('Falha ao carregar conquistas');
        }
        const data: ApiAchievement[] = await res.json();
        const mapped: Achievement[] = data.map((a) => {
          const level =
            a.level === 'silver' ||
            a.level === 'gold' ||
            a.level === 'diamond' ||
            a.level === 'crown'
              ? (a.level as Achievement['level'])
              : 'bronze';

          let category = 'especiais';
          if (a.category === 'diagnostico') category = 'diagnosticos';
          else if (a.category === 'plano_acao') category = 'planos';
          else if (a.category === 'engajamento') category = 'engajamento';

          return {
            id: a.id,
            title: a.title,
            description: a.description,
            icon: a.icon || 'trophy',
            level,
            category,
            unlocked: a.unlocked,
            unlockedAt: a.unlockedAt ? new Date(a.unlockedAt) : undefined,
            points: a.xp_points ?? 0,
            progress: a.progress,
            maxProgress: a.maxProgress,
          };
        });
        setAchievements(mapped);
      } catch (error) {
        toast.error('Erro ao carregar conquistas');
        setAchievements([]);
      } finally {
        setLoading(false);
      }
    };

    void loadAchievements();
  }, []);

  const filteredAchievements =
    selectedCategory === 'todas'
      ? achievements
      : achievements.filter((a) => a.category === selectedCategory);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalPoints = achievements
    .filter((a) => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Conquistas"
        description="Acompanhe seu progresso e desbloqueie novas conquistas"
        icon={Trophy}
      />

      <div className="container mx-auto px-4">

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
        <>
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conquistas Desbloqueadas</CardTitle>
              <Trophy className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unlockedCount}</div>
              <p className="text-xs text-muted-foreground">
                de {achievements.length} disponíveis
              </p>
              <Progress value={(unlockedCount / achievements.length) * 100} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pontos Totais</CardTitle>
              <Star className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPoints}</div>
              <p className="text-xs text-muted-foreground">
                pontos conquistados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ranking</CardTitle>
              <Medal className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">#5</div>
              <p className="text-xs text-muted-foreground">
                na sua empresa
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{category.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {(category.id === 'todas'
                  ? achievements
                  : achievements.filter((a) => a.category === category.id))
                  .map((achievement) => (
                  <div key={achievement.id} className="relative">
                    <AchievementBadge achievement={achievement} />
                    
                    {/* Achievement Details Card */}
                    <Card className="mt-3 p-3">
                      <div className="text-center space-y-2">
                        <h4 className="font-medium text-sm">{achievement.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {achievement.description}
                        </p>
                        
                        {achievement.unlocked ? (
                          <Badge variant="secondary" className="text-xs">
                            +{achievement.points} pontos
                          </Badge>
                        ) : (
                          <div className="space-y-1">
                            {achievement.progress !== undefined && achievement.maxProgress && (
                              <>
                                <Progress 
                                  value={(achievement.progress / achievement.maxProgress) * 100} 
                                  className="h-1.5" 
                                />
                                <p className="text-xs text-muted-foreground">
                                  {achievement.progress}/{achievement.maxProgress}
                                </p>
                              </>
                            )}
                            <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground">
                              <Lock className="h-3 w-3" />
                              <span>Bloqueada</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-accent" />
              <span>Dicas para Desbloquear Conquistas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <h4 className="font-medium text-foreground mb-2">📊 Diagnósticos</h4>
                <p>Realize diagnósticos regularmente para identificar áreas de melhoria e desbloquear conquistas relacionadas.</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">🎯 Planos de Ação</h4>
                <p>Complete os planos de ação sugeridos pela IA para melhorar seu ambiente de trabalho e ganhar pontos.</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">⚡ Engajamento</h4>
                <p>Mantenha-se ativo na plataforma diariamente para desbloquear conquistas de engajamento.</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">🏆 Especiais</h4>
                <p>Conquistas especiais são desbloqueadas através de marcos importantes e atividades únicas.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        </>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        type="success"
        title="🎉 Nova Conquista Desbloqueada!"
        message="Parabéns! Você desbloqueou uma nova conquista e ganhou pontos extras!"
      />
    </div>
  );
};

export default Conquistas;
