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
  Calendar
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

interface QuestionnaireTimelineProps {
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

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return {
    day: date.getDate().toString().padStart(2, '0'),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
    time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  };
};

export default function QuestionnaireTimeline({ 
  questionnaires, 
  onRespond, 
  onViewDetails, 
  onEdit, 
  onDelete, 
  onToggleActive,
  canEdit, 
  canDelete 
}: QuestionnaireTimelineProps) {
  // Agrupar questionários por data
  const groupedByDate = questionnaires.reduce((acc, questionnaire) => {
    const date = new Date(questionnaire.created_at).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(questionnaire);
    return acc;
  }, {} as Record<string, Questionnaire[]>);

  return (
    <div className="relative">
      {/* Linha temporal */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent"></div>
      
      <div className="space-y-8">
        {Object.entries(groupedByDate)
          .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
          .map(([date, questionnaires], dateIndex) => {
            const formattedDate = formatDate(questionnaires[0].created_at);
            
            return (
              <div key={date} className="relative">
                {/* Marcador de data */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center justify-center w-16 h-16 bg-primary text-white rounded-full font-bold shadow-lg">
                    <div className="text-center">
                      <div className="text-lg">{formattedDate.day}</div>
                      <div className="text-xs">{formattedDate.month}/{formattedDate.year}</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {new Date(date).toLocaleDateString('pt-BR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {questionnaires.length} questionário{questionnaires.length > 1 ? 's' : ''} criado{questionnaires.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Questionários do dia */}
                <div className="ml-8 space-y-4">
                  {questionnaires.map((questionnaire, index) => (
                    <Card key={questionnaire.id} className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 group">
                      {/* Conector temporal */}
                      <div className="absolute -left-8 top-6 w-4 h-4 bg-primary rounded-full border-4 border-white shadow-md"></div>
                      
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            {/* Ícone do tipo */}
                            <div className={`p-3 rounded-xl ${getTypeColor(questionnaire.type)} text-white shadow-lg`}>
                              {getQuestionnaireIcon(questionnaire.type)}
                            </div>

                            {/* Informações principais */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="text-lg font-bold text-foreground">
                                  {questionnaire.title}
                                </h4>
                                <Badge variant="outline">
                                  {formatTypeName(questionnaire.type)}
                                </Badge>
                                <Badge 
                                  variant={questionnaire.is_active ? "default" : "secondary"}
                                  className={`cursor-pointer ${questionnaire.is_active ? "bg-green-500 hover:bg-green-600" : "bg-gray-500 hover:bg-gray-600"}`}
                                  onClick={() => canEdit && onToggleActive(questionnaire)}
                                  title={canEdit ? (questionnaire.is_active ? "Clique para desativar" : "Clique para ativar") : undefined}
                                >
                                  {questionnaire.is_active ? "Ativo" : "Inativo"}
                                </Badge>
                              </div>
                              
                              <p className="text-muted-foreground mb-4 line-clamp-2">
                                {questionnaire.description || 'Sem descrição disponível'}
                              </p>

                              {/* Estatísticas */}
                              <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">{questionnaire.questions_count} perguntas</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">{questionnaire.estimated_time} minutos</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">{formatDate(questionnaire.created_at).time}</span>
                                </div>
                              </div>
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
              </div>
            );
          })}
      </div>
    </div>
  );
}

