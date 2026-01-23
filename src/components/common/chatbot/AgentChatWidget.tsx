import { useEffect, useState } from 'react';
import { useAgentChatStore } from './useAgentChatStore';
import { getAgentContext, isExternalUrl, resolveAgentActionRoute, sendAgentMessage } from './agent-api';
import { MessageSquare, X, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ChatMessage, AgentResponsePayload, AgentAction } from './useAgentChatStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function AgentChatWidget() {
  const { open, openChat, closeChat, messages, addUserMessage, addAgentResponse } = useAgentChatStore();
  const [input, setInput] = useState('');
  const [context, setContext] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (open && !context) {
      getAgentContext().then(setContext).catch((e) => console.error(e));
    }
  }, [open, context]);

  useEffect(() => {
    if (open) {
      setLastSeenCount(messages.length);
    }
  }, [open, messages.length]);

  const sendText = async (text: string) => {
    const message = text.trim();
    if (!message || loading) return;
    addUserMessage(message);
    setLoading(true);
    try {
      if (!token) {
        addAgentResponse({
          direct_answer: 'Sua sessão não está autenticada. Faça login novamente.',
          simple_explanation: 'Não foi possível validar suas credenciais para enviar a mensagem.',
          recommended_actions: [{ label: 'Ir para Login', route: '/login' }],
          motivation: 'Após autenticar, retome a conversa com o agente.',
          follow_up_question: 'Deseja ir para a página de login?',
        });
      } else {
        const resp = await sendAgentMessage(message);
        addAgentResponse(resp);
      }
    } catch (e) {
      addAgentResponse({
        direct_answer: 'Falha ao enviar mensagem ao agente.',
        simple_explanation: 'Verifique sua conexão e tente novamente.',
        recommended_actions: [
          { label: 'Abrir Plano de Ação', route: '/planos-acao' },
          { label: 'Ver Conteúdos', route: '/conteudos' },
        ],
        motivation: 'Pequenos passos constantes geram resultado.',
        follow_up_question: 'Deseja focar em metas ou em conteúdos agora?',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: AgentAction) => {
    const target = resolveAgentActionRoute(action);

    if (target && isExternalUrl(target)) {
      window.open(target, '_blank', 'noopener,noreferrer');
      return;
    }

    navigate(target);
    closeChat();
  };

  const onSend = async () => {
    const message = input.trim();
    if (!message || loading) return;
    setInput('');
    await sendText(message);
  };

  const renderMessage = (m: ChatMessage, idx: number) => {
    if (m.sender === 'agent' && typeof m.content === 'object') {
      const r = m.content as AgentResponsePayload;
      return (
        <div key={idx} className="p-2 rounded bg-slate-800 text-slate-200">
          <div className="font-semibold mb-1">{r.direct_answer}</div>
          <div className="text-sm mb-2">{r.simple_explanation}</div>
          {r.plan_connection && <div className="text-xs mb-2">{r.plan_connection}</div>}
          <div className="flex gap-2 flex-wrap">
            {r.recommended_actions?.map((a, i: number) => (
              <button
                key={i}
                type="button"
                className="px-2 py-1 bg-yellow-500 text-slate-900 rounded text-sm"
                onClick={() => handleActionClick(a)}
              >
                {a.label}
              </button>
            ))}
          </div>
          <div className="text-xs mt-2 italic">{r.motivation}</div>
          <div className="text-xs mt-1">{r.follow_up_question}</div>
        </div>
      );
    }
    return (
      <div key={idx} className={`p-2 rounded ${m.sender === 'user' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-200'}`}>
        {typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}
      </div>
    );
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            onClick={open ? closeChat : openChat}
            size="icon"
            className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
            aria-label={open ? 'Fechar agente' : 'Abrir agente'}
            aria-expanded={open}
            aria-controls="agent-chat-panel"
          >
            <span className="relative inline-flex items-center justify-center">
              {open ? (
                <X className="h-5 w-5" />
              ) : (
                <MessageSquare className="h-5 w-5" />
              )}
              {!open && messages.length > lastSeenCount ? (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-destructive" />
              ) : null}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          {open ? 'Fechar IA' : 'Abrir IA'}
        </TooltipContent>
      </Tooltip>

      {open && (
        <div
          id="agent-chat-panel"
          className="fixed bottom-20 right-6 z-50 w-[min(24rem,calc(100vw-3rem))] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl flex flex-col"
        >
          <div className="flex items-center justify-between p-3 border-b border-slate-700">
            <div className="font-semibold text-white">Agente WorkChoque</div>
            <button onClick={closeChat} className="text-slate-300 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3 space-y-2 h-80 overflow-y-auto">
            {messages.map(renderMessage)}
          </div>
          <div className="p-3 flex gap-2 border-t border-slate-700">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSend();
                }
              }}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-2 py-1 rounded bg-slate-800 text-white outline-none"
            />
            <button
              onClick={onSend}
              disabled={loading || !input.trim()}
              className="px-3 py-1 rounded bg-yellow-500 text-slate-900"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
