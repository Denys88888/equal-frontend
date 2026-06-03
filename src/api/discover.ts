/**
 * Equal Dating App — Discovery API
 *
 * Profile discovery (swipe feed) and swipe-action recording.
 */

import { api } from './client';
import type {
  ProfileCard,
  DiscoverFilters,
  SwipeActionRequest,
  SwipeActionResponse,
} from './types';

/**
 * Response shape for the /discover feed endpoint.
 */
export interface DiscoverResponse {
  profiles: ProfileCard[];
  hasMore: boolean;
}

/**
 * Fetch a batch of profile cards for the swipe feed.
 *
 * The backend runs the compatibility algorithm, excludes already-seen / matched
 * profiles, and enforces geo-distance + age filters.
 *
 * @param filters — optional geo, age, verification, and interest filters
 * @returns Array of profile cards + pagination flag
 * @throws {ApiError} 401 if not authenticated; 400 on bad filter params
 *
 * @example
 * ```ts
 * const { profiles, hasMore } = await getProfiles({
 *   lat: 40.7128,
 *   lon: -74.006,
 *   maxDistance: 25,
 *   ageMin: 21,
 *   ageMax: 35,
 *   verifiedOnly: true,
 * });
 * ```
 */
export async function getProfiles(filters: DiscoverFilters = {}): Promise<DiscoverResponse> {
  const params = new URLSearchParams();

  if (filters.lat !== undefined) params.set('lat', String(filters.lat));
  if (filters.lon !== undefined) params.set('lon', String(filters.lon));
  if (filters.maxDistance !== undefined) params.set('maxDistance', String(filters.maxDistance));
  if (filters.ageMin !== undefined) params.set('ageMin', String(filters.ageMin));
  if (filters.ageMax !== undefined) params.set('ageMax', String(filters.ageMax));
  if (filters.verifiedOnly !== undefined) params.set('verifiedOnly', String(filters.verifiedOnly));
  if (filters.interests?.length) {
    filters.interests.forEach((i) => params.append('interests', i));
  }
  if (filters.excludeIds?.length) {
    filters.excludeIds.forEach((id) => params.append('excludeIds', id));
  }

  const query = params.toString();
  const { data } = await api.get<DiscoverResponse>(`/discover${query ? `?${query}` : ''}`);
  return data;
}

/**
 * Record a swipe action (like / dislike / spark) on a target profile.
 *
 * When both users like each other the backend creates a Match and returns
 * `isMatch: true` together with the new match ID.
 *
 * @param targetUserId — the profile being swiped on
 * @param action       — 'like', 'dislike', or 'spark'
 * @returns Whether a mutual match was created + optional matchId
 * @throws {ApiError} 400 on self-swipe or invalid action; 401 if not authenticated
 */
export async function swipeAction(
  targetUserId: string,
  action: 'like' | 'dislike' | 'spark',
): Promise<SwipeActionResponse> {
  const { data } = await api.post<SwipeActionResponse>('/discover/action', {
    targetUserId,
    action,
  } as SwipeActionRequest);
  return data;
}

// ───────────────────────────────────────────────────────────
// NAMESPACE EXPORT
// ───────────────────────────────────────────────────────────

/**
 * Grouped discovery API methods:
 * `import { discoverApi } from '@/api/discover'`
 */
export const discoverApi = {
  getProfiles,
  swipeAction,
};
