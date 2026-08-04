/**
 * Equal Dating App — Admin API
 *
 * Moderation endpoints: analytics, user listing, trust-score adjustments,
 * badge management, and report resolution. All routes require admin role.
 */

import { api } from './client';
import type { AdminStats, UserAdmin, Report, AdjustTrustRequest, AwardBadgeRequest } from './types';

/**
 * Fetch admin dashboard statistics.
 *
 * @returns Snapshot of daily / total platform metrics
 * @throws {ApiError} 403 if user lacks admin role
 */
export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await api.get<AdminStats>('/admin/stats');
  return data;
}

export interface RevenueTransaction {
  id: string;
  amount: number;
  memo: string;
  createdAt: string;
  user: { name: string; username: string };
}

/** Completed payments only — the app's full revenue ledger, newest first. */
export async function getRevenueHistory(): Promise<RevenueTransaction[]> {
  const { data } = await api.get<RevenueTransaction[]>('/admin/revenue');
  return data;
}

/**
 * List all users (admin view).
 *
 * @returns Array of user records with moderation metadata
 * @throws {ApiError} 403 if user lacks admin role
 */
export async function getAdminUsers(): Promise<UserAdmin[]> {
  const { data } = await api.get<UserAdmin[]>('/admin/users');
  return data;
}

/**
 * Adjust a user's trust score.
 *
 * @param userId — target user's ID
 * @param score  — new trust score (0–100)
 * @param reason — human-readable reason for the change
 * @throws {ApiError} 404 if user not found; 403 if not admin
 */
export async function adjustTrust(
  userId: string,
  score: number,
  reason: string,
): Promise<void> {
  await api.post<void>(`/admin/users/${encodeURIComponent(userId)}/trust`, {
    score,
    reason,
  } as AdjustTrustRequest);
}

/**
 * Award a badge to a user.
 *
 * @param userId — target user's ID
 * @param badge  — badge type to award
 * @throws {ApiError} 404 if user not found; 403 if not admin
 */
export async function awardBadge(userId: string, badge: AwardBadgeRequest['badge']): Promise<void> {
  await api.post<void>(`/admin/users/${encodeURIComponent(userId)}/badges`, {
    badge,
  } as AwardBadgeRequest);
}

/**
 * Fetch pending reports for moderation review.
 *
 * @returns Array of unresolved reports
 * @throws {ApiError} 403 if user lacks admin role
 */
export async function getPendingReports(): Promise<Report[]> {
  const { data } = await api.get<Report[]>('/admin/reports');
  return data;
}

/**
 * Resolve a report with a specific moderation action.
 *
 * @param reportId — the report to resolve
 * @param action   — moderation action ('warn', 'ban', 'none')
 * @throws {ApiError} 404 if report not found; 403 if not admin
 */
export async function resolveReport(
  reportId: string,
  action: 'warn' | 'ban' | 'none',
): Promise<void> {
  await api.post<void>(`/admin/reports/${encodeURIComponent(reportId)}/resolve`, { action });
}

// ───────────────────────────────────────────────────────────
// NAMESPACE EXPORT
// ───────────────────────────────────────────────────────────

/**
 * Grouped admin API methods:
 * `import { adminApi } from '@/api/admin'`
 */
export async function banUser(userId: string): Promise<void> {
  await api.post<void>(`/admin/users/${encodeURIComponent(userId)}/ban`, {});
}

export async function unbanUser(userId: string): Promise<void> {
  await api.post<void>(`/admin/users/${encodeURIComponent(userId)}/unban`, {});
}

export interface AdminClub {
  id: string;
  name: string;
  category: string;
  memberCount: number;
  postCount: number;
  createdAt: string;
}

export interface AdminEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  attendees: number;
  featured: boolean;
  status: 'Upcoming' | 'Past';
}

export async function getAdminClubs(): Promise<AdminClub[]> {
  const { data } = await api.get<AdminClub[]>('/admin/clubs');
  return data;
}

export async function deleteClub(clubId: string): Promise<void> {
  await api.delete<void>(`/admin/clubs/${encodeURIComponent(clubId)}`);
}

export async function getAdminEvents(): Promise<AdminEvent[]> {
  const { data } = await api.get<AdminEvent[]>('/admin/events');
  return data;
}

export async function deleteEvent(eventId: string): Promise<void> {
  await api.delete<void>(`/admin/events/${encodeURIComponent(eventId)}`);
}

/** Toggles featured; returns the resulting state. */
export async function toggleEventFeatured(eventId: string): Promise<boolean> {
  const { data } = await api.post<{ featured: boolean }>(
    `/admin/events/${encodeURIComponent(eventId)}/feature`,
    {},
  );
  return data.featured;
}

export interface PendingVerification {
  id: string;
  mediaUrl: string;
  gesture: string;
  createdAt: string;
  user: { id: string; name: string; username: string };
}

/** Selfie verifications awaiting manual review. */
export async function getPendingVerifications(): Promise<PendingVerification[]> {
  const { data } = await api.get<PendingVerification[]>('/admin/verifications');
  return data;
}

/** Approving is what sets User.verified — there is no automated liveness check. */
export async function reviewVerification(requestId: string, approve: boolean): Promise<void> {
  const action = approve ? 'approve' : 'reject';
  await api.post<void>(`/admin/verifications/${encodeURIComponent(requestId)}/${action}`, {});
}

/** Sets or clears a user's verified flag directly, bypassing the request queue. */
export async function setUserVerified(userId: string, verified: boolean): Promise<void> {
  await api.post<void>(`/admin/users/${encodeURIComponent(userId)}/verify`, { verified });
}

/** The address Settings' Help Center / Report a Problem rows point to. */
export async function setSupportEmail(email: string): Promise<void> {
  await api.put<void>('/admin/settings/support-email', { email });
}

export const adminApi = {
  getStats: getAdminStats,
  getRevenueHistory,
  getUsers: getAdminUsers,
  adjustTrust,
  awardBadge,
  getPendingReports,
  resolveReport,
  banUser,
  unbanUser,
  getPendingVerifications,
  reviewVerification,
  setUserVerified,
  getAdminClubs,
  deleteClub,
  getAdminEvents,
  deleteEvent,
  toggleEventFeatured,
  setSupportEmail,
};
