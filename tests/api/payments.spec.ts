import { test, expect } from '@playwright/test';

const BASE = process.env.API_URL || 'https://equal-backend.onrender.com/v1';

test.describe('Payments API', () => {
  test('POST /payments/:id/approve without token returns 401', async ({ request }) => {
    const res = await request.post(`${BASE}/payments/test-id/approve`, {
      data: { paymentId: 'test' },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /payments/history without token returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/payments/history`);
    expect(res.status()).toBe(401);
  });

  test('POST /payments/:id/complete without token returns 401', async ({ request }) => {
    const res = await request.post(`${BASE}/payments/test-id/complete`, {
      data: { paymentId: 'test', txid: 'test' },
    });
    expect(res.status()).toBe(401);
  });
});
