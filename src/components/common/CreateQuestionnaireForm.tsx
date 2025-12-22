import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Trash2, 
  Save, 
  FileText, 
  Settings, 
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Target
} from 'lucide-react';
import { axiosInstance } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

// Interfaces
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

interface ApiQuestionOption {
  id?: string;
  value: string;
  label?: string;
  score?: number;
  order?: number;
}

interface ApiQuestion {
  id?: string;
  question: string;
  type: string;
  required?: boolean;
  order?: number;
  options?: ApiQuestionOption[];
}

interface ApiQuestionnaireData {
  title: string;
  description?: string;
  type: string;
  estimated_time?: number;
  is_active: boolean;
  questions?: ApiQuestion[];
}

interface QuestionOption {
  id?: string;
  value: string;
  label?: string;
  score?: number;
  order?: number;
}

interface Question {
  id?: string;
  question: string;
  type: 'text' | 'scale' | 'multiple_choice' | 'yes_no';
  options?: QuestionOption[];
  required: boolean;
  order: number;
}

interface QuestionnaireForm {
  title: string;
  description: string;
  type: string;
  estimated_time: number;
  is_active: boolean;
  questions: Question[];
}

// Opções de tipo de questionário
const QUESTIONNAIRE_TYPES = [
  { value: 'estresse', label: 'Estresse Organizacional', icon: '⚠️' },
  { value: 'clima', label: 'Clima Organizacional', icon: '🏢' },
  { value: 'burnout', label: 'Avaliação de Burnout', icon: '🔥' },
  { value: 'satisfacao', label: 'Satisfação no Trabalho', icon: '😊' },
  { value: 'lideranca', label: 'Avaliação de Liderança', icon: '👑' },
  { value: 'equipe', label: 'Dinâmica de Equipe', icon: '👥' },
  { value: 'geral', label: 'Avaliação Geral', icon: '📋' }
];

// Opções de tipo de pergunta
const QUESTION_TYPES = [
  { value: 'text', label: 'Texto Livre', description: 'Resposta em texto' },
  { value: 'scale', label: 'Escala (1-10)', description: 'Escala numérica de 1 a 10' },
  { value: 'multiple_choice', label: 'Múltipla Escolha', description: 'Selecionar uma opção' },
  { value: 'yes_no', label: 'Sim/Não', description: 'Resposta binária' }
];

interface CreateQuestionnaireFormProps {
  mode?: 'create' | 'edit';
  initialData?: Questionnaire | null;
  onSave: (questionnaire: QuestionnaireForm) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function CreateQuestionnaireForm({ mode = 'create', initialData, onSave, onCancel, loading = false }: CreateQuestionnaireFormProps) {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<QuestionnaireForm>({
    title: '',
    description: '',
    type: 'geral',
    estimated_time: 15,
    is_active: true,
    questions: []
  });
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Util: gerar slug a partir do rótulo (removendo acentos e caracteres especiais)
  // Util: gerar slug a partir do rótulo (removendo acentos e caracteres especiais)
  const slugify = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove diacríticos
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // remove não-alfanuméricos
      .replace(/\s+/g, '-') // espaços para hífen
      .replace(/-+/g, '-'); // colapsa hífens
  };

  // Util: garantir valor único por questão, adicionando sufixos quando necessário
  const generateUniqueOptionValue = (question: Question, label: string, optionId?: string): string => {
    const base = slugify(label) || `opcao-${Date.now()}`;
    const existing = new Set((question.options || [])
      .filter((o) => o.id !== optionId)
      .map((o) => o.value));
    let candidate = base;
    let suffix = 2;
    while (existing.has(candidate)) {
      candidate = `${base}-${suffix++}`;
    }
    return candidate;
  };

