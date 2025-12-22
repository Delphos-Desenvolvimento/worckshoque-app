import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface HeaderAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

interface HeaderBadge {
  label: string;
  icon?: LucideIcon;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive';
}

interface HeaderStat {
  label: string;
  value: string | number;
  description: string;
  icon?: LucideIcon;
  color?: string;
}

interface PageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  badges?: HeaderBadge[];
  actions?: HeaderAction[];
  stats?: HeaderStat[];
  className?: string;
}

const PageHeader = ({
  title,
  description,
  icon: Icon,
  badges = [],
  actions = [],
  stats = [],
  className = ""
}: PageHeaderProps) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Profissional */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-accent p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
                  <p className="text-white/90 text-lg">{description}</p>
                </div>
              </div>
              
              {/* Badges informativos */}
              {badges.length > 0 && (
                <div className="flex items-center gap-4">
                  {badges.map((badge, index) => {
                    const IconComponent = badge.icon;
                    return (
                      <Badge 
                        key={index}
                        variant="secondary" 
                        className="bg-white/20 text-white border-white/30 backdrop-blur-sm"
                      >
                        {badge.icon && <IconComponent className="w-4 h-4 mr-2" />}
                        {badge.label}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Botões de ação */}
            {actions.length > 0 && (
              <div className="flex items-center gap-6">
                {actions.map((action, index) => {
                  const IconComponent = action.icon;
                  return (
                    <Button
                      key={index}
                      onClick={action.onClick}
                      disabled={action.disabled}
                      size="lg"
                      className={
                        action.variant === 'secondary'
                          ? "bg-white/10 hover:bg-white/20 text-white border-white/40 backdrop-blur-sm px-6 py-3 font-medium"
                          : "bg-white hover:bg-white/90 text-primary shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3 font-semibold"
                      }
                    >
                      <IconComponent className="mr-3 h-5 w-5" />
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estatísticas (opcional) */}
      {stats.length > 0 && (
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                    {stat.icon ? (
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                    ) : stat.color ? (
                      <div className={`h-4 w-4 rounded-full ${stat.color}`}></div>
                    ) : null}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PageHeader;
