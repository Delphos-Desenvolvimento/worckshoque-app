import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  Target, 
  Play, 
  Eye, 
  Edit,
  Trash2,
  Power,
  PowerOff
} from 'lucide-react';

interface Questionnaire {
  id: string;
  title: string;
  description?: string;
  type: string;
  is_active: boolean;
  questions_count: number;
  estimated_time: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface QuestionnaireGridProps {
  questionnaires: Questionnaire[];
  onRespond: (questionnaire: Questionnaire) => void;
  onViewDetails: (questionnaire: Questionnaire) => void;
  onEdit: (questionnaire: Questionnaire) => void;
  onDelete: (questionnaire: Questionnaire) => void;
  onToggleActive: (questionnaire: Questionnaire) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const getQuestionnaireIcon = (type: string) => {
  switch (type) {
    case 'stress': return <Target className="w-5 h-5" />;
    case 'climate': return <FileText className="w-5 h-5" />;
    case 'burnout': return <FileText className="w-5 h-5" />;
    default: return <FileText className="w-5 h-5" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'stress': return 'bg-gradient-to-br from-red-500 to-pink-500';
    case 'climate': return 'bg-gradient-to-br from-blue-500 to-cyan-500';
    case 'burnout': return 'bg-gradient-to-br from-orange-500 to-yellow-500';
    default: return 'bg-gradient-to-br from-gray-500 to-slate-500';
  }
};

const formatTypeName = (type: string) => {
  switch (type) {
    case 'stress': return 'Estresse';
    case 'climate': return 'Clima';
    case 'burnout': return 'Burnout';
    default: return 'Geral';
  }
};

export default function QuestionnaireGrid({ 
  questionnaires, 
  onRespond, 
  onViewDetails, 
  onEdit, 
  onDelete, 
  onToggleActive,
  canEdit, 
  canDelete 
}: QuestionnaireGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {questionnaires.map((questionnaire) => (
        <Card key={questionnaire.id} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${getTypeColor(questionnaire.type)} text-white shadow-lg`}>
                  {getQuestionnaireIcon(questionnaire.type)}
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-foreground line-clamp-2">
                    {questionnaire.title}
                  </CardTitle>
                  <Badge variant="outline" className="mt-2">
                    {formatTypeName(questionnaire.type)}
                  </Badge>
                </div>
              </div>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(questionnaire)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm line-clamp-2">
              {questionnaire.description || 'Sem descrição disponível'}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Perguntas</span>
                </div>
                <p className="text-xl font-bold text-primary">{questionnaire.questions_count}</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Tempo</span>
                </div>
                <p className="text-xl font-bold text-primary">{questionnaire.estimated_time} min</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge 
                  variant={questionnaire.is_active ? "default" : "secondary"}
                  className={questionnaire.is_active ? "bg-green-500" : "bg-gray-500"}
                >
                  {questionnaire.is_active ? "ATIVO" : "Inativo"}
                </Badge>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleActive(questionnaire)}
                    className="h-6 px-2 text-xs"
                    title={questionnaire.is_active ? "Desativar questionário" : "Ativar questionário"}
                  >
                    {questionnaire.is_active ? (
                      <PowerOff className="w-3 h-3 text-red-500" />
                    ) : (
                      <Power className="w-3 h-3 text-green-500" />
                    )}
                  </Button>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                Criado em {new Date(questionnaire.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => onRespond(questionnaire)}
                className="flex-1"
                disabled={!questionnaire.is_active}
              >
                <Play className="w-4 h-4 mr-2" />
                Responder
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(questionnaire)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
