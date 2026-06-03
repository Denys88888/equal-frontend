/**
 * Equal Dating App — Messages API
 *
 * REST endpoints for fetching chat history and sending messages.
 * Real-time updates are delivered via WebSocket (see `useChatSocket` hook).
 */

import { api } from './client';
import type { Message, SendMessageRequest } from './types';

/**
 * Response shape for paginated message history.
 */
export interface MessagesResponse {
  messages: Message[];
  hasMore: boolean;
}

/**
 * Fetch paginated message history for a match.
 *
 * Messages are returned in reverse-chronological order (newest first).
 * Use `before` to load older pages (cursor-based pagination).
 *
 * @param matchId — the match / conversation ID
 * @param params  — optional pagination cursors
 * @returns Array of messages + flag indicating whether older pages exist
 * @throws {ApiError} 403 if user is not part of the match; 404 if match not found
 *
 * @example
 * ```ts
 * // First page
 * const { messages, hasMore } = await getMessages('match_abc');
 *
 * // Older page
 * const older = await getMessages('match_abc', {
 *   before: messages[messages.length - 1].id,
 *   limit: 50,
 * });
 * ```
 */
export async function getMessages(
  matchId: string,
  params?: { before?: string; limit?: number },
): Promise<MessagesResponse> {
  const query = new URLSearchParams();
  if (params?.before) query.set('before', params.before);
  if (params?.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  const { data } = await api.get<MessagesResponse>(
    `/matches/${encodeURIComponent(matchId)}/messages${qs ? `?${qs}` : ''}`,
  );
  return data;
}

/**
 * Send a text, voice, gift, or system message inside a match conversation.
 *
 * The message is persisted and broadcast to the recipient via WebSocket.
 *
 * @param matchId  — the match / conversation ID
 * @param content  — message body text (or base64 for voice)
 * @param type     — message type discriminator (default: 'text')
 * @param metadata — arbitrary extra data (e.g. giftId, voiceDuration)
 * @returns The created Message record with server-generated id + timestamp
 * @throws {ApiError} 403 if user is not part of the match; 400 on empty content
 */
export async function sendMessage(
  matchId: string,
  content: string,
  type: string = 'text',
  metadata?: Record<string, unknown>,
): Promise<Message> {
  const { data } = await api.post<Message>(
    `/matches/${encodeURIComponent(matchId)}/messages`,
    { content, type, metadata } as SendMessageRequest,
  );
  return data;
}

/**
 * Mark all messages in a match as read.
 *
 * @param matchId — the match / conversation ID
 * @throws {ApiError} 403 if user is not part of the match
 */
export async function markAsRead(matchId: string): Promise<void> {
  await api.post<void>(`/matches/${encodeURIComponent(matchId)}/read`, {});
}

// ───────────────────────────────────────────────────────────
// NAMESPACE EXPORT
// ───────────────────────────────────────────────────────────

/**
 * Grouped messages API methods:
 * `import { messagesApi } from '@/api/messages'`
 */
export const messagesApi = {
  getMessages,
  sendMessage,
  markAsRead,
};
