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

interface QuestionnaireTableProps {
  questionnaires: Questionnaire[];
  onRespond: (questionnaire: Questionnaire) => void;
  onViewDetails: (questionnaire: Questionnaire) => void;
  onEdit: (questionnaire: Questionnaire) => void;
  onDelete: (questionnaire: Questionnaire) => void;
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
    case 'stress': return 'text-red-600 bg-red-50';
    case 'climate': return 'text-blue-600 bg-blue-50';
    case 'burnout': return 'text-orange-600 bg-orange-50';
    default: return 'text-gray-600 bg-gray-50';
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

export default function QuestionnaireTable({ 
  questionnaires, 
  onRespond, 
  onViewDetails, 
  onEdit, 
  onDelete, 
  canEdit, 
  canDelete 
}: QuestionnaireTableProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Questionários ({questionnaires.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-sm text-muted-foreground">Questionário</th>
                <th className="text-left p-4 font-medium text-sm text-muted-foreground">Tipo</th>
                <th className="text-left p-4 font-medium text-sm text-muted-foreground">Perguntas</th>
                <th className="text-left p-4 font-medium text-sm text-muted-foreground">Tempo</th>
                <th className="text-left p-4 font-medium text-sm text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-sm text-muted-foreground">Criado em</th>
                <th className="text-left p-4 font-medium text-sm text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {questionnaires.map((questionnaire, index) => (
                <tr key={questionnaire.id} className={`border-b hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-muted/10'}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getTypeColor(questionnaire.type)}`}>
                        {getQuestionnaireIcon(questionnaire.type)}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{questionnaire.title}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {questionnaire.description || 'Sem descrição'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className={`${getTypeColor(questionnaire.type)} border-current`}>
                      {formatTypeName(questionnaire.type)}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{questionnaire.questions_count}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{questionnaire.estimated_time} min</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge 
                      variant={questionnaire.is_active ? "default" : "secondary"}
                      className={questionnaire.is_active ? "bg-green-500" : "bg-gray-500"}
                    >
                      {questionnaire.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-muted-foreground">
                      {new Date(questionnaire.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => onRespond(questionnaire)}
                        size="sm"
                        disabled={!questionnaire.is_active}
                        className="bg-primary hover:bg-primary/90 text-xs"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Responder
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(questionnaire)}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(questionnaire)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

