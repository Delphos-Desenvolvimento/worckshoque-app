import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Content } from './types/content.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Edit, Star, Share2, Download, Bookmark, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

export const ContentViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        if (!id) return;

        const response = await api.get(`/contents/${id}`);
        const data = await response.json();
        
        // Mapear dados do backend para o formato do frontend
        const mappedContent: Content = {
          id: data.id,
          title: data.title,
          description: data.description,
          type: data.type,
          category: data.category?.name || 'Geral',
          content: data.content,
          metadata: data.metadata || {},
          accessLevel: data.access_level,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          createdBy: data.created_by,
          status: data.status,
          views: data.views || 0,
          isFavorite: data.is_featured || false, // Usando is_featured como favorito por enquanto
          // Campos opcionais
          tags: data.metadata?.tags || [],
          progress: 0 // Progresso ainda não implementado no backend
        };
        
        setContent(mappedContent);
        setIsFavorite(mappedContent.isFavorite || false);
      } catch (error) {
        console.error('Erro ao carregar conteúdo:', error);
        toast.error('Conteúdo não encontrado ou indisponível.');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    if (content) {
      navigate(`/conteudos/${content.id}/editar`);
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Aqui viria a chamada para a API para atualizar o favorito
    // await api.patch(`/api/contents/${content.id}/favorite`, { isFavorite: !isFavorite });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Conteúdo não encontrado</h2>
        <p className="text-muted-foreground mb-4">O conteúdo solicitado não existe ou você não tem permissão para acessá-lo.</p>
        <Button onClick={handleBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para a lista
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button 
        variant="ghost" 
        onClick={handleBack}
        className="px-0 hover:bg-transparent"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">
                  {content.type === 'article' && 'Artigo'}
                  {content.type === 'video' && 'Vídeo'}
                  {content.type === 'exercise' && 'Exercício'}
                  {content.type === 'checklist' && 'Checklist'}
                  {content.type === 'questionnaire' && 'Questionário'}
                  {content.type === 'action_plan' && 'Plano de Ação'}
                </Badge>
                <Badge variant="secondary">
                  {content.metadata.difficulty === 'beginner' && 'Iniciante'}
                  {content.metadata.difficulty === 'intermediate' && 'Intermediário'}
                  {content.metadata.difficulty === 'advanced' && 'Avançado'}
                </Badge>
                {content.metadata.duration && (
                  <span className="text-sm text-muted-foreground">
                    {content.metadata.duration} min de leitura
                  </span>
                )}
              </div>
              <CardTitle className="text-2xl md:text-3xl">{content.title}</CardTitle>
              <p className="text-muted-foreground mt-2">
                Por {content.createdByName} • {format(new Date(content.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={toggleFavorite}
                aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              </Button>
              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
              {user?.role === 'admin' && (
                <Button onClick={handleEdit} variant="outline" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-2">
            {content.metadata.tags?.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardHeader>
        
        <Separator />
        
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md mb-6">
              <TabsTrigger value="content">Conteúdo</TabsTrigger>
              <TabsTrigger value="questions" disabled={!content.metadata.questions?.length}>
                Questionário
              </TabsTrigger>
              <TabsTrigger value="resources">Recursos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content">
              <div 
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: content.content }} 
              />
            </TabsContent>
            
            <TabsContent value="questions">
              {content.metadata.questions?.length ? (
                <div className="space-y-6">
                  {content.metadata.questions.map((question) => (
                    <div key={question.id} className="space-y-2 p-4 border rounded-lg">
                      <h3 className="font-medium">{question.question}</h3>
                      {question.type === 'multiple_choice' && question.options && (
                        <div className="space-y-2 mt-2">
                          {question.options.map((option, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <input 
                                type="radio" 
                                id={`${question.id}-${index}`}
                                name={question.id}
                                className="h-4 w-4 text-primary"
                                required={question.required}
                              />
                              <label htmlFor={`${question.id}-${index}`} className="text-sm">
                                {option}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                      {question.type === 'scale' && question.options && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Pouco</span>
                            <span>Muito</span>
                          </div>
                          <div className="flex gap-2">
                            {question.options.map((option) => (
                              <div key={option} className="flex flex-col items-center">
                                <input 
                                  type="radio" 
                                  id={`${question.id}-${option}`}
                                  name={question.id}
                                  value={option}
                                  className="h-4 w-4 text-primary"
                                  required={question.required}
                                />
                                <label htmlFor={`${question.id}-${option}`} className="text-xs mt-1">
                                  {option}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {question.type === 'text' && (
                        <textarea 
                          className="w-full p-2 border rounded-md text-sm min-h-[80px]"
                          placeholder="Sua resposta..."
                          required={question.required}
                        />
                      )}
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <Button>Enviar Respostas</Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum questionário disponível para este conteúdo.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="resources">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Materiais para download</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Guia Completo em PDF
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Checklist de Ações
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Links úteis</h3>
                  <div className="space-y-2">
                    <a 
                      href="#" 
                      className="flex items-center text-sm text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Site Oficial de Saúde Mental
                    </a>
                    <a 
                      href="#" 
                      className="flex items-center text-sm text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Vídeo Explicativo
                    </a>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <Separator />
        
        <CardFooter className="py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {content.views} visualizações • Última atualização: {format(new Date(content.updatedAt), 'dd/MM/yyyy', { locale: ptBR })}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Bookmark className="h-4 w-4 mr-2" />
              Salvar para ler depois
            </Button>
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Deixar um comentário
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ContentViewer;
