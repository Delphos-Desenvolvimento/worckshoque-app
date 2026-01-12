import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  Target, 
  Play, 
  Eye, 
  Edit,
  Trash2
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

interface QuestionnaireListProps {
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
    case 'stress': return <Target className="w-4 h-4" />;
    case 'climate': return <FileText className="w-4 h-4" />;
    case 'burnout': return <FileText className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'stress': return 'text-red-600';
    case 'climate': return 'text-blue-600';
    case 'burnout': return 'text-orange-600';
    default: return 'text-gray-600';
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

export default function QuestionnaireList({ 
  questionnaires, 
  onRespond, 
  onViewDetails, 
  onEdit, 
  onDelete, 
  onToggleActive,
  canEdit, 
  canDelete 
}: QuestionnaireListProps) {
  return (
    <div className="space-y-3">
      {questionnaires.map((questionnaire) => (
        <Card key={questionnaire.id} className="overflow-hidden border hover:shadow-md transition-all duration-200 group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                {/* Ícone do tipo */}
                <div className={`p-2 rounded-lg bg-muted ${getTypeColor(questionnaire.type)}`}>
                  {getQuestionnaireIcon(questionnaire.type)}
                </div>

                {/* Informações principais */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">
                      {questionnaire.title}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {formatTypeName(questionnaire.type)}
                    </Badge>
                    <Badge 
                      variant={questionnaire.is_active ? "default" : "secondary"}
                      className={`text-xs cursor-pointer ${questionnaire.is_active ? "bg-green-500 hover:bg-green-600" : "bg-gray-500 hover:bg-gray-600"}`}
                      onClick={() => canEdit && onToggleActive(questionnaire)}
                      title={canEdit ? (questionnaire.is_active ? "Clique para desativar" : "Clique para ativar") : undefined}
                    >
                      {questionnaire.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {questionnaire.description || 'Sem descrição disponível'}
                  </p>
                </div>

                {/* Estatísticas */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    <span>{questionnaire.questions_count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{questionnaire.estimated_time}min</span>
                  </div>
                  <span className="text-xs">
                    {new Date(questionnaire.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2 ml-4">
                <Button
                  onClick={() => onRespond(questionnaire)}
                  size="sm"
                  disabled={!questionnaire.is_active}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Responder
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(questionnaire)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
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
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

