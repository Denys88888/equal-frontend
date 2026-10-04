import { api } from './client';
import type { MessagesResponse, SendMessageResponse } from './types';
import { audioExtension } from '@/lib/audio';
import { compressImage } from '@/lib/image';

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
    const file = image instanceof File ? await compressImage(image) : image;
    const name = file instanceof File ? file.name : `photo-${Date.now()}.jpg`;
    form.append('image', file, name);
    const { data } = await api.post<SendMessageResponse>(
      `/matches/${matchId}/messages/image`,
      form,
    );
    return data;
  },

  sendVoice: async (matchId: string, audio: Blob): Promise<SendMessageResponse> => {
    const form = new FormData();
    form.append('audio', audio, `voice-${Date.now()}.${audioExtension(audio.type)}`);
    const { data } = await api.post<SendMessageResponse>(
      `/matches/${matchId}/messages/voice`,
      form,
    );
    return data;
  },
};
