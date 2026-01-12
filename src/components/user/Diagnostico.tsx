import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
// import Header from '@/components/layout/Header'; // Removed - using DashboardLayout
import Modal from '@/components/ui/modal';

const questions = [
  {
    id: 1,
    question: 'Como você avalia a comunicação entre as equipes da sua empresa?',
    options: [
      { value: '1', label: 'Muito ruim - Praticamente não existe comunicação' },
      { value: '2', label: 'Ruim - Comunicação falha frequentemente' },
      { value: '3', label: 'Regular - Comunicação funciona às vezes' },
      { value: '4', label: 'Boa - Comunicação é eficaz na maioria das vezes' },
      { value: '5', label: 'Excelente - Comunicação é clara e constante' }
    ]
  },
  {
    id: 2,
    question: 'Qual o nível de satisfação dos colaboradores com o ambiente de trabalho?',
    options: [
      { value: '1', label: 'Muito insatisfeitos - Ambiente tóxico' },
      { value: '2', label: 'Insatisfeitos - Muitos problemas no ambiente' },
      { value: '3', label: 'Neutros - Ambiente nem bom nem ruim' },
      { value: '4', label: 'Satisfeitos - Ambiente agradável' },
      { value: '5', label: 'Muito satisfeitos - Ambiente excepcional' }
    ]
  },
  {
    id: 3,
    question: 'Como você classifica o equilíbrio entre vida pessoal e profissional na empresa?',
    options: [
      { value: '1', label: 'Péssimo - Trabalho consome toda a vida pessoal' },
      { value: '2', label: 'Ruim - Dificuldade para conciliar' },
      { value: '3', label: 'Regular - Às vezes é possível conciliar' },
      { value: '4', label: 'Bom - Geralmente consegue conciliar bem' },
      { value: '5', label: 'Excelente - Perfeito equilíbrio' }
    ]
  },
  {
    id: 4,
    question: 'Qual o nível de reconhecimento e valorização dos colaboradores?',
    options: [
      { value: '1', label: 'Nenhum - Trabalho não é reconhecido' },
      { value: '2', label: 'Baixo - Pouco reconhecimento' },
      { value: '3', label: 'Moderado - Reconhecimento ocasional' },
      { value: '4', label: 'Alto - Bom reconhecimento do trabalho' },
      { value: '5', label: 'Muito alto - Excelente reconhecimento' }
    ]
  },
  {
    id: 5,
    question: 'Como está o desenvolvimento profissional e oportunidades de crescimento?',
    options: [
      { value: '1', label: 'Inexistente - Nenhuma oportunidade' },
      { value: '2', label: 'Limitado - Poucas oportunidades' },
      { value: '3', label: 'Regular - Algumas oportunidades' },
      { value: '4', label: 'Bom - Várias oportunidades disponíveis' },
      { value: '5', label: 'Excelente - Muitas oportunidades de crescimento' }
    ]
  }
];

