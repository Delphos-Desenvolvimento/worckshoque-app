import { useEffect, useState } from 'react';
import { getAgentContext, AgentContext } from './agent-api';
import { useAgentChatStore } from './useAgentChatStore';
import PageHeader from '@/components/common/PageHeader';
import { MessageSquare, Rocket, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export default function ChatPage() {
  const [context, setContext] = useState<AgentContext | null>(null);
  const { messages } = useAgentChatStore();
  const { openChat, addAgentResponse } = useAgentChatStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const isAdminOrMaster = user?.role === 'admin' || user?.role === 'master';
  const [injectedFromQuery, setInjectedFromQuery] = useState(false);

  useEffect(() => {
    getAgentContext().then(setContext).catch(() => {});
  }, []);

  useEffect(() => {
    if (injectedFromQuery) return;
    const agentParam = searchParams.get('agent');
    if (!agentParam) return;
    try {
      const decoded = decodeURIComponent(agentParam);
      const payload = JSON.parse(decoded);
      addAgentResponse(payload);
      openChat();
      setInjectedFromQuery(true);
    } catch {
      // ignore parse errors
    }
  }, [searchParams, injectedFromQuery, addAgentResponse, openChat]);

  return (
    <div className="px-6">
      <PageHeader
        title="Agente WorkChoque"
        description="Mentor e facilitador orientado por IA"
        icon={MessageSquare}
        badges={[
          { label: `Escopo: ${context?.scope ?? '...'}` },
          context?.user?.role ? { label: `Perfil: ${context.user.role}` } : undefined,
        ].filter((b): b is { label: string } => Boolean(b))}
        actions={[
          { label: 'Abrir Chat', icon: Rocket, onClick: () => openChat() },
          { label: 'Explorar Recursos', icon: Sparkles, onClick: () => navigate('/conteudos') },
        ]}
      />

      <div className="container max-w-7xl mx-auto mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mensagens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messages.length}</div>
            <p className="text-xs text-muted-foreground">Nesta sessão</p>
          </CardContent>
        </Card>
        {isAdminOrMaster && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Contextos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Array.isArray(context?.contextUsed) ? context.contextUsed.length : 0}</div>
              <p className="text-xs text-muted-foreground">Usados pelo agente</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="container max-w-7xl mx-auto mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={isAdminOrMaster ? "md:col-span-2" : "md:col-span-3"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Histórico Local</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 h-80 overflow-y-auto">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className="p-2 rounded border border-border bg-muted/30 text-foreground"
                >
                  {m.sender}: {typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {isAdminOrMaster && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Contexto Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto h-80 bg-muted p-3 rounded border border-border text-foreground">
                {JSON.stringify(context, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
