import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ModalLayout from '@/components/common/ModalLayout';
import CadastroModal from '@/components/login/Cadastro';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronRight, ChevronLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getApiBaseUrl, useAuthStore } from '@/stores/authStore';
import { axiosInstance } from '@/lib/api';
import { toast } from 'sonner';

// Interface para questionário ativo
interface ActiveQuestionnaire {
  id: string;
  title: string;
  description?: string;
  type: string;
  estimated_time: number;
  questions: {
    id: string;
    question: string;
    type: string;
    required: boolean;
    order: number;
    options?: Array<{
      id?: string;
      value?: string;
      label?: string;
      score?: number;
      order?: number;
    }>;
  }[];
}

interface DiagnosticoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DiagnosticoModal = ({ isOpen, onClose }: DiagnosticoModalProps) => {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuthStore();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [showCadastroModal, setShowCadastroModal] = useState(false);
  const [activeQuestionnaire, setActiveQuestionnaire] = useState<ActiveQuestionnaire | null>(null);
  const [loadingQuestionnaire, setLoadingQuestionnaire] = useState(false);
  const [questionnaireError, setQuestionnaireError] = useState<string | null>(null);
  const [submittingDiagnostic, setSubmittingDiagnostic] = useState(false);

  // Buscar questionário ativo quando o modal abrir
  useEffect(() => {
    if (isOpen && !activeQuestionnaire) {
      loadActiveQuestionnaire();
    }
  }, [isOpen, activeQuestionnaire]);