const Diagnostico = ({ mode = 'page', onComplete }: { mode?: 'page' | 'modal'; onComplete?: () => void }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestion === questions.length - 1;
  const canProceed = answers[questions[currentQuestion].id];

  const handleAnswerChange = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestion].id]: value
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setShowResult(true);
      setShowModal(true);
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
    const totalScore = Object.values(answers).reduce((sum, value) => sum + parseInt(value), 0);
    const maxScore = questions.length * 5;
    return Math.round((totalScore / maxScore) * 100);
  };

  const getScoreCategory = (score: number) => {
    if (score >= 80) return { category: 'Excelente', color: 'text-green-600', description: 'Sua empresa está no caminho certo!' };
    if (score >= 60) return { category: 'Bom', color: 'text-blue-600', description: 'Há espaço para melhorias importantes.' };
    if (score >= 40) return { category: 'Regular', color: 'text-yellow-600', description: 'Várias áreas precisam de atenção.' };
    return { category: 'Crítico', color: 'text-red-600', description: 'Ação urgente é necessária.' };
  };

  if (showResult) {
    const score = calculateScore();
    const scoreInfo = getScoreCategory(score);

    return (
      <div className={mode === 'page' ? "min-h-screen bg-background" : "bg-background"}>
        {/* Header removed - using DashboardLayout */}
        
        <div className={mode === 'page' ? "container mx-auto px-4 py-8 max-w-4xl" : "space-y-4"}>
          <Card className={mode === 'page' ? "workchoque-shadow" : "border-0 shadow-none"}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-3xl font-bold">Diagnóstico Concluído!</CardTitle>
              <CardDescription className="text-lg">
                Aqui estão os resultados do seu diagnóstico
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Score Display */}
              <div className="text-center space-y-4">
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${score}, 100`}
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
                    <span className="text-2xl font-bold">{score}%</span>
                  </div>
                </div>
                
                <div>
                  <h3 className={`text-2xl font-bold ${scoreInfo.color}`}>
                    {scoreInfo.category}
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    {scoreInfo.description}
                  </p>
                </div>
              </div>

              {/* Basic Insights */}
              <div className="bg-muted/50 rounded-lg p-6">
                <h4 className="font-semibold mb-3">Principais Insights:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Análise completa das 5 áreas avaliadas</li>
                  <li>• Identificação de pontos críticos</li>
                  <li>• Comparação com benchmarks do setor</li>
                </ul>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="flex-1" onClick={onComplete}>
                  {mode === 'modal' ? 'Concluir' : 'Cadastrar para Ver Relatório Completo'}
                </Button>
                <Button variant="outline" size="lg" className="flex-1" onClick={() => {
                  setShowResult(false);
                  setCurrentQuestion(0);
                  setAnswers({});
                }}>
                  Fazer Outro Diagnóstico
                </Button>
              </div>

              {/* Upgrade Notice */}
              <div className="border border-accent/20 rounded-lg p-4 bg-accent/5">
                <h4 className="font-semibold text-accent mb-2">🚀 Desbloqueie o Potencial Completo</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Cadastre-se gratuitamente para acessar:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Relatório detalhado com planos de ação personalizados</li>
                  <li>• Acompanhamento de progresso</li>
                  <li>• Sistema de conquistas e gamificação</li>
                  <li>• Comparação com outras empresas</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {mode === 'page' && (
          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            type="success"
            title="Parabéns! Diagnóstico Concluído"
            message="Você completou com sucesso o diagnóstico do ambiente de trabalho. Cadastre-se para acessar o relatório completo e planos de ação personalizados!"
          />
        )}
      </div>
    );
  }

  return (
    <div className={mode === 'page' ? "min-h-screen bg-background" : "bg-background h-full"}>
      {/* Header removed - using DashboardLayout */}
      
      <div className={mode === 'page' ? "container mx-auto px-4 py-8 max-w-4xl" : "h-full flex flex-col"}>
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Diagnóstico do Ambiente de Trabalho</h1>
            <span className="text-sm text-muted-foreground">
              {currentQuestion + 1} de {questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className={mode === 'page' ? "workchoque-shadow" : "border-0 shadow-none flex-1"}>
          <CardHeader>
            <CardTitle className="text-xl">
              {questions[currentQuestion].question}
            </CardTitle>
            <CardDescription>
              Selecione a opção que melhor descreve sua situação atual
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <RadioGroup 
              value={answers[questions[currentQuestion].id] || ''} 
              onValueChange={handleAnswerChange}
            >
              {questions[currentQuestion].options.map((option) => (
                <div key={option.value} className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 workchoque-transition">
                  <RadioGroupItem value={option.value} id={option.value} className="mt-0.5" />
                  <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
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
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            💡 Responda com honestidade para obter um diagnóstico mais preciso
          </p>
        </div>
      </div>
    </div>
  );
};

export default Diagnostico;