import { createDb } from '@finanzas/db';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { testAuth } from './helpers';

// createDb no abre conexión hasta la primera consulta: sin cookie de sesión no se toca la base.
const app = createApp({
  db: createDb('postgres://test:test@localhost:5432/test'),
  corsOrigin: '*',
  auth: testAuth,
});

describe('API', () => {
  it('GET /health responde ok', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('/v1 sin sesión responde 401', async () => {
    const res = await app.request('/v1/goals', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Deuda', targetMinor: '5000' }),
    });
    expect(res.status).toBe(401);
  });
});