  const loadActiveQuestionnaire = async () => {
    try {
      setLoadingQuestionnaire(true);
      setQuestionnaireError(null);
      
      const apiBaseUrl = getApiBaseUrl();
      const response = await axiosInstance.get(`/public/questionnaires/active`);
      const questionnaire = response.data;
      
      // Logs apenas para debug se necessário
      // console.log('📋 Questionário carregado:', questionnaire);
      // console.log('📋 Perguntas:', questionnaire?.questions);
      
      // Mapear opções para o formato esperado
      if (questionnaire?.questions) {
        questionnaire.questions = questionnaire.questions.map((q: {
          id: string;
          question: string;
          type: string;
          options?: Array<{ id?: string; value?: string; label?: string; score?: number; order?: number }>;
        }) => {
          // Mapear opções se existirem (apenas para perguntas que precisam de opções)
          if (q.options && q.options.length > 0) {
            q.options = q.options.map((opt: { id?: string; value?: string; label?: string; score?: number; order?: number }) => ({
              id: opt.id,
              value: opt.value || opt.id || '',
              label: opt.label || opt.value || '',
              score: opt.score || 0,
              order: opt.order || 0
            }));
          }
          return q;
        });
      }
      
      console.log('📋 Questionário mapeado:', questionnaire);
      
      setActiveQuestionnaire(questionnaire);
    } catch (error: unknown) {
      console.error('Erro ao carregar questionário ativo:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data && typeof error.response.data.message === 'string' ? error.response.data.message : 'Erro ao carregar questionário';
      setQuestionnaireError(errorMessage);
    } finally {
      setLoadingQuestionnaire(false);
    }
  };

  const questions = activeQuestionnaire?.questions || [];
  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;
  const isLastQuestion = currentQuestion === questions.length - 1;
  const canProceed = questions.length > 0 ? answers[questions[currentQuestion]?.id] : false;

  const handleAnswerChange = (value: string) => {
    if (questions.length > 0) {
      setAnswers(prev => ({
        ...prev,
        [questions[currentQuestion].id]: value
      }));
    }
  };

  // Função para gerar opções baseadas no tipo da pergunta
  const getQuestionOptions = (question: {
    type: string;
    options?: Array<{ value: string; label?: string; id?: string }>;
  }) => {
    if (question.type === 'scale') {
      // Gerar opções de 0-10 para perguntas de escala
      return Array.from({length: 11}, (_, i) => ({
        value: i.toString(),
        label: `${i} - ${getScaleLabel(i)}`,
        score: i,
        order: i
      }));
    }
    
    // Para perguntas do tipo text, retornar array vazio (será tratado como textarea)
    if (question.type === 'text') {
      return [];
    }
    
    // Para multiple_choice, mapear opções da API para o formato esperado
    if (question.options && question.options.length > 0) {
      return question.options.map((opt, index) => ({
        value: opt.value || opt.id || String(index),
        label: opt.label || opt.value || `Opção ${index + 1}`,
        score: (opt as { score?: number }).score || 0,
        order: index
      }));
    }
    
    // Se não tem opções definidas, retornar array vazio
    return [];
  };

  // Função para obter labels descritivas para a escala
  const getScaleLabel = (value: number): string => {
    if (value === 0) return 'Muito Ruim';
    if (value <= 2) return 'Ruim';
    if (value <= 4) return 'Regular';
    if (value <= 6) return 'Bom';
    if (value <= 8) return 'Muito Bom';
    return 'Excelente';
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setShowResult(true);
    } else {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const calculateScore = () => {
    if (questions.length === 0) return 0;
    
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    questions.forEach((question) => {
      const answer = answers[question.id];
      if (answer !== undefined) {
        if (question.type === 'scale') {
          // Para escalas, usar o valor direto (0-10)
          totalScore += parseInt(answer);
          maxPossibleScore += 10;
        } else if (question.options) {
          // Para múltipla escolha, usar o score da opção
          const option = question.options.find(opt => opt.value === answer);
          totalScore += option?.score || 0;
          maxPossibleScore += Math.max(...question.options.map(opt => opt.score));
        } else {
          // Fallback para outros tipos
          totalScore += parseInt(answer || '0');
          maxPossibleScore += 10;
        }
      }
    });
    
    if (maxPossibleScore === 0) return 0;
    return Math.round((totalScore / maxPossibleScore) * 100);
  };

  const getScoreCategory = (score: number) => {
    if (score >= 80) return { category: 'Excelente', color: 'text-green-600', description: 'Sua empresa está no caminho certo!' };
    if (score >= 60) return { category: 'Bom', color: 'text-blue-600', description: 'Há espaço para melhorias importantes.' };
    if (score >= 40) return { category: 'Regular', color: 'text-yellow-600', description: 'Várias áreas precisam de atenção.' };
    return { category: 'Crítico', color: 'text-red-600', description: 'Ação urgente é necessária.' };
  };

  // Gerar insights básicos baseados nas respostas reais
  const generateBasicInsights = () => {
    const score = calculateScore();
    const insights = [];
    
    // Analisar respostas para gerar insights específicos
    const answeredQuestions = questions.filter(q => answers[q.id] !== undefined);
    const lowScores = answeredQuestions.filter(q => {
      const answer = parseInt(answers[q.id] || '0');
      return q.type === 'scale' && answer <= 4;
    });
    
    const highScores = answeredQuestions.filter(q => {
      const answer = parseInt(answers[q.id] || '0');
      return q.type === 'scale' && answer >= 8;
    });
    
    // Insights baseados no score geral
    if (score >= 80) {
      insights.push('Empresa demonstra excelente desempenho na maioria das áreas');
      insights.push('Pontos fortes identificados podem ser replicados em outras áreas');
    } else if (score >= 60) {
      insights.push('Base sólida com oportunidades claras de melhoria');
      insights.push('Foco em áreas específicas pode elevar significativamente os resultados');
    } else if (score >= 40) {
      insights.push('Várias áreas críticas necessitam atenção imediata');
      insights.push('Implementação de processos estruturados é recomendada');
    } else {
      insights.push('Situação crítica requer intervenção urgente');
      insights.push('Recomenda-se consultoria especializada para reestruturação');
    }
    
    // Insights específicos baseados nas respostas
    if (lowScores.length > 0) {
      insights.push(`${lowScores.length} área(s) identificada(s) como prioridade crítica`);
    }
    
    if (highScores.length > 0) {
      insights.push(`${highScores.length} área(s) de destaque podem servir como referência`);
    }
    
    // Sempre incluir um insight sobre o diagnóstico completo
    insights.push('Diagnóstico completo com IA disponível após cadastro');
    
    return insights.slice(0, 4); // Máximo 4 insights
  };

  const resetModal = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResult(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleCadastrar = async () => {
    if (!activeQuestionnaire) return;

    console.log('🔍 Dados do questionário:', activeQuestionnaire);
    console.log('🔍 Respostas:', answers);

    // Se o usuário já está autenticado, criar diagnóstico diretamente
    if (isAuthenticated && token) {
      try {
        setSubmittingDiagnostic(true);
        
        // Enviar respostas para o endpoint autenticado
        const response = await axiosInstance.post(
          `/questionnaires/${activeQuestionnaire.id}/respond`,
          {
            responses: answers
          }
        );

        console.log('✅ Diagnóstico criado com sucesso:', response.data);
        toast.success('Diagnóstico criado com sucesso!');
        
        // Fechar modal e recarregar dados
        resetModal();
        onClose();
        
      } catch (error: unknown) {
        console.error('Erro ao criar diagnóstico:', error);
        const errorMessage = error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data && typeof error.response.data.message === 'string' ? error.response.data.message : 'Erro ao criar diagnóstico';
        toast.error(errorMessage);
      } finally {
        setSubmittingDiagnostic(false);
      }
      return;
    }

    // Se não está autenticado, usar fluxo público
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await axiosInstance.post(
        `/public/questionnaires/${activeQuestionnaire.id}/respond`,
        {
          responses: answers
        }
      );

      console.log('✅ Resposta do endpoint público:', response.data);

      // Salvar dados temporários no localStorage
      localStorage.setItem('tempDiagnostico', JSON.stringify(response.data.tempData));
      
      // Fechar modal de resultado e abrir modal de cadastro
      setShowResult(false);
      setShowCadastroModal(true);
      
    } catch (error: unknown) {
      console.error('Erro ao processar diagnóstico:', error);
      // Em caso de erro, usar cálculo local como fallback
      const diagnosticoData = {
        questionnaire_id: activeQuestionnaire.id,
        answers,
        score: calculateScore(),
        category: getScoreCategory(calculateScore()).category,
        completedAt: new Date().toISOString()
      };
      
      console.log('💾 Salvando fallback no localStorage:', diagnosticoData);
      localStorage.setItem('tempDiagnostico', JSON.stringify(diagnosticoData));
      
      setShowResult(false);
      setShowCadastroModal(true);
    }
  };

  const handleCadastroClose = () => {
    setShowCadastroModal(false);
    onClose(); // Fechar modal de diagnóstico também
  };


  return (
    <>
      {/* Modal de Diagnóstico */}
      {!showCadastroModal && (
        <>
          {showResult ? (
            <ModalLayout
              isOpen={isOpen}
              onClose={handleClose}
              title="Diagnóstico Concluído!"
              size="lg"
            >
              <div className="text-center space-y-6">
                <div className="mx-auto mb-4 w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-accent" />
                </div>
                <p className="text-base text-muted-foreground">
                  Aqui estão os resultados do seu diagnóstico
                </p>
                
                <div className="space-y-6">
                  {/* Score Display */}
                  <div className="text-center space-y-4">
                    <div className="relative w-24 h-24 mx-auto">
                      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray={`${calculateScore()}, 100`}
                          className="text-accent"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-muted"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold">{calculateScore()}%</span>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className={`text-xl font-bold ${getScoreCategory(calculateScore()).color}`}>
                        {getScoreCategory(calculateScore()).category}
                      </h3>
                      <p className="text-muted-foreground mt-2">
                        {getScoreCategory(calculateScore()).description}
                      </p>
                    </div>
                  </div>

                  {/* Basic Insights */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Principais Insights:</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {generateBasicInsights().map((insight, index) => (
                        <li key={index}>• {insight}</li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col gap-3">
                    <Button 
                      size="lg" 
                      className="w-full" 
                      onClick={handleCadastrar}
                      disabled={submittingDiagnostic}
                    >
                      {submittingDiagnostic ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : isAuthenticated ? (
                        'Salvar Diagnóstico'
                      ) : (
                        'Cadastrar para Ver Relatório Completo'
                      )}
                    </Button>
                    <Button variant="outline" size="lg" className="w-full" onClick={resetModal}>
                      Fazer Outro Diagnóstico
                    </Button>
                  </div>

                  {/* Upgrade Notice */}
                  <div className="border border-accent/20 rounded-lg p-4 bg-accent/5">
                    <h4 className="font-semibold text-accent mb-2">🤖 Análise Inteligente com IA</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Cadastre-se gratuitamente para acessar análise completa com Inteligência Artificial:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                      <li>• <strong>Diagnóstico IA</strong> focado nas 8 áreas essenciais empresariais</li>
                      <li>• <strong>Insights personalizados</strong> baseados nas suas respostas</li>
                      <li>• <strong>Recomendações específicas</strong> para sua empresa</li>
                      <li>• <strong>Áreas prioritárias</strong> identificadas automaticamente</li>
                    </ul>
                  </div>
                </div>
              </div>
            </ModalLayout>
          ) : (
            <ModalLayout
              isOpen={isOpen}
              onClose={handleClose}
              title={activeQuestionnaire?.title || "Diagnóstico"}
              size="lg"
            >
              <div className="space-y-6">
                {loadingQuestionnaire ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                      <p className="text-muted-foreground">Carregando questionário...</p>
                    </div>
                  </div>
                ) : questionnaireError ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Erro ao carregar questionário</h3>
                      <p className="text-muted-foreground mb-4">{questionnaireError}</p>
                      <Button onClick={loadActiveQuestionnaire} variant="outline">
                        Tentar novamente
                      </Button>
                    </div>
                  </div>
                ) : questions.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Nenhum questionário ativo</h3>
                      <p className="text-muted-foreground">
                        Não há questionários ativos disponíveis no momento. Entre em contato com o administrador.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {currentQuestion + 1} de {questions.length} - Responda com honestidade para obter um diagnóstico mais preciso
                    </p>
                
                <div className="space-y-6">
                  {/* Progress */}
                  <Progress value={progress} className="h-2" />

                  {/* Question */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      {questions[currentQuestion].question}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {(() => {
                        const qType = questions[currentQuestion]?.type;
                        if (qType === 'text') {
                          return 'Digite sua resposta no campo abaixo';
                        } else if (qType === 'scale') {
                          return 'Selecione uma nota de 0 a 10';
                        } else {
                          return 'Selecione a opção que melhor descreve sua situação atual';
                        }
                      })()}
                    </p>
                  </div>
                  
                  {(() => {
                    const currentQ = questions[currentQuestion];
                    
                    if (!currentQ) {
                      return (
                        <div className="p-4 border rounded-lg bg-red-50">
                          <p className="text-sm text-red-600">
                            Erro: Pergunta não encontrada
                          </p>
                        </div>
                      );
                    }
                    
                    const questionType = currentQ?.type?.toLowerCase() || '';
                    
                    // Se for pergunta de texto livre - renderizar Textarea
                    if (questionType === 'text') {
                      return (
                        <Textarea
                          value={answers[currentQ?.id] || ''}
                          onChange={(e) => handleAnswerChange(e.target.value)}
                          placeholder="Digite sua resposta aqui..."
                          rows={4}
                          className="min-h-[100px]"
                        />
                      );
                    }
                    
                    // Para outros tipos, verificar opções
                    const questionOptions = getQuestionOptions(currentQ);
                    
                    // Se não tem opções e não é do tipo text, mostrar mensagem de erro
                    if (questionOptions.length === 0) {
                      return (
                        <div className="p-4 border rounded-lg bg-yellow-50">
                          <p className="text-sm text-yellow-800 mb-2">
                            <strong>Aviso:</strong> Esta pergunta não possui opções configuradas.
                          </p>
                          <p className="text-xs text-yellow-600">
                            Tipo: {questionType || 'não definido'} | 
                            Opções na API: {currentQ?.options?.length || 0}
                          </p>
                          <p className="text-xs text-yellow-600 mt-2">
                            Para perguntas de múltipla escolha, é necessário adicionar opções ao criar/editar o questionário.
                          </p>
                        </div>
                      );
                    }
                    
                    // Renderizar opções com RadioGroup
                    return (
                      <RadioGroup 
                        value={answers[currentQ?.id] || ''} 
                        onValueChange={handleAnswerChange}
                      >
                        {questionType === 'scale' ? (
                          // Layout especial para perguntas de escala
                          <div className="space-y-3">
                            <div className="flex justify-between text-xs text-muted-foreground mb-2">
                              <span>Muito Ruim</span>
                              <span>Excelente</span>
                            </div>
                            <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
                              {questionOptions.map((option) => (
                                <div key={option.value} className="flex flex-col items-center">
                                  <RadioGroupItem 
                                    value={option.value} 
                                    id={option.value} 
                                    className="mb-1" 
                                  />
                                  <Label 
                                    htmlFor={option.value} 
                                    className="cursor-pointer text-xs text-center font-medium"
                                  >
                                    {option.value}
                                  </Label>
                                </div>
                              ))}
                            </div>
                            <div className="text-center mt-3">
                              {answers[currentQ?.id] && (
                                <span className="text-sm font-medium text-primary">
                                  {getScaleLabel(parseInt(answers[currentQ?.id]))}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          // Layout padrão para outras perguntas (multiple_choice, etc)
                          questionOptions.map((option) => (
                            <div key={option.value} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 workchoque-transition">
                              <RadioGroupItem value={option.value} id={option.value} className="mt-0.5" />
                              <Label htmlFor={option.value} className="flex-1 cursor-pointer text-sm">
                                {option.label || option.value}
                              </Label>
                            </div>
                          ))
                        )}
                      </RadioGroup>
                    );
                  })()}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-4">
                    <Button 
                      variant="outline" 
                      onClick={handlePrevious}
                      disabled={currentQuestion === 0}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Anterior
                    </Button>
                    
                    <Button 
                      onClick={handleNext}
                      disabled={!canProceed}
                    >
                      {isLastQuestion ? 'Finalizar Diagnóstico' : 'Próxima'}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
                  </>
                )}
              </div>
            </ModalLayout>
          )}
        </>
      )}

      {/* Modal de Cadastro */}
      <CadastroModal
        isOpen={showCadastroModal}
        onClose={handleCadastroClose}
        diagnosticoData={null} // Vai usar localStorage ao invés de props
      />
    </>
  );
};

export default DiagnosticoModal;