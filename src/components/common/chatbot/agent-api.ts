import { api } from '@/lib/api';

export type AgentContext = {
  scope?: string;
  user?: { role?: string } | null;
  contextUsed?: unknown[];
} & Record<string, unknown>;

export async function getAgentContext(): Promise<AgentContext> {
  const res = await api.get('/api/agent/context');
  if (!res.ok) throw new Error('Falha ao carregar contexto do agente');
  return (await res.json()) as AgentContext;
}

export async function sendAgentMessage(message: string) {
  console.log('Sending agent message:', message);
  try {
    const res = await api.post('/api/agent/chat', { message });
    if (!res.ok) {
      console.error('Agent chat error:', res.status, res.statusText);
      const errBody = await res.text();
      console.error('Error body:', errBody);
      throw new Error(`Falha ao enviar mensagem ao agente: ${res.status} ${res.statusText}`);
    }
    return res.json();
  } catch (err) {
    console.error('Agent chat exception:', err);
    throw err;
  }
}
