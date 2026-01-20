import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Loader2, Save } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface DiagnosticSpec {
  title: string;
  area: string;
  teamSize: string;
  description: string;
  painPoints: string;
  goals: string;
  urgency: 'baixa' | 'media' | 'alta';
  timeframe: '30_dias' | '60_dias' | '90_dias';
}

interface DiagnosticoProps {
  mode?: 'page' | 'modal';
  onComplete?: () => void;
}

const Diagnostico: React.FC<DiagnosticoProps> = ({ mode = 'page', onComplete }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [spec, setSpec] = useState<DiagnosticSpec>({
    title: '',
    area: '',
    teamSize: '',
    description: '',
    painPoints: '',
    goals: '',
    urgency: 'media',
    timeframe: '60_dias',
  });
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const totalSteps = 4;

  const handleChange = (field: keyof DiagnosticSpec, value: string) => {
    setSpec((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const canGoNext = () => {
    if (currentStep === 0) {
      return spec.title.trim().length > 0 && spec.area.trim().length > 0;
    }
    if (currentStep === 1) {
      return spec.painPoints.trim().length > 0 && spec.goals.trim().length > 0;
    }
    if (currentStep === 2) {
      return !!spec.urgency && !!spec.timeframe;
    }
    return true;
  };

  const handleNext = () => {
    if (!canGoNext()) {
      return;
    }
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      void handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {

    try {
      setSubmitting(true);

      const payload = {
        title: spec.title,
        area: spec.area,
        teamSize: spec.teamSize,
        description: spec.description,
        painPoints: spec.painPoints,
        goals: spec.goals,
        urgency: spec.urgency,
        timeframe: spec.timeframe,
        userId: user?.id,
        company: user?.company,
      };

      const response = await api.post('/api/diagnostics', payload);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = (data && data.message) || 'Não foi possível criar o diagnóstico.';
        throw new Error(message);
      }

      toast.success('Diagnóstico criado com sucesso a partir das suas especificações!');

      if (mode === 'modal') {
        if (onComplete) {
          onComplete();
        }
      } else {
        setIsCompleted(true);
      }
    } catch (err: unknown) {
      console.error('Error submitting diagnostic:', err);
      const errorObject = err as { message?: string };
      toast.error(errorObject.message || 'Erro ao salvar diagnóstico.');
    } finally {
      setSubmitting(false);
    }
  };

  const progress = ((currentStep + 1) / totalSteps) * 100;

  const renderStep = () => {
    if (currentStep === 0) {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Nome do diagnóstico</Label>
            <Textarea
              id="title"
              value={spec.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Ex: Diagnóstico de Clima Organizacional da Equipe de Vendas"
              className="min-h-[60px]"
            />
          </div>
          <div>
            <Label htmlFor="area">Área ou setor avaliado</Label>
            <Textarea
              id="area"
              value={spec.area}
              onChange={(e) => handleChange('area', e.target.value)}
              placeholder="Ex: Vendas, Marketing, Operações, Empresa inteira"
              className="min-h-[60px]"
            />
          </div>
          <div>
            <Label htmlFor="teamSize">Tamanho aproximado da equipe</Label>
            <Textarea
              id="teamSize"
              value={spec.teamSize}
              onChange={(e) => handleChange('teamSize', e.target.value)}
              placeholder="Ex: 12 pessoas, 3 líderes e 9 analistas"
              className="min-h-[60px]"
            />
          </div>
        </div>
      );
    }

    if (currentStep === 1) {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="painPoints">Quais problemas você quer entender?</Label>
            <Textarea
              id="painPoints"
              value={spec.painPoints}
              onChange={(e) => handleChange('painPoints', e.target.value)}
              placeholder="Descreva os principais desafios, sintomas ou sinais que você está percebendo."
              className="min-h-[120px]"
            />
          </div>
          <div>
            <Label htmlFor="goals">Qual é o objetivo deste diagnóstico?</Label>
            <Textarea
              id="goals"
              value={spec.goals}
              onChange={(e) => handleChange('goals', e.target.value)}
              placeholder="Ex: identificar causas de turnover, medir engajamento, mapear conflitos de liderança."
              className="min-h-[120px]"
            />
          </div>
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div className="space-y-6">
          <div>
            <Label>Qual é o nível de urgência?</Label>
            <RadioGroup
              value={spec.urgency}
              onValueChange={(value) => handleChange('urgency', value as DiagnosticSpec['urgency'])}
              className="space-y-3 mt-2"
            >
              <div className="flex items-center space-x-3 rounded-lg border p-3">
                <RadioGroupItem value="baixa" id="urgency-baixa" />
                <Label htmlFor="urgency-baixa" className="flex flex-col">
                  <span>Baixa</span>
                  <span className="text-xs text-muted-foreground">
                    Importante, mas pode ser feito sem pressa.
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-3">
                <RadioGroupItem value="media" id="urgency-media" />
                <Label htmlFor="urgency-media" className="flex flex-col">
                  <span>Média</span>
                  <span className="text-xs text-muted-foreground">
                    Ideal resolver nos próximos meses.
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-3">
                <RadioGroupItem value="alta" id="urgency-alta" />
                <Label htmlFor="urgency-alta" className="flex flex-col">
                  <span>Alta</span>
                  <span className="text-xs text-muted-foreground">
                    Impacto direto em resultados e clima atual.
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label>Horizonte desejado para ações</Label>
            <RadioGroup
              value={spec.timeframe}
              onValueChange={(value) =>
                handleChange('timeframe', value as DiagnosticSpec['timeframe'])
              }
              className="space-y-3 mt-2"
            >
              <div className="flex items-center space-x-3 rounded-lg border p-3">
                <RadioGroupItem value="30_dias" id="timeframe-30" />
                <Label htmlFor="timeframe-30" className="flex flex-col">
                  <span>Próximos 30 dias</span>
                  <span className="text-xs text-muted-foreground">
                    Situações que exigem reação rápida.
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-3">
                <RadioGroupItem value="60_dias" id="timeframe-60" />
                <Label htmlFor="timeframe-60" className="flex flex-col">
                  <span>Próximos 60 dias</span>
                  <span className="text-xs text-muted-foreground">
                    Ajustes estruturais de curto e médio prazo.
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-3">
                <RadioGroupItem value="90_dias" id="timeframe-90" />
                <Label htmlFor="timeframe-90" className="flex flex-col">
                  <span>Próximos 90 dias</span>
                  <span className="text-xs text-muted-foreground">
                    Transformações mais profundas e planejadas.
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div>
          <Label>Resumo do diagnóstico</Label>
          <div className="mt-2 p-4 border rounded-lg bg-muted/40 text-sm space-y-2">
            <p>
              <span className="font-medium">Nome: </span>
              {spec.title || 'Não informado'}
            </p>
            <p>
              <span className="font-medium">Área: </span>
              {spec.area || 'Não informada'}
            </p>
            <p>
              <span className="font-medium">Equipe: </span>
              {spec.teamSize || 'Não informada'}
            </p>
            <p>
              <span className="font-medium">Problemas principais: </span>
              {spec.painPoints || 'Não informado'}
            </p>
            <p>
              <span className="font-medium">Objetivos: </span>
              {spec.goals || 'Não informado'}
            </p>
            <p>
              <span className="font-medium">Urgência: </span>
              {spec.urgency}
            </p>
            <p>
              <span className="font-medium">Horizonte: </span>
              {spec.timeframe}
            </p>
          </div>
        </div>
        <div>
          <Label htmlFor="description">Observações adicionais</Label>
          <Textarea
            id="description"
            value={spec.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Inclua qualquer detalhe que ajude a IA a gerar um diagnóstico mais preciso."
            className="min-h-[120px]"
          />
        </div>
      </div>
    );
  };

  const wrapperClassName =
    mode === 'page' ? 'min-h-screen bg-background' : 'bg-background';

  const containerClassName =
    mode === 'page'
      ? 'container mx-auto px-4 py-8 max-w-4xl'
      : 'px-1 sm:px-2 py-4 sm:py-6 max-w-3xl mx-auto';

  const showCompletedScreen = mode === 'page' && isCompleted;

  return (
    <div className={wrapperClassName}>
      <div className={containerClassName}>
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
            <p>Carregando novo diagnóstico...</p>
          </div>
        ) : error ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ops! Algo deu errado.</h3>
            <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
            <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
          </div>
        ) : showCompletedScreen ? (
          <Card className="border-0 shadow-none">
            <CardContent className="py-8 text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Diagnóstico criado!</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Suas respostas foram registradas com sucesso. Nossa IA está processando os dados
                  para gerar insights personalizados.
                </p>
              </div>
              <div className="pt-4 flex gap-4 justify-center">
                <Button onClick={() => navigate('/diagnosticos')}>Ver Meus Diagnósticos</Button>
                <Button variant="outline" onClick={() => navigate('/planos-acao')}>
                  Ver Planos de Ação
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h1 className="text-2xl font-bold">Novo Diagnóstico</h1>
                  {user?.company && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Empresa: {user.company}
                    </p>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  Etapa {currentStep + 1} de {totalSteps}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <Card className="workchoque-shadow">
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl font-semibold leading-relaxed">
                  Configure seu novo diagnóstico
                </CardTitle>
                <CardDescription>
                  Preencha as informações abaixo para criar um diagnóstico alinhado à sua realidade.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="pt-2">{renderStep()}</div>

                <div className="flex justify-between pt-6 border-t mt-4">
                  <Button
                    variant="ghost"
                    onClick={handlePrevious}
                    disabled={currentStep === 0 || submitting}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" /> Anterior
                  </Button>

                  <Button
                    onClick={handleNext}
                    disabled={!canGoNext() || submitting}
                    className="gap-2 min-w-[160px]"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : currentStep === totalSteps - 1 ? (
                      <>
                        Finalizar <Save className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Próxima <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Responda com honestidade para obter um diagnóstico mais preciso.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Diagnostico;
