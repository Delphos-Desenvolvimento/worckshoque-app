import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Eye, Calendar, Target, Award } from 'lucide-react';

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

interface DiagnosticListProps {
  diagnostics: Diagnostic[];
  onViewDiagnostic: (diagnostic: Diagnostic) => void;
  showOwner?: boolean;
}

const DiagnosticList = ({ diagnostics, onViewDiagnostic, showOwner }: DiagnosticListProps) => {
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

  const getScoreProgress = (score: number) => {
    return Math.min(score, 100);
  };

  return (
    <div className="space-y-4">
      {diagnostics.map((diagnostic) => (
        <Card key={diagnostic.id} className="group hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {/* Informações principais */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-4">
                  {/* Score */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">{diagnostic.score_intelligent}%</span>
                    </div>
                  </div>

                  {/* Detalhes */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
                        {diagnostic.questionnaire.title}
                      </h3>
                      <Badge className={`${getCategoryColor(diagnostic.score_intelligent)} text-white`}>
                        {getScoreCategory(diagnostic.score_intelligent)}
                      </Badge>
                    </div>
                    
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                        <span>{diagnostic.questionnaire.type}</span>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(diagnostic.generated_at)}
                        </div>
                        {showOwner && diagnostic.user?.name && (
                          <span className="truncate max-w-[180px]">Usuário: {diagnostic.user.name}</span>
                        )}
                      </div>

                    {/* Progress bar */}
                    <div className="w-full max-w-xs">
                      <Progress value={getScoreProgress(diagnostic.score_intelligent)} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Estatísticas e ações */}
              <div className="flex items-center space-x-6">
                {/* Estatísticas */}
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Target className="h-4 w-4 text-muted-foreground mr-1" />
                      <span className="font-medium">{diagnostic.areas_focus?.length || 0}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Áreas</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Award className="h-4 w-4 text-muted-foreground mr-1" />
                      <span className="font-medium">{diagnostic.recommendations?.length || 0}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Recomendações</p>
                  </div>
                </div>

                {/* Status e ação */}
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
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DiagnosticList;