  // Função para carregar questionário completo com perguntas (memoizada para evitar loops)
  const loadQuestionnaireDetails = useCallback(async (questionnaireId: string) => {
    if (!token) return null;
    
    try {
      setLoadingQuestions(true);
      const response = await axiosInstance.get(`/questionnaires/${questionnaireId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar detalhes do questionário:', error);
      return null;
    } finally {
      setLoadingQuestions(false);
    }
  }, [token]);

  // Função para transformar dados da API para formato do formulário
  const transformApiToForm = (apiData: ApiQuestionnaireData): QuestionnaireForm => {
    return {
      title: apiData.title,
      description: apiData.description || '',
      type: apiData.type,
      estimated_time: apiData.estimated_time || 15,
      is_active: apiData.is_active,
      questions: apiData.questions?.map((q: ApiQuestion, index: number) => ({
        id: q.id,
        question: q.question,
        type: q.type as 'text' | 'scale' | 'multiple_choice' | 'yes_no',
        required: q.required ?? true,
        order: q.order || index + 1,
        options: q.options?.map((opt: ApiQuestionOption, optIndex: number) => ({
          id: opt.id,
          value: opt.value,
          label: opt.label || opt.value,
          score: opt.score || 1,
          order: opt.order || optIndex + 1
        })) || []
      })) || []
    };
  };

  // Usar ref para rastrear se já inicializou
  const initializedRef = useRef(false);
  const lastInitialDataIdRef = useRef<string | null>(null);

  // Inicializar formulário apenas quando necessário
  useEffect(() => {
    const currentId = initialData?.id || null;
    const idChanged = currentId !== lastInitialDataIdRef.current;
    
    // Modo create: resetar apenas quando realmente necessário
    if (mode === 'create') {
      // Se mudou de edit para create, resetar
      if (lastInitialDataIdRef.current !== null) {
        initializedRef.current = false;
        lastInitialDataIdRef.current = null;
        setFormData({
          title: '',
          description: '',
          type: 'geral',
          estimated_time: 15,
          is_active: true,
          questions: []
        });
      } else if (!initializedRef.current) {
        // Inicializar apenas na primeira vez
        initializedRef.current = true;
      }
      return;
    }

    // Modo edit: carregar dados apenas quando o ID mudar
    if (mode === 'edit' && initialData && idChanged) {
      initializedRef.current = true;
      lastInitialDataIdRef.current = currentId;
      
      // Carregar dados básicos primeiro
      setFormData({
        title: initialData.title,
        description: initialData.description || '',
        type: initialData.type,
        estimated_time: initialData.estimated_time,
        is_active: initialData.is_active,
        questions: []
      });

      // Carregar perguntas completas
      loadQuestionnaireDetails(initialData.id).then(apiData => {
        if (apiData) {
          const formData = transformApiToForm(apiData);
          setFormData(formData);
        }
      });
    }
  }, [mode, initialData, loadQuestionnaireDetails]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validação
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (!formData.type) {
      newErrors.type = 'Tipo é obrigatório';
    }

    if (formData.estimated_time < 1) {
      newErrors.estimated_time = 'Tempo estimado deve ser maior que 0';
    }

    if (formData.questions.length === 0) {
      newErrors.questions = 'Adicione pelo menos uma pergunta';
    }

    // Validar perguntas
    formData.questions.forEach((question, index) => {
      if (!question.question.trim()) {
        newErrors[`question_${index}`] = 'Pergunta não pode estar vazia';
      }
      
      if (question.type === 'multiple_choice' && (!question.options || question.options.length < 2)) {
        newErrors[`question_${index}_options`] = 'Múltipla escolha deve ter pelo menos 2 opções';
      }

      if (question.type === 'multiple_choice' && (question.options && question.options.length >= 2)) {
        const hasEmptyLabel = !!question.options.find((opt) => !(opt.label || '').trim());
        if (hasEmptyLabel) {
          newErrors[`question_${index}_options`] = 'Preencha os rótulos de todas as opções.';
        }
      }
    });

    setErrors(newErrors);

    const keys = Object.keys(newErrors);
    const hasBasicErrors = keys.some((k) => k === 'title' || k === 'description' || k === 'type' || k === 'estimated_time');
    const hasQuestionErrors = keys.some((k) => k === 'questions' || k.startsWith('question_'));

    if (hasBasicErrors) {
      setActiveTab('basic');
    } else if (hasQuestionErrors) {
      setActiveTab('questions');
    }

    return keys.length === 0;
  };

  // Handlers
  const handleInputChange = (field: keyof QuestionnaireForm, value: string | number | boolean) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      return newData;
    });
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `question_${Date.now()}`,
      question: '',
      type: 'text',
      required: true,
      order: formData.questions.length + 1
    };

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (questionId: string, field: keyof Question, value: string | number | boolean | QuestionOption[]) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, [field]: value } : q
      )
    }));
  };

  const removeQuestion = (questionId: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const addQuestionOption = (questionId: string) => {
    const newOption: QuestionOption = {
      id: `option_${Date.now()}`,
      value: '',
      label: '',
      score: 1
    };

    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId 
          ? { ...q, options: [...(q.options || []), newOption] }
          : q
      )
    }));
  };

  const updateQuestionOption = (questionId: string, optionId: string, field: keyof QuestionOption, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id !== questionId) return q;
        // Se atualizar o rótulo, também gerar/atualizar o valor automaticamente
        if (field === 'label') {
          const newValue = generateUniqueOptionValue(q, String(value), optionId);
          return {
            ...q,
            options: q.options?.map(opt =>
              opt.id === optionId ? { ...opt, label: String(value), value: newValue } : opt
            )
          };
        }
        return {
          ...q,
          options: q.options?.map(opt =>
            opt.id === optionId ? { ...opt, [field]: value } : opt
          )
        };
      })
    }));
  };

  const removeQuestionOption = (questionId: string, optionId: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId 
          ? {
              ...q,
              options: q.options?.filter(opt => opt.id !== optionId)
            }
          : q
      )
    }));
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const getQuestionTypeIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'text': <FileText className="w-4 h-4" />,
      'scale': <Target className="w-4 h-4" />,
      'multiple_choice': <CheckCircle className="w-4 h-4" />,
      'yes_no': <AlertCircle className="w-4 h-4" />
    };
    return iconMap[type] || <FileText className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Informações Básicas
          </TabsTrigger>
          <TabsTrigger value="questions" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Perguntas ({formData.questions.length})
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Informações Básicas */}
        <TabsContent value="basic" className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Questionário *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Ex: Questionário de Estresse Organizacional"
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva o objetivo e escopo do questionário..."
                rows={4}
                className={errors.description ? 'border-destructive' : ''}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger className={errors.type ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTIONNAIRE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-destructive">{errors.type}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_time">Tempo Estimado (minutos) *</Label>
                <Input
                  id="estimated_time"
                  type="number"
                  min="1"
                  value={formData.estimated_time}
                  onChange={(e) => handleInputChange('estimated_time', parseInt(e.target.value) || 0)}
                  className={errors.estimated_time ? 'border-destructive' : ''}
                />
                {errors.estimated_time && (
                  <p className="text-sm text-destructive">{errors.estimated_time}</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Perguntas */}
        <TabsContent value="questions" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Perguntas do Questionário</h3>
              <p className="text-sm text-muted-foreground">
                {mode === 'edit' && loadingQuestions 
                  ? "Carregando perguntas existentes..." 
                  : "Adicione as perguntas que compõem o questionário"
                }
              </p>
            </div>
            <Button onClick={addQuestion} variant="outline" disabled={loadingQuestions}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Pergunta
            </Button>
          </div>

          {mode === 'edit' && loadingQuestions && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Carregando perguntas existentes...</p>
              </div>
            </div>
          )}

          {errors.questions && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{errors.questions}</p>
            </div>
          )}

          <div className="space-y-4">
            {formData.questions.map((question, index) => (
              <Card key={question.id} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div className="flex items-center gap-2">
                        {getQuestionTypeIcon(question.type)}
                        <span className="text-sm font-medium">
                          {QUESTION_TYPES.find(t => t.value === question.type)?.label}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(question.id || `question_${index}`)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Pergunta *</Label>
                    <Textarea
                      value={question.question}
                      onChange={(e) => updateQuestion(question.id || `question_${index}`, 'question', e.target.value)}
                      placeholder="Digite a pergunta..."
                      rows={2}
                      className={errors[`question_${index}`] ? 'border-destructive' : ''}
                    />
                    {errors[`question_${index}`] && (
                      <p className="text-sm text-destructive">{errors[`question_${index}`]}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Resposta</Label>
                      <Select 
                        value={question.type} 
                        onValueChange={(value) => updateQuestion(question.id || `question_${index}`, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {QUESTION_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-muted-foreground">{type.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`required_${question.id}`}
                        checked={question.required}
                        onCheckedChange={(checked) => updateQuestion(question.id || `question_${index}`, 'required', checked)}
                      />
                      <Label htmlFor={`required_${question.id}`} className="text-sm">
                        Pergunta obrigatória
                      </Label>
                    </div>
                  </div>

                  {/* Opções para múltipla escolha */}
                  {question.type === 'multiple_choice' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Opções de Resposta</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addQuestionOption(question.id || `question_${index}`)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Adicionar Opção
                       </Button>
                      </div>
                      
                      {errors[`question_${index}_options`] && (
                        <p className="text-sm text-destructive">{errors[`question_${index}_options`]}</p>
                      )}

                      <div className="space-y-2">
                        {question.options?.map((option, optIndex) => (
                          <div key={option.id || `option_${optIndex}`} className="flex items-center gap-2">
                            <Input
                              value={option.label || option.value}
                              onChange={(e) => updateQuestionOption(question.id || `question_${index}`, option.id || `option_${optIndex}`, 'label', e.target.value)}
                              placeholder={`Rótulo da opção ${optIndex + 1}`}
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQuestionOption(question.id || `question_${index}`, option.id || `option_${optIndex}`)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 3: Configurações */}
        <TabsContent value="settings" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
              <Label htmlFor="is_active">Questionário ativo</Label>
            </div>
            
            <div className="p-4 rounded-lg bg-muted">
              <h4 className="font-medium mb-2">Resumo do Questionário</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Título:</span>
                  <span className="ml-2 font-medium">{formData.title || 'Não definido'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="ml-2 font-medium">
                    {QUESTIONNAIRE_TYPES.find(t => t.value === formData.type)?.label || 'Não definido'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Perguntas:</span>
                  <span className="ml-2 font-medium">{formData.questions.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tempo estimado:</span>
                  <span className="ml-2 font-medium">{formData.estimated_time} minutos</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? (mode === 'create' ? 'Criando...' : 'Salvando...') : (mode === 'create' ? 'Criar Questionário' : 'Salvar Alterações')}
        </Button>
      </div>
    </div>
  );
}
