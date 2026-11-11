import { createDb } from '@finanzas/db';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';

// createDb no abre conexión hasta la primera consulta, así que /health no toca la base.
const app = createApp({
  db: createDb('postgres://test:test@localhost:5432/test'),
  corsOrigin: '*',
});

describe('API', () => {
  it('GET /health responde ok', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('POST /v1/goals rechaza montos inválidos', async () => {
    const res = await app.request('/v1/goals', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Deuda', targetMinor: '-5' }),
    });
    expect(res.status).toBe(400);
  });
});
