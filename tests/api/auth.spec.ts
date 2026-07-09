import { test, expect } from '@playwright/test';

const BASE = process.env.API_URL || 'https://equal-backend.onrender.com/v1';

test.describe('Auth API', () => {
  test('health check returns ok', async ({ request }) => {
    const res = await request.get(`${BASE.replace('/v1', '')}/v1/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('login with invalid token returns 401', async ({ request }) => {
    const res = await request.post(`${BASE}/auth/pi`, {
      data: { accessToken: 'invalid_token', username: 'test' },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /users/me without token returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/users/me`);
    expect(res.status()).toBe(401);
  });

  test('GET /discover without token returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/profiles/discover`);
    expect(res.status()).toBe(401);
  });
});
