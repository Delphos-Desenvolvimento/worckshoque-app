import { create } from 'zustand';

export type AgentAction = { route: string; label: string };
export type AgentResponsePayload = {
  direct_answer?: string;
  simple_explanation?: string;
  plan_connection?: string;
  recommended_actions?: AgentAction[];
  motivation?: string;
  follow_up_question?: string;
};
export type ChatMessage = { sender: 'user' | 'agent'; content: string | AgentResponsePayload; at: string };

interface AgentChatState {
  open: boolean;
  loading: boolean;
  messages: ChatMessage[];
  openChat: () => void;
  closeChat: () => void;
  addUserMessage: (text: string) => void;
  addAgentResponse: (resp: string | AgentResponsePayload) => void;
}

export const useAgentChatStore = create<AgentChatState>((set) => ({
  open: false,
  loading: false,
  messages: [],
  openChat: () => set({ open: true }),
  closeChat: () => set({ open: false }),
  addUserMessage: (text) =>
    set((s) => ({ messages: [...s.messages, { sender: 'user', content: text, at: new Date().toISOString() }] })),
  addAgentResponse: (resp) =>
    set((s) => ({ messages: [...s.messages, { sender: 'agent', content: resp, at: new Date().toISOString() }] })),
}));
