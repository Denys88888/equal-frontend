import { api } from './client';
import type { DiscoverResponse, SwipeResult, ProfileCard } from './types';

export const discoverApi = {
  getProfiles: async (filters?: {
    maxDistance?: number;
    ageMin?: number;
    ageMax?: number;
    interests?: string[];
  }): Promise<DiscoverResponse> => {
    const params: Record<string, string> = {};
    if (filters?.maxDistance) params.maxDistance = String(filters.maxDistance);
    if (filters?.ageMin) params.ageMin = String(filters.ageMin);
    if (filters?.ageMax) params.ageMax = String(filters.ageMax);
    if (filters?.interests?.length) params.interests = filters.interests.join(',');

    const qs = new URLSearchParams(params).toString();
    const { data } = await api.get<{ profiles?: ProfileCard[]; total?: number; hasMore?: boolean }>(
      `/profiles/discover${qs ? `?${qs}` : ''}`,
    );
    return {
      profiles: data.profiles ?? (Array.isArray(data) ? (data as ProfileCard[]) : []),
      total: data.total ?? 0,
      hasMore: data.hasMore ?? false,
    };
  },

  swipeAction: async (
    targetUserId: string,
    action: 'like' | 'dislike' | 'spark',
  ): Promise<SwipeResult> => {
    const { data } = await api.post<SwipeResult>('/profiles/swipe', { targetUserId, action });
    return data;
  },

  toLocalProfile: (p: ProfileCard) => p,
};
