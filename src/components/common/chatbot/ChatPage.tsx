import { useEffect, useState, useRef } from 'react';
import { getAgentContext, AgentContext, isExternalUrl, resolveAgentActionRoute, sendAgentMessage } from './agent-api';
import { useAgentChatStore, AgentResponsePayload, ChatMessage } from './useAgentChatStore';
import PageHeader from '@/components/common/PageHeader';
import { MessageSquare, Rocket, Sparkles, Send, Bot, User, Loader2, BrainCircuit, Target, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

type AgentGoal = {
  id: string;
  title: string;
  status?: string;
};

type AgentDiagnostic = {
  questionnaire?: {
    title?: string;
  };
  status?: string;
};

type AgentActionPlan = {
  title?: string;
  progress?: number;
};

export default function ChatPage() {
  const [context, setContext] = useState<AgentContext | null>(null);
  const { messages, addUserMessage, addAgentResponse } = useAgentChatStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const [injectedFromQuery, setInjectedFromQuery] = useState(false);

  const activeDiagnostic = (context?.diagnostic ?? undefined) as
    | AgentDiagnostic
    | undefined;
  const activeActionPlan = (context?.actionPlan ?? undefined) as
    | AgentActionPlan
    | undefined;
  const goals = (context?.goals ?? undefined) as AgentGoal[] | undefined;
  const userInitials =
    user?.name
      ?.split(' ')
      .filter((p) => p.length > 0)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';

  // Load context on mount
  useEffect(() => {
    getAgentContext().then(setContext).catch(() => {});
  }, []);

  // Handle injected messages from query params (e.g. from other pages)
  useEffect(() => {
    if (injectedFromQuery) return;
    const agentParam = searchParams.get('agent');
    if (!agentParam) return;
    try {
      const decoded = decodeURIComponent(agentParam);
      const payload = JSON.parse(decoded);
      addAgentResponse(payload);
      setInjectedFromQuery(true);
    } catch {
      // ignore parse errors
    }
  }, [searchParams, injectedFromQuery, addAgentResponse]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const sendText = async (text: string) => {
    const userMsg = text.trim();
    if (!userMsg || loading) return;
    addUserMessage(userMsg);
    setLoading(true);

    try {
      const response = await sendAgentMessage(userMsg);
      addAgentResponse(response);
    } catch (error) {
      console.error('Failed to send message:', error);
      addAgentResponse({
        direct_answer: 'Desculpe, tive um problema ao processar sua mensagem.',
        simple_explanation: 'Por favor, verifique sua conexão ou tente novamente mais tarde.',
        motivation: 'Estou aqui para ajudar assim que possível.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput('');
    await sendText(userMsg);
  };

  const handleActionClick = (action: unknown) => {
    const target = resolveAgentActionRoute(action as Record<string, unknown>);
    if (target && isExternalUrl(target)) {
      window.open(target, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(target);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessageContent = (content: string | AgentResponsePayload) => {
    if (typeof content === 'string') {
      return <p className="text-sm leading-relaxed">{content}</p>;
    }

    return (
      <div className="space-y-3">
        <div className="font-medium text-sm">{content.direct_answer}</div>
        
        {content.simple_explanation && (
          <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded border border-border/50">
            {content.simple_explanation}
          </div>
        )}

        {content.plan_connection && (
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-500 font-medium">
            <Target className="h-3 w-3" />
            {content.plan_connection}
          </div>
        )}

        {content.recommended_actions && content.recommended_actions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {content.recommended_actions.map((action, idx) => (
              <Button 
                key={idx} 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs border-primary/30 hover:bg-primary/10 hover:text-primary"
                onClick={() => handleActionClick(action)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {(content.motivation || content.follow_up_question) && (
          <div className="pt-2 border-t border-border/30 text-xs text-muted-foreground italic">
            {content.motivation && <span>{content.motivation} </span>}
            {content.follow_up_question && <span className="font-medium not-italic block mt-1">{content.follow_up_question}</span>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl h-[calc(100vh-4rem)] flex flex-col">
      <PageHeader
        title="Agente WorkChoque"
        description="Seu consultor de desenvolvimento organizacional 24/7"
        icon={Bot}
        badges={[
          { label: 'IA Ativa', variant: 'success' },
          {
            label:
              context?.scope === 'company'
                ? 'Escopo Corporativo'
                : 'Escopo Pessoal',
            variant: 'secondary',
          },
        ]}
      />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 min-h-0">
        {/* Chat Area */}
        <Card className="lg:col-span-2 flex flex-col h-full shadow-md border-muted">
          <CardHeader className="py-3 px-4 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary"><Bot className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">Chat com Agente</CardTitle>
                  <CardDescription className="text-xs">
                    {loading ? 'Digitando...' : 'Online'}
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/conteudos')} title="Explorar Conteúdos">
                <Sparkles className="h-4 w-4 text-amber-500" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 overflow-hidden relative">
            <ScrollArea className="h-full px-4 py-4">
              <div className="space-y-6 pb-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-10 px-6">
                    <div className="bg-primary/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bot className="h-8 w-8 text-primary/60" />
                    </div>
                    <h3 className="font-medium text-foreground mb-2">Como posso ajudar hoje?</h3>
                    <p className="text-sm max-w-sm mx-auto mb-6">
                      Posso analisar seus diagnósticos, sugerir ações para seus planos ou recomendar conteúdos educativos.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setInput('Analise meu diagnóstico atual'); }}>
                        Analise meu diagnóstico
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setInput('Como melhorar minha liderança?'); }}>
                        Dicas de liderança
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setInput('Quais são minhas próximas tarefas?'); }}>
                        Minhas tarefas
                      </Button>
                    </div>
                  </div>
                )}

                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender === 'agent' && (
                      <Avatar className="h-8 w-8 mt-1 border border-primary/20 shadow-sm">
                        <AvatarFallback className="bg-primary/10 text-primary"><Bot className="h-4 w-4" /></AvatarFallback>
                        <AvatarImage src="/bot-avatar.png" />
                      </Avatar>
                    )}
                    
                    <div
                      className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-none'
                          : 'bg-card border border-border rounded-tl-none'
                      }`}
                    >
                      {renderMessageContent(msg.content)}
                    </div>

                    {msg.sender === 'user' && (
                      <Avatar className="h-8 w-8 mt-1 border border-border shadow-sm">
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          {userInitials || <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                
                {loading && (
                  <div className="flex gap-3 justify-start">
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback className="bg-primary/10"><Bot className="h-4 w-4 text-primary" /></AvatarFallback>
                    </Avatar>
                    <div className="bg-card border border-border rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground ml-2">Analisando...</span>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="p-3 border-t bg-background">
            <div className="relative w-full flex gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="flex-1 pr-10"
              />
              <Button 
                onClick={handleSend} 
                disabled={loading || !input.trim()} 
                size="icon"
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Context Sidebar */}
        <div className="hidden lg:flex flex-col gap-4 overflow-y-auto pr-1">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-primary" />
                Contexto Ativo
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Diagnóstico</span>
                {activeDiagnostic ? (
                  <div className="mt-1 p-2 bg-muted/50 rounded border text-xs">
                    <div className="font-medium">{activeDiagnostic.questionnaire?.title || 'Diagnóstico Personalizado'}</div>
                    <div className="text-muted-foreground mt-1">Status: {activeDiagnostic.status}</div>
                  </div>
                ) : (
                  <div className="mt-1 text-muted-foreground text-xs italic">Nenhum diagnóstico recente</div>
                )}
              </div>

              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Plano de Ação</span>
                {activeActionPlan ? (
                  <div className="mt-1 p-2 bg-muted/50 rounded border text-xs">
                    <div className="font-medium">{activeActionPlan.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1.5 flex-1 bg-muted-foreground/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full" 
                          style={{ width: `${activeActionPlan.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-xs">{activeActionPlan.progress || 0}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 text-muted-foreground text-xs italic">Nenhum plano ativo</div>
                )}
              </div>

              {goals && goals.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Metas Pendentes</span>
                  <ul className="mt-1 space-y-1">
                    {goals.slice(0, 3).map((goal) => (
                      <li key={goal.id} className="text-xs flex items-start gap-2">
                        <div className={`mt-0.5 h-1.5 w-1.5 rounded-full shrink-0 ${
                          goal.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'
                        }`} />
                        <span className="line-clamp-1">{goal.title}</span>
                      </li>
                    ))}
                    {goals.length > 3 && (
                      <li className="text-xs text-muted-foreground pl-3.5">+ {goals.length - 3} outras</li>
                    )}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Sugestões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {context?.diagnostic ? (
                  <>
                    <Button variant="ghost" className="w-full justify-start text-xs h-auto py-2 px-2 text-left whitespace-normal" onClick={() => setInput("Explique melhor o resultado do meu diagnóstico")}>
                      🔍 Explicar resultado do diagnóstico
                    </Button>
                    <Separator />
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="w-full justify-start text-xs h-auto py-2 px-2 text-left whitespace-normal" onClick={() => navigate('/diagnostico')}>
                      📝 Iniciar um Diagnóstico
                    </Button>
                    <Separator />
                  </>
                )}

                {context?.actionPlan ? (
                  <>
                    <Button variant="ghost" className="w-full justify-start text-xs h-auto py-2 px-2 text-left whitespace-normal" onClick={() => setInput("Como priorizar minhas metas atuais?")}>
                      🎯 Ajudar a priorizar minhas metas
                    </Button>
                    <Separator />
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="w-full justify-start text-xs h-auto py-2 px-2 text-left whitespace-normal" onClick={() => navigate('/planos-acao')}>
                      🚀 Criar Plano de Ação
                    </Button>
                    <Separator />
                  </>
                )}

                <Button variant="ghost" className="w-full justify-start text-xs h-auto py-2 px-2 text-left whitespace-normal" onClick={() => setInput("Quais conteúdos você recomenda para mim?")}>
                  📚 Recomendar conteúdos baseados no meu perfil
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
