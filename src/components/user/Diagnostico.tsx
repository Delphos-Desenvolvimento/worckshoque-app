import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Loader2, Save } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { DiagnosticModalSchema } from '@/lib/homepage-diagnostic';

const STEP_ANCHORS = ['informacoes', 'problemas', 'urgencia', 'resumo'] as const;

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
  schema?: DiagnosticModalSchema;
  headerTitle?: string;
}

const Diagnostico: React.FC<DiagnosticoProps> = ({
  mode = 'page',
  onComplete,
  schema,
  headerTitle,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
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

  useEffect(() => {
    const parseStep = (raw?: string | null) => {
      const value = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
      if (!value) return null;
      const asNumber = Number(value);
      if (Number.isInteger(asNumber)) {
        return Math.max(0, Math.min(asNumber, totalSteps - 1));
      }
      const match = value.match(/^step-?(\d+)$/);
      if (match) {
        const idx = Number(match[1]);
        if (Number.isInteger(idx)) {
          return Math.max(0, Math.min(idx, totalSteps - 1));
        }
      }
      const idx = STEP_ANCHORS.indexOf(value as (typeof STEP_ANCHORS)[number]);
      return idx >= 0 ? idx : null;
    };

    const params = new URLSearchParams(location.search);
    const fromQuery = params.get('step') ?? params.get('etapa') ?? params.get('module');
    const fromHash = location.hash ? location.hash.slice(1) : '';
    const resolved = parseStep(fromQuery ?? fromHash);
    if (resolved !== null) setCurrentStep(resolved);
  }, [location.search, location.hash, totalSteps]);

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
    return (
      spec.title.trim().length > 0 &&
      spec.area.trim().length > 0 &&
      spec.painPoints.trim().length > 0 &&
      spec.goals.trim().length > 0
    );
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

  const calculateCompletenessScore = () => {
    let score = 0;
    
    // Step 0: Basic Info (3 fields, 10 points each)
    if (spec.title.trim().length > 5) score += 10;
    if (spec.area.trim().length > 3) score += 10;
    if (spec.teamSize.trim().length > 0) score += 10;
    
    // Step 1: Problems & Goals (2 fields, 20 points each)
    // More points for detailed descriptions
    if (spec.painPoints.trim().length > 10) score += 10;
    if (spec.painPoints.trim().length > 50) score += 10;
    
    if (spec.goals.trim().length > 10) score += 10;
    if (spec.goals.trim().length > 50) score += 10;
    
    // Step 2: Urgency & Timeframe (2 fields, 10 points each)
    if (spec.urgency) score += 10;
    if (spec.timeframe) score += 10;
    
    // Step 3: Description (Optional, 10 bonus points)
    if (spec.description && spec.description.trim().length > 10) score += 10;
    
    return Math.min(score, 100);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const completenessScore = calculateCompletenessScore();

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
        initialScore: completenessScore, // Send the calculated score
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

  const canGoNextDynamic = (
    current: number,
    pages: DiagnosticModalSchema['pages'],
    values: Record<string, string>,
  ) => {
    const page = pages[current];
    if (!page) return false;
    const requiredFields = page.fields.filter((f) => f.required);
    return requiredFields.every((f) => {
      const v = (values[f.id] ?? '').trim();
      if (f.type === 'checkbox') return v === 'true';
      return v.length > 0;
    });
  };

  const renderDynamicField = (
    field: DiagnosticModalSchema['pages'][number]['fields'][number],
    value: string,
    onChange: (v: string) => void,
  ) => {
    if (field.type === 'textarea') {
      return (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={typeof field.rows === 'number' && field.rows > 0 ? field.rows : 4}
          className="min-h-[90px]"
        />
      );
    }

    if (field.type === 'checkbox') {
      const checked = value === 'true';
      return (
        <div className="flex items-center gap-2 h-10">
          <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true ? 'true' : 'false')} />
          <div className="text-sm text-muted-foreground">{checked ? 'Sim' : 'Não'}</div>
        </div>
      );
    }

    if (field.type === 'select') {
      const options = field.options ?? [];
      if (options.length === 0) {
        return (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        );
      }
      return (
        <Select value={value} onValueChange={(v) => onChange(v)}>
          <SelectTrigger>
            <SelectValue placeholder={field.placeholder || 'Selecione'} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (field.type === 'radio') {
      const options = field.options ?? [];
      if (options.length === 0) {
        return (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        );
      }
      return (
        <RadioGroup value={value} onValueChange={(v) => onChange(v)} className="space-y-3 mt-2">
          {options.map((opt) => (
            <div key={opt} className="flex items-center space-x-3 rounded-lg border p-3">
              <RadioGroupItem value={opt} id={`${field.id}-${opt}`} />
              <Label htmlFor={`${field.id}-${opt}`} className="flex flex-col">
                <span>{opt}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      );
    }

    if (field.type === 'number') {
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          min={typeof field.min === 'number' ? field.min : undefined}
          max={typeof field.max === 'number' ? field.max : undefined}
          step={typeof field.step === 'number' ? field.step : undefined}
        />
      );
    }

    if (field.type === 'email') {
      return (
        <Input
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      );
    }

    if (field.type === 'date') {
      return (
        <Input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      );
    }

    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
    );
  };

  const DynamicModalContent = ({
    schema,
    headerTitle,
    company,
  }: {
    schema: DiagnosticModalSchema;
    headerTitle?: string;
    company?: string;
  }) => {
    const pages = schema.pages;
    const [dynamicStep, setDynamicStep] = useState(0);
    const [values, setValues] = useState<Record<string, string>>(() => {
      const allFields = pages.flatMap((p) => p.fields);
      return Object.fromEntries(
        allFields.map((f) => [
          f.id,
          typeof f.defaultValue === 'string'
            ? f.defaultValue
            : f.type === 'checkbox'
              ? 'false'
              : '',
        ]),
      );
    });

    useEffect(() => {
      const allFields = pages.flatMap((p) => p.fields);
      setValues((prev) => {
        const next = { ...prev };
        for (const f of allFields) {
          if (typeof next[f.id] !== 'string') {
            next[f.id] =
              typeof f.defaultValue === 'string'
                ? f.defaultValue
                : f.type === 'checkbox'
                  ? 'false'
                  : '';
          }
        }
        for (const k of Object.keys(next)) {
          if (!allFields.some((f) => f.id === k)) delete next[k];
        }
        return next;
      });
    }, [pages]);

    const dynamicTotalSteps = Math.max(1, pages.length);
    const dynamicProgress = ((dynamicStep + 1) / dynamicTotalSteps) * 100;
    const currentPage = pages[dynamicStep];

    const setFieldValue = (fieldId: string, v: string) => {
      setValues((prev) => ({ ...prev, [fieldId]: v }));
    };

    const submitDynamic = async () => {
      try {
        setSubmitting(true);
        const knownKeys = new Set([
          'title',
          'area',
          'teamSize',
          'description',
          'painPoints',
          'goals',
          'urgency',
          'timeframe',
          'company',
        ]);

        const allFields = pages.flatMap((p) => p.fields);
        const payload: Record<string, unknown> = {};
        for (const field of allFields) {
          const v = (values[field.id] ?? '').trim();
          if (!v) continue;
          const key = field.key;
          if (!key) continue;
          if (knownKeys.has(key)) payload[key] = v;
        }
        payload.company = company;

        const customFields: Record<string, string> = {};
        for (const field of allFields) {
          const v = (values[field.id] ?? '').trim();
          if (!v) continue;
          const key = field.key;
          if (!key || knownKeys.has(key)) continue;
          customFields[key] = v;
        }
        payload.customFields = customFields;

        const response = await api.post('/api/diagnostics', payload);
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          const message =
            (data && (data as { message?: string }).message) ||
            'Não foi possível criar o diagnóstico.';
          throw new Error(message);
        }

        toast.success('Diagnóstico criado com sucesso!');
        if (onComplete) onComplete();
      } catch (err: unknown) {
        const errorObject = err as { message?: string };
        toast.error(errorObject.message || 'Erro ao salvar diagnóstico.');
      } finally {
        setSubmitting(false);
      }
    };

    const handleNextDynamic = () => {
      if (!currentPage) return;
      const canNext = canGoNextDynamic(dynamicStep, pages, values);
      if (!canNext) return;
      if (dynamicStep < dynamicTotalSteps - 1) {
        setDynamicStep((prev) => prev + 1);
      } else {
        void submitDynamic();
      }
    };

    const handlePreviousDynamic = () => {
      if (dynamicStep > 0) setDynamicStep((prev) => prev - 1);
    };

    const isLast = dynamicStep === dynamicTotalSteps - 1;
    const canNext = currentPage ? canGoNextDynamic(dynamicStep, pages, values) : false;

    const summaryItems = pages
      .flatMap((p) => p.fields)
      .filter((f) => f.key && f.key !== 'description')
      .map((f) => ({
        key: f.id,
        label: f.label,
        value: values[f.id] ?? '',
      }));

    return (
      <>
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h1 className="text-2xl font-bold">{headerTitle || 'Novo Diagnóstico'}</h1>
              {company && (
                <p className="text-xs text-muted-foreground mt-1">
                  Empresa: {company}
                </p>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              Etapa {dynamicStep + 1} de {dynamicTotalSteps}
            </span>
          </div>
          <Progress value={dynamicProgress} className="h-2" />
        </div>

        <Card className="workchoque-shadow">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl font-semibold leading-relaxed">
              {currentPage?.title || 'Diagnóstico'}
            </CardTitle>
            {currentPage?.description && (
              <CardDescription>{currentPage.description}</CardDescription>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {currentPage?.type === 'summary' && (
              <div className="space-y-4">
                <div>
                  <Label>Resumo</Label>
                  <div className="mt-2 p-4 border rounded-lg bg-muted/40 text-sm space-y-2">
                    {summaryItems.map((item) => (
                      <p key={item.key}>
                        <span className="font-medium">{item.label}: </span>
                        {item.value || 'Não informado'}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {(() => {
                const groups = (currentPage?.fields ?? []).reduce(
                  (acc, field) => {
                    const k =
                      typeof field.category === 'string' && field.category.trim().length > 0
                        ? field.category.trim()
                        : '';
                    const list = acc.get(k) ?? [];
                    list.push(field);
                    acc.set(k, list);
                    return acc;
                  },
                  new Map<string, typeof currentPage.fields>(),
                );

                const entries = Array.from(groups.entries());
                return entries.map(([category, fields]) => (
                  <div key={category || 'uncategorized'} className="space-y-4">
                    {category ? (
                      <div className="text-sm font-semibold text-foreground/90">
                        {category}
                      </div>
                    ) : null}
                    {fields.map((field) => (
                      <div key={field.id}>
                        <Label>
                          {field.label}
                          {field.required ? ' *' : ''}
                        </Label>
                        <div className="mt-2">
                          {renderDynamicField(
                            field,
                            values[field.id] ?? '',
                            (v) => setFieldValue(field.id, v),
                          )}
                        </div>
                        {field.helpText ? (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {field.helpText}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>

            <div className="flex justify-between pt-6 border-t mt-4">
              <Button
                variant="ghost"
                onClick={handlePreviousDynamic}
                disabled={dynamicStep === 0 || submitting}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" /> Anterior
              </Button>

              <Button
                onClick={handleNextDynamic}
                disabled={!canNext || submitting}
                className="gap-2 min-w-[160px]"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isLast ? (
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
      </>
    );
  };

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
            {mode === 'modal' && schema ? (
              <DynamicModalContent
                schema={schema}
                headerTitle={headerTitle}
                company={user?.company}
              />
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
                    <div id={STEP_ANCHORS[currentStep]} className="pt-2">{renderStep()}</div>

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
          </>
        )}
      </div>
    </div>
  );
};

export default Diagnostico;
