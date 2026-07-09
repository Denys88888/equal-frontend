import { api } from './client';

export async function getSparksBalance(): Promise<{ balance: number }> {
  const { data } = await api.get<{ balance: number }>('/sparks/balance');
  return data;
}

export async function earnSparks(action: string): Promise<{ earned: number; newBalance: number }> {
  const { data } = await api.post<{ earned: number; newBalance: number }>('/sparks/earn', { action });
  return data;
}

export async function spendSparks(amount: number): Promise<{ spent: number; newBalance: number }> {
  const { data } = await api.post<{ spent: number; newBalance: number }>('/sparks/spend', { amount });
  return data;
}

export const sparksApi = { getBalance: getSparksBalance, earn: earnSparks, spend: spendSparks };
