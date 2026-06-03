/**
 * Equal Dating App — Matches API
 *
 * List mutual matches, fetch individual match details, and unmatch.
 */

import { api } from './client';
import type { Match } from './types';

/**
 * Fetch all mutual matches for the authenticated user.
 *
 * Ordered by most recent activity (last message or creation date).
 *
 * @returns Array of Match objects with embedded user profile + last message
 * @throws {ApiError} 401 if not authenticated
 */
export async function getMatches(): Promise<Match[]> {
  const { data } = await api.get<Match[]>('/matches');
  return data;
}

/**
 * Fetch details for a single match.
 *
 * @param matchId — the match's unique identifier
 * @returns Match object with full user profile and unread count
 * @throws {ApiError} 404 if match not found; 401 if not authenticated
 */
export async function getMatch(matchId: string): Promise<Match> {
  const { data } = await api.get<Match>(`/matches/${encodeURIComponent(matchId)}`);
  return data;
}

/**
 * Unmatch (delete) a mutual match.
 *
 * This permanently removes the conversation and match record for both users.
 *
 * @param matchId — the match to delete
 * @throws {ApiError} 404 if match not found; 401 if not authenticated
 */
export async function unmatch(matchId: string): Promise<void> {
  await api.delete(`/matches/${encodeURIComponent(matchId)}`);
}

// ───────────────────────────────────────────────────────────
// NAMESPACE EXPORT
// ───────────────────────────────────────────────────────────

/**
 * Grouped matches API methods:
 * `import { matchesApi } from '@/api/matches'`
 */
export const matchesApi = {
  getMatches,
  getMatch,
  unmatch,
};
