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
  const res = await api.post('/api/agent/chat', { message });
  if (!res.ok) throw new Error('Falha ao enviar mensagem ao agente');
  return res.json();
}
