import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Content, UserRole } from './types/content.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, ArrowLeft, Trash2, Plus, X, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { api } from '@/lib/api';

type FormData = Omit<Content, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'views' | 'isFavorite' | 'progress' | 'lastViewed'> & {
  id?: string;
  isNew?: boolean;
};

export const ContentEditor: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    type: 'article',
    category: '',
    content: '',
    metadata: {
      duration: 5,
      difficulty: 'beginner',
      tags: [],
    },
    accessLevel: 'public',
    allowedRoles: ['admin', 'doctor', 'patient'],
    createdByName: user?.name || '',
    status: 'draft',
    specialtyRestrictions: [],
    isNew: true,
  });

  const [newTag, setNewTag] = useState('');
  const [newQuestion, setNewQuestion] = useState<{
    question: string;
    type: 'text' | 'multiple_choice' | 'scale';
    options: string[];
    required: boolean;
  }>({
    question: '',
    type: 'multiple_choice',
    options: [''],
    required: true,
  });

  // Carregar conteúdo existente se estiver editando
  useEffect(() => {
    if (!id) return;

    const fetchContent = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/contents/${id}`);
        if (!response.ok) {
          throw new Error('Falha ao carregar conteúdo');
        }
        const data = await response.json();
        setFormData({
          id: data.id,
          title: data.title ?? '',
          description: data.description ?? '',
          type: data.type ?? 'article',
          category: data.category?.name ?? '',
          content: data.content ?? '',
          metadata: data.metadata ?? { duration: 5, difficulty: 'beginner', tags: [] },
          accessLevel: data.access_level ?? 'public',
          allowedRoles: formData.allowedRoles,
          createdByName: user?.name || '',
          status: data.status ?? 'draft',
          specialtyRestrictions: [],
          isNew: false,
        });
      } catch (error) {
        console.error('Erro ao carregar conteúdo:', error);
        toast.error('Não foi possível carregar o conteúdo');
        // Fallback para mock apenas em desenvolvimento se necessário
        // const mockContent = { ... }
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id, user?.id, user?.name]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMetadataChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value
      }
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.metadata.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          tags: [...(prev.metadata.tags || []), newTag.trim()]
        }
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        tags: prev.metadata.tags?.filter(tag => tag !== tagToRemove) || []
      }
    }));
  };

  const handleAddQuestion = () => {
    if (!newQuestion.question.trim()) return;

    const questionToAdd = {
      id: Date.now().toString(),
      question: newQuestion.question.trim(),
      type: newQuestion.type,
      options: newQuestion.type !== 'text' ? newQuestion.options.filter(opt => opt.trim()) : [],
      required: newQuestion.required
    };

    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        questions: [...(prev.metadata.questions || []), questionToAdd]
      }
    }));

    // Reset form
    setNewQuestion({
      question: '',
      type: 'multiple_choice',
      options: [''],
      required: true,
    });
  };

  const handleAddOption = () => {
    setNewQuestion(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...newQuestion.options];
    newOptions[index] = value;
    setNewQuestion(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = newQuestion.options.filter((_, i) => i !== index);
    setNewQuestion(prev => ({
      ...prev,
      options: newOptions.length ? newOptions : ['']
    }));
  };

  const handleRemoveQuestion = (questionId: string) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        questions: prev.metadata.questions?.filter(q => q.id !== questionId) || []
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setSaving(true);
      
      // Aqui viria a chamada para a API real
      // if (formData.isNew) {
      //   await api.post('/contents', formData);
      //   toast.success('Conteúdo criado com sucesso!');
      // } else {
      //   await api.put(`/contents/${id}`, formData);
      //   toast.success('Conteúdo atualizado com sucesso!');
      // }
      
      // Simulando sucesso
      console.log('Dados do formulário:', formData);
      toast.success(formData.isNew ? 'Conteúdo criado com sucesso!' : 'Conteúdo atualizado com sucesso!');
      
      // Redirecionar após salvar
      setTimeout(() => {
        navigate('/conteudos');
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao salvar conteúdo:', error);
      toast.error('Ocorreu um erro ao salvar o conteúdo');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (window.confirm('Tem certeza que deseja sair? As alterações não salvas serão perdidas.')) {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={handleBack}
          className="px-0 hover:bg-transparent"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {formData.isNew ? 'Novo Conteúdo' : `Editando: ${formData.title}`}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList>
              <TabsTrigger value="content">Conteúdo</TabsTrigger>
              <TabsTrigger value="questions">Questionário</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select 
                value={formData.status}
                onValueChange={(value: 'draft' | 'published' | 'archived') => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
              
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </div>

          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Digite o título do conteúdo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Uma breve descrição do conteúdo"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Conteúdo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: Content['type']) => 
                        setFormData(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="article">Artigo</SelectItem>
                        <SelectItem value="video">Vídeo</SelectItem>
                        <SelectItem value="infographic">Infográfico</SelectItem>
                        <SelectItem value="document">Documento</SelectItem>
                        <SelectItem value="link">Link</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Input
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      placeholder="Ex: Saúde Mental, Bem-estar"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Tags</Label>
                    <span className="text-xs text-muted-foreground">
                      {formData.metadata.tags?.length || 0} tags adicionadas
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      placeholder="Adicionar tag"
                      className="flex-1"
                    />
                    <Button type="button" onClick={handleAddTag} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.metadata.tags && formData.metadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.metadata.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conteúdo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="content">Conteúdo *</Label>
                  <Textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    placeholder="Digite o conteúdo aqui..."
                    className="min-h-[300px] font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Dica: Use HTML para formatar o conteúdo. Ex: &lt;h2&gt;Título&lt;/h2&gt; para títulos.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Questionário</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Adicione perguntas para avaliar o entendimento do conteúdo.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {formData.metadata.questions && formData.metadata.questions.length > 0 ? (
                  <div className="space-y-4">
                    {formData.metadata.questions.map((q) => (
                      <div key={q.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">{q.question}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRemoveQuestion(q.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Tipo: {q.type === 'multiple_choice' ? 'Múltipla Escolha' : 'Texto Livre'}
                          {q.required && ' • Obrigatória'}
                        </div>
                        {q.options && q.options.length > 0 && (
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            {q.options.map((opt, idx) => (
                              <li key={idx}>{opt}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma pergunta adicionada ainda.
                  </div>
                )}

                <div className="border-t pt-6 space-y-4">
                  <h4 className="font-medium">Adicionar Nova Pergunta</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="question-text">Pergunta *</Label>
                    <Input
                      id="question-text"
                      value={newQuestion.question}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
                      placeholder="Digite a pergunta"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="question-type">Tipo de Resposta</Label>
                      <Select
                        value={newQuestion.type}
                        onValueChange={(value: 'multiple_choice' | 'text' | 'scale') =>
                          setNewQuestion(prev => ({
                            ...prev,
                            type: value,
                            options: value === 'text' ? [] : [''],
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
                          <SelectItem value="scale">Escala</SelectItem>
                          <SelectItem value="text">Texto Livre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-6">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="question-required"
                          checked={newQuestion.required}
                          onCheckedChange={(checked) =>
                            setNewQuestion(prev => ({ ...prev, required: checked }))
                          }
                        />
                        <Label htmlFor="question-required">Obrigatória</Label>
                      </div>
                    </div>
                  </div>

                  {newQuestion.type !== 'text' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Opções de Resposta</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleAddOption}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar Opção
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {newQuestion.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              value={option}
                              onChange={(e) => handleOptionChange(index, e.target.value)}
                              placeholder={`Opção ${index + 1}`}
                            />
                            {newQuestion.options.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => handleRemoveOption(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={handleAddQuestion}
                      disabled={!newQuestion.question.trim() || (newQuestion.type !== 'text' && newQuestion.options.some(opt => !opt.trim()))}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Pergunta
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Acesso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="access-level">Nível de Acesso</Label>
                  <Select
                    value={formData.accessLevel}
                    onValueChange={(value: 'public' | 'restricted' | 'private') =>
                      setFormData(prev => ({ ...prev, accessLevel: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o nível de acesso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Público - Visível para todos</SelectItem>
                      <SelectItem value="restricted">Restrito - Apenas usuários autorizados</SelectItem>
                      <SelectItem value="private">Privado - Apenas administradores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.accessLevel === 'restricted' && (
                  <div className="space-y-2">
                    <Label>Permitir Acesso para</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {['admin', 'doctor', 'patient'].map((role) => (
                        <div key={role} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`role-${role}`}
                            checked={formData.allowedRoles?.includes(role as UserRole) || false}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                allowedRoles: isChecked
                                  ? [...new Set([...(prev.allowedRoles || []), role as UserRole])]
                                  : (prev.allowedRoles || []).filter(r => r !== role)
                              }));
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor={`role-${role}`} className="text-sm font-medium capitalize">
                            {role === 'admin' ? 'Administradores' : 
                             role === 'doctor' ? 'Médicos' : 'Pacientes'}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Metadados Adicionais</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                      {showAdvanced ? 'Menos opções' : 'Mais opções'}
                    </Button>
                  </div>
                  
                  {showAdvanced && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                      <div className="space-y-2">
                        <Label htmlFor="difficulty">Dificuldade</Label>
                        <Select
                          value={formData.metadata.difficulty}
                          onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') =>
                            handleMetadataChange('difficulty', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a dificuldade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Iniciante</SelectItem>
                            <SelectItem value="intermediate">Intermediário</SelectItem>
                            <SelectItem value="advanced">Avançado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="duration">Tempo Estimado (minutos)</Label>
                        <Input
                          id="duration"
                          type="number"
                          min="1"
                          value={formData.metadata.duration}
                          onChange={(e) =>
                            handleMetadataChange('duration', parseInt(e.target.value) || 5)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>URLs Relacionadas</Label>
                        <div className="space-y-2">
                          <div className="flex space-x-2">
                            <Input
                              placeholder="Título do link"
                              className="flex-1"
                            />
                            <Input
                              placeholder="https://exemplo.com"
                              className="flex-1"
                            />
                            <Button type="button" variant="outline" size="icon">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Adicione links para recursos adicionais.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações de Publicação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="status-draft"
                        name="status"
                        checked={formData.status === 'draft'}
                        onChange={() => setFormData(prev => ({ ...prev, status: 'draft' }))}
                        className="h-4 w-4 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="status-draft" className="font-normal">Rascunho</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="status-published"
                        name="status"
                        checked={formData.status === 'published'}
                        onChange={() => setFormData(prev => ({ ...prev, status: 'published' }))}
                        className="h-4 w-4 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="status-published" className="font-normal">Publicado</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="status-archived"
                        name="status"
                        checked={formData.status === 'archived'}
                        onChange={() => setFormData(prev => ({ ...prev, status: 'archived' }))}
                        className="h-4 w-4 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="status-archived" className="font-normal">Arquivado</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Data de Publicação</Label>
                  <Input
                    type="datetime-local"
                    value={formData.status === 'published' 
                      ? format(new Date(), "yyyy-MM-dd'T'HH:mm") 
                      : ''}
                    disabled={formData.status !== 'published'}
                  />
                  <p className="text-xs text-muted-foreground">
                    Deixe em branco para publicar imediatamente.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>

      <CardFooter className="flex justify-between border-t pt-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleBack}
          disabled={saving}
        >
          Cancelar
        </Button>
        <div className="space-x-2">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => {
              // Simular salvamento como rascunho
              setFormData(prev => ({ ...prev, status: 'draft' }));
              toast.success('Rascunho salvo com sucesso!');
            }}
            disabled={saving}
          >
            Salvar como Rascunho
          </Button>
          <Button 
            type="submit" 
            form="content-form"
            disabled={saving}
            onClick={(e) => {
              e.preventDefault();
              setFormData(prev => ({ ...prev, status: 'published' }));
              handleSubmit(e);
            }}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publicando...
              </>
            ) : (
              'Publicar Agora'
            )}
          </Button>
        </div>
      </CardFooter>
    </div>
  );
};

export default ContentEditor;
