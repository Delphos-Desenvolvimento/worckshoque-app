import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Star, Zap, Target, Medal, Crown } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: 'bronze' | 'silver' | 'gold' | 'diamond' | 'crown';
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  star: Star,
  zap: Zap,
  target: Target,
  medal: Medal,
  crown: Crown,
};

const levelColors = {
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-gray-400 to-gray-600',
  gold: 'from-yellow-400 to-yellow-600',
  diamond: 'from-blue-400 to-purple-600',
  crown: 'from-purple-500 to-pink-600',
};

const levelEmojis = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  diamond: '💎',
  crown: '👑',
};

const AchievementBadge = ({ achievement, size = 'md' }: AchievementBadgeProps) => {
  const Icon = iconMap[achievement.icon] || Trophy;
  const sizeClasses = {
    sm: 'p-2 min-h-[120px] w-full',
    md: 'p-4 min-h-[160px] w-full',
    lg: 'p-6 min-h-[200px] w-full',
  };

  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const iconContainerSizes = {
    sm: 'p-2',
    md: 'p-2.5',
    lg: 'p-3',
  };

  return (
    <Card 
      className={`achievement-badge ${achievement.unlocked ? 'unlocked' : 'opacity-50 grayscale'} ${sizeClasses[size]} flex flex-col`}
    >
      <CardContent className="flex flex-col items-center justify-center h-full p-0 text-center">
        <div className={`rounded-full ${iconContainerSizes[size]} mb-2 bg-gradient-to-br ${levelColors[achievement.level]}`}>
          <Icon className={`${iconSizes[size]} text-white`} />
        </div>
        
        <div className="space-y-1 flex-1 flex flex-col justify-center w-full px-1">
          <div className="flex items-center justify-center space-x-1 flex-wrap">
            <span className="text-lg">{levelEmojis[achievement.level]}</span>
            <h4 className={`${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'} font-semibold text-foreground truncate w-full text-center`}>
              {achievement.title}
            </h4>
          </div>
          
          {achievement.progress !== undefined && achievement.maxProgress && !achievement.unlocked && (
            <div className="w-full bg-muted rounded-full h-1 mt-1">
              <div 
                className="bg-accent h-1 rounded-full transition-all duration-300" 
                style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
              />
            </div>
          )}
          
          {achievement.unlocked && achievement.unlockedAt && (
            <Badge variant="secondary" className={`${size === 'sm' ? 'text-[10px]' : 'text-xs'} px-1 py-0 mt-1`}>
              {achievement.unlockedAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AchievementBadge;