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
    type: 'TEXT' | 'VOICE' | 'IMAGE' | 'GIFT' | 'SYSTEM' = 'TEXT',
    giftType?: string,
  ): Promise<SendMessageResponse> => {
    const { data } = await api.post<SendMessageResponse>(`/matches/${matchId}/messages`, {
      content,
      type,
      ...(giftType ? { giftType } : {}),
    });
    return data;
  },

  sendImage: async (matchId: string, image: File | Blob): Promise<SendMessageResponse> => {
    const form = new FormData();
    const name = image instanceof File ? image.name : `photo-${Date.now()}.jpg`;
    form.append('image', image, name);
    const { data } = await api.post<SendMessageResponse>(
      `/matches/${matchId}/messages/image`,
      form,
    );
    return data;
  },

  sendVoice: async (matchId: string, audio: Blob): Promise<SendMessageResponse> => {
    const form = new FormData();
    const ext = audio.type.includes('mp4') ? 'm4a' : audio.type.includes('ogg') ? 'ogg' : 'webm';
    form.append('audio', audio, `voice-${Date.now()}.${ext}`);
    const { data } = await api.post<SendMessageResponse>(
      `/matches/${matchId}/messages/voice`,
      form,
    );
    return data;
  },
};
