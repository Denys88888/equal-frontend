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

  /** Undoes the last swipe. Rejects if the resulting match already has messages. */
  undoSwipe: async (): Promise<{ success: boolean; targetId: string; sparkBalance?: number }> => {
    const { data } = await api.post<{ success: boolean; targetId: string; sparkBalance?: number }>(
      '/profiles/swipe/undo',
      {},
    );
    return data;
  },

  toLocalProfile: (p: ProfileCard) => p,
};

export interface PublicProfile {
  id: string;
  name: string;
  age: number | null;
  compatibility: number;
  photo: string;
  photos: string[];
  bio: string;
  interests: string[];
  verified: boolean;
  activeNow: boolean;
  isMatch: boolean;
  matchId: string | null;
  alreadyLiked: boolean;
}

/**
 * Another user's profile. Used by the "Meet" buttons (club post author, club
 * member) — there was previously no screen anywhere in the app that could show
 * someone other than the signed-in user's own profile.
 *
 * @throws {ApiError} 404 if the user doesn't exist, is inactive, or either side
 *   has blocked the other (blocks return 404 rather than 403 so a block can't
 *   be detected by probing this endpoint)
 */
export async function getPublicProfile(userId: string): Promise<PublicProfile> {
  const { data } = await api.get<PublicProfile>(`/profiles/${encodeURIComponent(userId)}`);
  return data;
}
