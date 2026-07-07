import { api } from './client';
import type { MessagesResponse, SendMessageResponse } from './types';

export const messagesApi = {
  getMessages: async (matchId: string): Promise<MessagesResponse> => {
    const { data } = await api.get<MessagesResponse>(`/matches/${matchId}/messages`);
    return data;
  },

  sendMessage: async (
    matchId: string,
    content: string,
    type: 'TEXT' | 'VOICE' | 'GIFT' | 'SYSTEM' = 'TEXT',
  ): Promise<SendMessageResponse> => {
    const { data } = await api.post<SendMessageResponse>(`/matches/${matchId}/messages`, {
      content,
      type,
    });
    return data;
  },
};
