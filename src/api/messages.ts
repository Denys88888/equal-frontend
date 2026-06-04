import type { MessagesResponse, SendMessageResponse } from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function fetchWithFallback<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export const messagesApi = {
  getMessages: async (matchId: string): Promise<MessagesResponse> => {
    const url = `${API_BASE}/matches/${matchId}/messages`;
    const empty: MessagesResponse = {
      messages: [],
      hasMore: false,
      matchName: '',
      matchAvatar: '',
      isOnline: false,
      isVerified: false,
      sharedInterests: [],
      icebreakers: [],
    };
    return fetchWithFallback(url, empty);
  },

  sendMessage: async (matchId: string, content: string, type: 'TEXT' | 'VOICE' | 'GIFT' | 'SYSTEM' = 'TEXT'): Promise<SendMessageResponse> => {
    const res = await fetch(`${API_BASE}/matches/${matchId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, type }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as SendMessageResponse;
  },
};
