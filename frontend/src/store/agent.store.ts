import { create } from 'zustand';
import api from '../lib/api';

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  type: string;
  title: string | null;
  language: string;
  is_active: boolean;
  messages: AgentMessage[];
  updated_at: string;
}

interface AgentState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  isStreaming: boolean;
  streamingText: string;
  error: string | null;

  loadConversations: () => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  startConversation: (type: string) => Promise<void>;
  sendMessage: (message: string, locale: string) => Promise<void>;
  sendMessageStream: (message: string, locale: string) => Promise<void>;
  clearError: () => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  isStreaming: false,
  streamingText: '',
  error: null,

  clearError: () => set({ error: null }),

  async loadConversations() {
    const { data } = await api.get<{ data: Conversation[] }>('/agent/conversations');
    set({ conversations: data.data });
  },

  async loadConversation(id) {
    const { data } = await api.get<{ data: Conversation }>(`/agent/conversations/${id}`);
    set({ activeConversation: data.data });
  },

  async startConversation(type) {
    set({ activeConversation: null });
    const { data } = await api.post<{ data: { conversationId: string; reply: string } }>(
      '/agent/chat',
      {
        message: type === 'onboarding_client'
          ? 'Hola, quiero empezar'
          : type === 'onboarding_creator'
            ? 'Hola, soy creador de contenido'
            : 'Hola',
        type,
        locale: navigator.language.split('-')[0] ?? 'es',
      },
    );
    await get().loadConversation(data.data.conversationId);
  },

  async sendMessage(message, locale) {
    const conv = get().activeConversation;
    if (!conv) return;

    const userMsg: AgentMessage = { role: 'user', content: message, timestamp: new Date().toISOString() };
    set((s) => ({
      activeConversation: s.activeConversation
        ? { ...s.activeConversation, messages: [...s.activeConversation.messages, userMsg] }
        : null,
    }));

    try {
      const { data } = await api.post<{ data: { reply: string; conversationId: string } }>('/agent/chat', {
        message,
        conversationId: conv.id,
        locale,
      });

      const assistantMsg: AgentMessage = {
        role: 'assistant',
        content: data.data.reply,
        timestamp: new Date().toISOString(),
      };
      set((s) => ({
        activeConversation: s.activeConversation
          ? { ...s.activeConversation, messages: [...s.activeConversation.messages, assistantMsg] }
          : null,
      }));
    } catch {
      set({ error: 'Error al conectar con el agente IA' });
    }
  },

  async sendMessageStream(message, locale) {
    const conv = get().activeConversation;
    if (!conv) return;

    const userMsg: AgentMessage = { role: 'user', content: message, timestamp: new Date().toISOString() };
    set((s) => ({
      isStreaming: true,
      streamingText: '',
      activeConversation: s.activeConversation
        ? { ...s.activeConversation, messages: [...s.activeConversation.messages, userMsg] }
        : null,
    }));

    try {
      const response = await fetch(
        `${process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000/api/v1'}/agent/chat/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}`,
          },
          body: JSON.stringify({ message, conversationId: conv.id, locale }),
        },
      );

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No stream');

      const decoder = new TextDecoder();
      let fullText = '';
      let convId = conv.id;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          const json = JSON.parse(line.slice(6)) as { text?: string; done?: boolean; conversationId?: string };
          if (json.conversationId) convId = json.conversationId;
          if (json.text) {
            fullText += json.text;
            set({ streamingText: fullText });
          }
          if (json.done) {
            const assistantMsg: AgentMessage = {
              role: 'assistant',
              content: fullText,
              timestamp: new Date().toISOString(),
            };
            set((s) => ({
              isStreaming: false,
              streamingText: '',
              activeConversation: s.activeConversation
                ? { ...s.activeConversation, messages: [...s.activeConversation.messages, assistantMsg], id: convId }
                : null,
            }));
          }
        }
      }
    } catch {
      set({ isStreaming: false, error: 'Error en el streaming del agente IA' });
    }
  },
}));
