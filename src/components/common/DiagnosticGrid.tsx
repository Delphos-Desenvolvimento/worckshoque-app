import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Eye, Calendar, TrendingUp, Target, Award } from 'lucide-react';

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

interface DiagnosticGridProps {
  diagnostics: Diagnostic[];
  onViewDiagnostic: (diagnostic: Diagnostic) => void;
  showOwner?: boolean;
}

const DiagnosticGrid = ({ diagnostics, onViewDiagnostic, showOwner }: DiagnosticGridProps) => {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {diagnostics.map((diagnostic) => (
        <Card key={diagnostic.id} className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                  {diagnostic.questionnaire.title}
                </CardTitle>
                <CardDescription className="text-sm">
                  {diagnostic.questionnaire.type}
                </CardDescription>
                {showOwner && diagnostic.user?.name && (
                  <div className="text-xs text-muted-foreground">Usuário: {diagnostic.user.name}</div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDiagnostic(diagnostic)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Score e Categoria */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Score</span>
                <span className="text-2xl font-bold text-primary">{diagnostic.score_intelligent}%</span>
              </div>
              <Progress value={getScoreProgress(diagnostic.score_intelligent)} className="h-2" />
              <div className="flex items-center justify-between">
                <Badge className={`${getCategoryColor(diagnostic.score_intelligent)} text-white`}>
                  {getScoreCategory(diagnostic.score_intelligent)}
                </Badge>
                <Badge variant="secondary" className={getStatusColor(diagnostic.status)}>
                  {diagnostic.status === 'completed' ? 'Completo' : 
                   diagnostic.status === 'processing' ? 'Processando' : 'Falhou'}
                </Badge>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Target className="h-4 w-4 text-muted-foreground mr-1" />
                  <span className="text-sm font-medium">{diagnostic.areas_focus?.length || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground">Áreas de foco</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Award className="h-4 w-4 text-muted-foreground mr-1" />
                  <span className="text-sm font-medium">{diagnostic.recommendations?.length || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground">Recomendações</p>
              </div>
            </div>

            {/* Data e Ações */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                {formatDate(diagnostic.generated_at)}
              </div>
              <Button
                size="sm"
                onClick={() => onViewDiagnostic(diagnostic)}
                className="h-8 px-3"
              >
                Ver detalhes
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DiagnosticGrid;




