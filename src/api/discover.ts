import type { DiscoverResponse, SwipeResult, ProfileCard } from './types';

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

export const discoverApi = {
  getProfiles: async (filters?: { maxDistance?: number; ageMin?: number; ageMax?: number; interests?: string[] }): Promise<DiscoverResponse> => {
    const params = new URLSearchParams();
    if (filters?.maxDistance) params.set('maxDistance', String(filters.maxDistance));
    if (filters?.ageMin) params.set('ageMin', String(filters.ageMin));
    if (filters?.ageMax) params.set('ageMax', String(filters.ageMax));
    if (filters?.interests?.length) params.set('interests', filters.interests.join(','));

    const url = `${API_BASE}/discover?${params.toString()}`;
    const empty: DiscoverResponse = { profiles: [], total: 0, hasMore: false };
    return fetchWithFallback(url, empty);
  },

  swipeAction: async (targetUserId: string, action: 'like' | 'dislike' | 'spark'): Promise<SwipeResult> => {
    try {
      const res = await fetch(`${API_BASE}/discover/swipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, action }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as SwipeResult;
    } catch {
      return { success: true, isMatch: false };
    }
  },

  // Helper to convert API ProfileCard to local Profile (used by pages)
  toLocalProfile: (p: ProfileCard) => p,
};
