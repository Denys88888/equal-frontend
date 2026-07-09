import { test, expect } from '@playwright/test';

const BASE = process.env.API_URL || 'https://equal-backend.onrender.com/v1';

test.describe('Payments API', () => {
  test('POST /payments/approve without token returns 401', async ({ request }) => {
    const res = await request.post(`${BASE}/payments/approve`, {
      data: { paymentId: 'test' },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /payments/history without token returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/payments/history`);
    expect(res.status()).toBe(401);
  });

  test('POST /payments/complete without token returns 401', async ({ request }) => {
    const res = await request.post(`${BASE}/payments/complete`, {
      data: { paymentId: 'test', txid: 'test' },
    });
    expect(res.status()).toBe(401);
  });
});
