/**
 * Equal Dating App — Clubs API
 *
 * Interest-based communities: listing, joining, and posting.
 */

import { api } from './client';
import type { Club, ClubPost, CreateClubRequest, CreatePostRequest } from './types';

/**
 * Fetch all clubs, optionally filtered by category or search query.
 *
 * @param category — optional club category slug (e.g. 'sports', 'music')
 * @param search   — optional free-text search against name / description
 * @returns Array of Club objects
 * @throws {ApiError} 401 if not authenticated
 */
export async function getClubs(category?: string, search?: string): Promise<Club[]> {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (search) params.set('search', search);

  const qs = params.toString();
  const { data } = await api.get<Club[]>(`/clubs${qs ? `?${qs}` : ''}`);
  return data;
}

/**
 * Fetch a single club by ID.
 *
 * @param clubId — the club's unique identifier
 * @returns Club detail including memberCount, postCount, and isJoined flag
 * @throws {ApiError} 404 if club not found
 */
export async function getClub(clubId: string): Promise<Club> {
  const { data } = await api.get<Club>(`/clubs/${encodeURIComponent(clubId)}`);
  return data;
}

/**
 * Create a new interest-based club.
 *
 * @param payload — club name, description, category, and optional icon
 * @returns The newly created Club record
 * @throws {ApiError} 409 if a club with the same name already exists
 */
export async function createClub(payload: CreateClubRequest): Promise<Club> {
  const { data } = await api.post<Club>('/clubs', payload);
  return data;
}

/**
 * Join (or re-join) a club.
 *
 * @param clubId — the club to join
 * @throws {ApiError} 404 if club not found; 409 if already a member
 */
export async function joinClub(clubId: string): Promise<void> {
  await api.post<void>(`/clubs/${encodeURIComponent(clubId)}/join`, {});
}

/**
 * Leave a club.
 *
 * @param clubId — the club to leave
 * @throws {ApiError} 404 if club not found; 400 if not a member
 */
export async function leaveClub(clubId: string): Promise<void> {
  await api.post<void>(`/clubs/${encodeURIComponent(clubId)}/leave`, {});
}

/**
 * Fetch posts in a club's feed.
 *
 * @param clubId — the club whose posts to fetch
 * @returns Array of ClubPost objects ordered by newest first
 * @throws {ApiError} 404 if club not found
 */
export async function getPosts(clubId: string): Promise<ClubPost[]> {
  const { data } = await api.get<ClubPost[]>(`/clubs/${encodeURIComponent(clubId)}/posts`);
  return data;
}

/**
 * Create a new post in a club.
 *
 * @param clubId  — the club to post in
 * @param payload — post content and optional photo
 * @returns The created ClubPost record
 * @throws {ApiError} 403 if not a club member; 400 on empty content
 */
export async function createPost(clubId: string, payload: CreatePostRequest): Promise<ClubPost> {
  const { data } = await api.post<ClubPost>(
    `/clubs/${encodeURIComponent(clubId)}/posts`,
    payload,
  );
  return data;
}

// ───────────────────────────────────────────────────────────
// NAMESPACE EXPORT
// ───────────────────────────────────────────────────────────

/**
 * Grouped clubs API methods:
 * `import { clubsApi } from '@/api/clubs'`
 */
export const clubsApi = {
  getClubs,
  getClub,
  createClub,
  joinClub,
  leaveClub,
  getPosts,
  createPost,
};
