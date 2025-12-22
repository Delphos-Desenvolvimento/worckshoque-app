import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

interface SimpleAchievementProps {
  title: string;
  description: string;
  unlocked: boolean;
  date?: string | null;
}

const SimpleAchievementBadge = ({ title, description, unlocked, date }: SimpleAchievementProps) => {
  return (
    <Card className={`achievement-badge ${unlocked ? 'unlocked' : 'opacity-50 grayscale'}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`rounded-full p-2 ${unlocked ? 'bg-accent' : 'bg-muted'}`}>
            <Trophy className={`h-4 w-4 ${unlocked ? 'text-accent-foreground' : 'text-muted-foreground'}`} />
          </div>
          
          <div className="flex-1 space-y-1">
            <h4 className="font-semibold text-sm">{title}</h4>
            <p className="text-xs text-muted-foreground">{description}</p>
            
            {unlocked && date && (
              <Badge variant="secondary" className="text-xs">
                Desbloqueado em {new Date(date).toLocaleDateString('pt-BR')}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleAchievementBadge;