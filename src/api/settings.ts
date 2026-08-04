/**
 * Equal Dating App — App Settings API
 *
 * Currently just the support email that Help Center / Report a Problem read.
 */

import { api } from './client';

export async function getSupportEmail(): Promise<string | null> {
  const { data } = await api.get<{ email: string | null }>('/settings/support-email');
  return data.email;
}

export const settingsApi = { getSupportEmail };
