import { useEffect, useState } from 'react';
import { useAgentChatStore } from './useAgentChatStore';
import { getAgentContext, sendAgentMessage } from './agent-api';
import { MessageSquare, X, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ChatMessage, AgentResponsePayload } from './useAgentChatStore';

export default function AgentChatWidget() {
  const { open, openChat, closeChat, messages, addUserMessage, addAgentResponse } = useAgentChatStore();
  const [input, setInput] = useState('');
  const [context, setContext] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (open && !context) {
      getAgentContext().then(setContext).catch((e) => console.error(e));
    }
  }, [open, context]);

  const onSend = async () => {
    if (!input.trim()) return;
    addUserMessage(input);
    setLoading(true);
    try {
      const resp = await sendAgentMessage(input);
      addAgentResponse(resp);
    } finally {
      setLoading(false);
      setInput('');
    }
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
              <button key={i} className="px-2 py-1 bg-yellow-500 text-slate-900 rounded text-sm" onClick={() => navigate(a.route)}>
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
      <button
        onClick={open ? closeChat : openChat}
        className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-yellow-500 text-slate-900 shadow-lg"
        aria-label="Agente WorkChoque"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-96 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl flex flex-col">
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
              placeholder="Digite sua mensagem..."
              className="flex-1 px-2 py-1 rounded bg-slate-800 text-white outline-none"
            />
            <button onClick={onSend} disabled={loading} className="px-3 py-1 rounded bg-yellow-500 text-slate-900">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
