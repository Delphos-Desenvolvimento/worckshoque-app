import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Target, Zap, Medal, Crown, Lock } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
// import Header from '@/components/layout/Header'; // Removed - using DashboardLayout
import AchievementBadge from '@/components/common/AchievementBadge';
import Modal from '@/components/ui/modal';

const mockUser = {
  name: 'João Silva',
  role: 'user' as const,
  company: 'TechCorp'
};

const achievements = [
  // Diagnósticos
  {
    id: '1',
    title: 'Primeiro Diagnóstico',
    description: 'Completou seu primeiro diagnóstico no WorkChoque',
    icon: 'target',
    level: 'bronze' as const,
    category: 'diagnosticos',
    unlocked: true,
    unlockedAt: new Date('2024-01-15'),
    points: 10
  },
  {
    id: '2',
    title: '5 Diagnósticos',
    description: 'Realizou 5 diagnósticos diferentes',
    icon: 'trophy',
    level: 'silver' as const,
    category: 'diagnosticos',
    unlocked: false,
    progress: 3,
    maxProgress: 5,
    points: 25
  },
  {
    id: '3',
    title: '10 Diagnósticos',
    description: 'Realizou 10 diagnósticos - especialista em análise!',
    icon: 'medal',
    level: 'gold' as const,
    category: 'diagnosticos',
    unlocked: false,
    progress: 3,
    maxProgress: 10,
    points: 50
  },

  // Planos de Ação
  {
    id: '4',
    title: 'Primeiro Plano',
    description: 'Concluiu seu primeiro plano de ação',
    icon: 'star',
    level: 'bronze' as const,
    category: 'planos',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    points: 15
  },
  {
    id: '5',
    title: '5 Planos Concluídos',
    description: 'Concluiu 5 planos de ação com sucesso',
    icon: 'trophy',
    level: 'silver' as const,
    category: 'planos',
    unlocked: false,
    progress: 0,
    maxProgress: 5,
    points: 40
  },

  // Engajamento
  {
    id: '6',
    title: '7 Dias Seguidos',
    description: 'Manteve-se ativo por 7 dias consecutivos',
    icon: 'zap',
    level: 'gold' as const,
    category: 'engajamento',
    unlocked: true,
    unlockedAt: new Date('2024-02-01'),
    points: 30
  },
  {
    id: '7',
    title: '30 Dias Seguidos',
    description: 'Incrível! 30 dias consecutivos de atividade',
    icon: 'crown',
    level: 'diamond' as const,
    category: 'engajamento',
    unlocked: false,
    progress: 7,
    maxProgress: 30,
    points: 100
  },

  // Especiais
  {
    id: '8',
    title: 'Primeiro Login',
    description: 'Bem-vindo ao WorkChoque!',
    icon: 'target',
    level: 'bronze' as const,
    category: 'especiais',
    unlocked: true,
    unlockedAt: new Date('2024-01-10'),
    points: 5
  },
  {
    id: '9',
    title: 'Colecionador',
    description: 'Desbloqueou 10 conquistas diferentes',
    icon: 'crown',
    level: 'crown' as const,
    category: 'especiais',
    unlocked: false,
    progress: 3,
    maxProgress: 10,
    points: 200
  }
];

const categories = [
  { id: 'todas', label: 'Todas', icon: Trophy },
  { id: 'diagnosticos', label: 'Diagnósticos', icon: Target },
  { id: 'planos', label: 'Planos de Ação', icon: Star },
  { id: 'engajamento', label: 'Engajamento', icon: Zap },
  { id: 'especiais', label: 'Especiais', icon: Crown }
];

const Conquistas = () => {
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [showModal, setShowModal] = useState(false);

  const filteredAchievements = selectedCategory === 'todas' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Conquistas"
        description="Acompanhe seu progresso e desbloqueie novas conquistas"
        icon={Trophy}
      />

      <div className="container mx-auto px-4">

        {/* Stats Cards */}
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

        {/* Categories and Achievements */}
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
                {(category.id === 'todas' ? achievements : achievements.filter(a => a.category === category.id))
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

        {/* Achievement Tips */}
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