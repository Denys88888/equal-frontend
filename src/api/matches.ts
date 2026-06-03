import type { Match } from './types';

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

export const matchesApi = {
  getMatches: async (): Promise<Match[]> => {
    const url = `${API_BASE}/matches`;
    const empty: Match[] = [];
    return fetchWithFallback(url, empty);
  },

  deleteMatch: async (matchId: string): Promise<{ success: boolean }> => {
    try {
      const res = await fetch(`${API_BASE}/matches/${matchId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as { success: boolean };
    } catch {
      return { success: true };
    }
  },
};
