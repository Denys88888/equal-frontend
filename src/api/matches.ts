import { api } from './client';
import type { Match } from './types';

export const matchesApi = {
  getMatches: async (): Promise<Match[]> => {
    const { data } = await api.get<Match[]>('/matches');
    return data;
  },

  deleteMatch: async (matchId: string): Promise<{ success: boolean }> => {
    await api.delete(`/matches/${matchId}`);
    return { success: true };
  },
};
