import { api } from './client';

/**
 * Equal Ask — public Q&A on a profile.
 *
 * Prices are never computed here. `quote()` asks the server what a given
 * question costs; the Pi payment is made for exactly that amount, and the
 * server re-derives the price when the question is submitted.
 */

export interface AskAsker {
  id: string;
  name: string;
  avatar: string;
}

export interface AskItem {
  id: string;
  content: string;
  answer: string | null;
  isAnonymous: boolean;
  isUrgent: boolean;
  likes: number;
  likedByMe: boolean;
  createdAt: string;
  answeredAt: string | null;
  /** null when the question was asked anonymously */
  asker: AskAsker | null;
}

export interface AskFeed {
  target: { id: string; name: string; username: string };
  questions: AskItem[];
  answeredCount: number;
  totalCount: number;
  page: number;
  hasMore: boolean;
}

export interface AskQuote {
  /** Pi to pay before submitting. 0 means the free daily question is available. */
  price: number;
  /** Memo the Pi payment must carry for the server to accept it. */
  memo: string;
  usedFreeToday: boolean;
  breakdown: Partial<Record<'extra' | 'urgent' | 'anonymous', number>>;
  free: boolean;
}

export interface SentAskItem {
  id: string;
  content: string;
  answer: string | null;
  status: 'PENDING' | 'ANSWERED' | 'REJECTED' | 'REPORTED';
  isAnonymous: boolean;
  isUrgent: boolean;
  likes: number;
  createdAt: string;
  answeredAt: string | null;
  target: { id: string; name: string; username: string; avatar: string };
}

export const askApi = {
  /**
   * Public Q&A feed. Works signed-out — a shared /u/:username link has to
   * render for someone who doesn't have the app yet.
   *
   * @param userIdOrUsername — accepts either, so share links can be human-readable
   */
  getFeed: async (userIdOrUsername: string, page = 1): Promise<AskFeed> => {
    const { data } = await api.get<AskFeed>(
      `/ask/${encodeURIComponent(userIdOrUsername)}?page=${page}`,
    );
    return data;
  },

  /** What this question would cost right now, per the server. */
  getQuote: async (
    userIdOrUsername: string,
    opts: { isAnonymous: boolean; isUrgent: boolean },
  ): Promise<AskQuote> => {
    const qs = new URLSearchParams({
      anonymous: String(opts.isAnonymous),
      urgent: String(opts.isUrgent),
    });
    const { data } = await api.get<AskQuote>(
      `/ask/${encodeURIComponent(userIdOrUsername)}/quote?${qs}`,
    );
    return data;
  },

  ask: async (
    userIdOrUsername: string,
    body: { content: string; isAnonymous: boolean; isUrgent: boolean },
  ): Promise<{ id: string; status: string; createdAt: string }> => {
    const { data } = await api.post<{ id: string; status: string; createdAt: string }>(
      `/ask/${encodeURIComponent(userIdOrUsername)}`,
      body,
    );
    return data;
  },

  /** Questions waiting for me to answer, urgent first. */
  getInbox: async (): Promise<AskItem[]> => {
    const { data } = await api.get<AskItem[]>('/ask/inbox');
    return data ?? [];
  },

  /** My answered Q&A — what the public sees on my profile. */
  getAnswered: async (): Promise<AskItem[]> => {
    const { data } = await api.get<AskItem[]>('/ask/answered');
    return data ?? [];
  },

  /** Questions I sent to other people. */
  getSent: async (): Promise<SentAskItem[]> => {
    const { data } = await api.get<SentAskItem[]>('/ask/sent');
    return data ?? [];
  },

  answer: async (questionId: string, answer: string) => {
    const { data } = await api.post<{ id: string; status: string; answer: string }>(
      `/ask/${questionId}/answer`,
      { answer },
    );
    return data;
  },

  reject: async (questionId: string) => {
    const { data } = await api.post<{ id: string; status: string }>(
      `/ask/${questionId}/reject`,
      {},
    );
    return data;
  },

  /** Toggles: liking an already-liked answer removes the like. */
  like: async (questionId: string) => {
    const { data } = await api.post<{ id: string; likes: number; likedByMe: boolean }>(
      `/ask/${questionId}/like`,
      {},
    );
    return data;
  },

  report: async (questionId: string, reason?: string) => {
    const { data } = await api.post<{ success: boolean; autoBanned: boolean }>(
      `/ask/${questionId}/report`,
      { reason },
    );
    return data;
  },
};
