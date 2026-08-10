/**
 * Equal Dating App — Daily Match API
 *
 * One curated match per day with a 24h chat window. If both sides write, the
 * match becomes permanent; otherwise it expires.
 */

import { api } from './client';

export type DailyMatchStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'MUTUAL' | 'REJECTED';

export interface DailyMatchPartner {
  id: string;
  name: string;
  verified: boolean;
  reputation: number;
  languages: string[];
  voiceIntroUrl: string | null;
  avatar: string;
  bio: string;
  city: string;
  interests: string[];
  age: number | null;
}

export interface DailyMatchIcebreaker {
  key: string | null;
  myAnswer: string | null;
  /** Null until both sides have answered or skipped — enforced server-side. */
  partnerAnswer: string | null;
  mySkipped: boolean;
  partnerSkipped: boolean;
  revealed: boolean;
}

export interface DailyMatch {
  id: string;
  status: DailyMatchStatus;
  matchDate: string;
  chatExpiresAt: string;
  expiresInMs: number;
  mySentCount: number;
  partnerSentCount: number;
  icebreaker: DailyMatchIcebreaker;
  partner: DailyMatchPartner;
}

export interface DailyMatchMessage {
  id: string;
  senderId: string;
  content: string;
  kind: 'TEXT' | 'SYSTEM';
  createdAt: string;
}

/** Current match, or null when the user has never had one. */
export async function getDailyMatch(): Promise<DailyMatch | null> {
  const { data } = await api.get<DailyMatch | null>('/daily-match');
  return data;
}

export async function getDailyMessages(
  matchId: string,
  page = 1,
): Promise<{ messages: DailyMatchMessage[]; hasMore: boolean; page: number }> {
  const { data } = await api.get<{ messages: DailyMatchMessage[]; hasMore: boolean; page: number }>(
    `/daily-match/${encodeURIComponent(matchId)}/messages?page=${page}`,
  );
  return data;
}

export async function sendDailyMessage(
  matchId: string,
  content: string,
  kind: 'TEXT' | 'SYSTEM' = 'TEXT',
): Promise<DailyMatchMessage> {
  const { data } = await api.post<DailyMatchMessage>(
    `/daily-match/${encodeURIComponent(matchId)}/message`,
    { content, kind },
  );
  return data;
}

export async function skipDailyMatch(matchId: string): Promise<void> {
  await api.post<void>(`/daily-match/${encodeURIComponent(matchId)}/skip`, {});
}

export async function logDailyMatchView(matchId: string): Promise<void> {
  await api.post<void>(`/daily-match/${encodeURIComponent(matchId)}/view`, {});
}

export async function answerIcebreaker(matchId: string, answer: string): Promise<DailyMatch> {
  const { data } = await api.post<DailyMatch>(
    `/daily-match/${encodeURIComponent(matchId)}/icebreaker`,
    { answer },
  );
  return data;
}

export async function skipIcebreaker(matchId: string): Promise<DailyMatch> {
  const { data } = await api.post<DailyMatch>(
    `/daily-match/${encodeURIComponent(matchId)}/icebreaker/skip`,
    {},
  );
  return data;
}

/** Call only after the Pi payment has completed. */
export async function claimExtraMatch(): Promise<DailyMatch> {
  const { data } = await api.post<DailyMatch>('/daily-match/extra', {});
  return data;
}

// ── Vibe Check ─────────────────────────────────────────

export type Vibe = 'deep' | 'flirt' | 'chat' | 'quiet';

export async function getMyVibe(): Promise<{ vibe: Vibe | null; updatedAt: string | null }> {
  const { data } = await api.get<{ vibe: Vibe | null; updatedAt: string | null }>('/vibe');
  return data;
}

export async function setMyVibe(vibe: Vibe): Promise<{ vibe: Vibe }> {
  const { data } = await api.post<{ vibe: Vibe }>('/vibe', { vibe });
  return data;
}

// ── Voice Intro / match prefs ──────────────────────────

export async function uploadVoiceIntro(blob: Blob): Promise<{ voiceIntroUrl: string }> {
  const form = new FormData();
  form.append('voice', blob, `voice-intro-${Date.now()}.webm`);
  const { data } = await api.post<{ voiceIntroUrl: string }>('/users/me/voice-intro', form);
  return data;
}

export async function deleteVoiceIntro(): Promise<void> {
  await api.delete<void>('/users/me/voice-intro');
}

export async function updateMatchPrefs(body: {
  timezone?: string;
  dailyMatchTime?: string;
  languages?: string[];
}): Promise<{ timezone: string; dailyMatchTime: string; languages: string[]; voiceIntroUrl: string | null }> {
  const { data } = await api.patch<{
    timezone: string; dailyMatchTime: string; languages: string[]; voiceIntroUrl: string | null;
  }>('/users/me/match-prefs', body);
  return data;
}

export const dailyMatchApi = {
  getDailyMatch,
  getDailyMessages,
  sendDailyMessage,
  skipDailyMatch,
  logDailyMatchView,
  answerIcebreaker,
  skipIcebreaker,
  claimExtraMatch,
  getMyVibe,
  setMyVibe,
  uploadVoiceIntro,
  deleteVoiceIntro,
  updateMatchPrefs,
};
