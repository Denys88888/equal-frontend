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
export const adminApi = {
  getStats: getAdminStats,
  getUsers: getAdminUsers,
  adjustTrust,
  awardBadge,
  getPendingReports,
  resolveReport,
};
