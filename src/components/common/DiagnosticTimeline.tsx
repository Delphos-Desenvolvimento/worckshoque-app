import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Eye, Calendar, Target, Award, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Diagnostic {
  id: string;
  questionnaire_id: string;
  questionnaire: {
    id: string;
    title: string;
    type: string;
  };
  insights: string[];
  recommendations: string[];
  areas_focus: string[];
  score_intelligent: number;
  status: string;
  generated_at: string;
  completed_at: string | null;
  analysis_data: Record<string, unknown>;
  user?: { id: string; name: string; email: string } | null;
}

interface DiagnosticTimelineProps {
  diagnostics: Diagnostic[];
  onViewDiagnostic: (diagnostic: Diagnostic) => void;
  showOwner?: boolean;
}

const DiagnosticTimeline = ({ diagnostics, onViewDiagnostic, showOwner }: DiagnosticTimelineProps) => {
  const getCategoryColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreCategory = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Regular';
    return 'Crítico';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreTrend = (diagnostics: Diagnostic[], currentIndex: number) => {
    if (currentIndex === 0) return null;
    
    const current = diagnostics[currentIndex].score_intelligent;
    const previous = diagnostics[currentIndex - 1].score_intelligent;
    
    const diff = current - previous;
    
    if (diff > 5) return { icon: TrendingUp, color: 'text-green-600', label: `+${diff}%` };
    if (diff < -5) return { icon: TrendingDown, color: 'text-red-600', label: `${diff}%` };
    return { icon: Minus, color: 'text-gray-600', label: `${diff}%` };
  };

  const getScoreProgress = (score: number) => {
    return Math.min(score, 100);
  };

  return (
    <div className="relative">
      {/* Linha do tempo */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border"></div>
      
      <div className="space-y-8">
        {diagnostics.map((diagnostic, index) => {
          const trend = getScoreTrend(diagnostics, index);
          const isLast = index === diagnostics.length - 1;
          
          return (
            <div key={diagnostic.id} className="relative flex items-start space-x-6">
              {/* Ponto do timeline */}
              <div className="relative z-10">
                <div className={`w-4 h-4 rounded-full ${getCategoryColor(diagnostic.score_intelligent)} border-2 border-background`}></div>
                {!isLast && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-border"></div>
                )}
              </div>

              {/* Conteúdo do card */}
              <Card className="flex-1 group hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
                          {diagnostic.questionnaire.title}
                        </h3>
                        <Badge className={`${getCategoryColor(diagnostic.score_intelligent)} text-white`}>
                          {getScoreCategory(diagnostic.score_intelligent)}
                        </Badge>
                        {trend && (
                          <Badge variant="outline" className={`${trend.color} border-current`}>
                            <trend.icon className="h-3 w-3 mr-1" />
                            {trend.label}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                        <span>{diagnostic.questionnaire.type}</span>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(diagnostic.generated_at)} às {formatTime(diagnostic.generated_at)}
                        </div>
                        {showOwner && diagnostic.user?.name && (
                          <span className="truncate max-w-[180px]">Usuário: {diagnostic.user.name}</span>
                        )}
                      </div>
                    </div>

                    {/* Score principal */}
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary mb-1">{diagnostic.score_intelligent}%</div>
                      <div className="w-20">
                        <Progress value={getScoreProgress(diagnostic.score_intelligent)} className="h-2" />
                      </div>
                    </div>
                  </div>

                  {/* Estatísticas e status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-1">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{diagnostic.areas_focus?.length || 0}</span>
                        <span className="text-xs text-muted-foreground">áreas</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{diagnostic.recommendations?.length || 0}</span>
                        <span className="text-xs text-muted-foreground">recomendações</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Badge variant="secondary" className={getStatusColor(diagnostic.status)}>
                        {diagnostic.status === 'completed' ? 'Completo' : 
                         diagnostic.status === 'processing' ? 'Processando' : 'Falhou'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDiagnostic(diagnostic)}
                        className="flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DiagnosticTimeline;




