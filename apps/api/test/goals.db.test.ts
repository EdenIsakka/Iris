import { createDb, goals } from '@finanzas/db';
import { inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';

// Necesita Postgres con migraciones: corre en CI y en local con DATABASE_URL definida.
const url = process.env.DATABASE_URL;

describe.skipIf(!url)('POST /v1/goals/:id/contributions contra Postgres', () => {
  const db = createDb(url ?? '');
  const app = createApp({ db, corsOrigin: '*' });
  const goalIds: string[] = [];
  let own = '';
  let other = '';

  async function seedGoal(userId: string) {
    const [g] = await db
      .insert(goals)
      .values({ userId, name: 'Test', targetMinor: 100000n })
      .returning();
    if (!g) throw new Error('seed falló');
    goalIds.push(g.id);
    return g.id;
  }

  beforeAll(async () => {
    own = await seedGoal('demo-user'); // el usuario que pone el middleware en desarrollo
    other = await seedGoal(`otro-${crypto.randomUUID()}`);
  });

  afterAll(async () => {
    // La cascada de goals borra los aportes creados aquí.
    await db.delete(goals).where(inArray(goals.id, goalIds));
    await db.$client.end();
  });

  const contribute = (goalId: string, amountMinor: string) =>
    app.request(`/v1/goals/${goalId}/contributions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ amountMinor }),
    });

  it('suma el aporte a la meta propia', async () => {
    expect((await contribute(own, '2500')).status).toBe(201);
    const list = (await (await app.request('/v1/goals')).json()) as {
      id: string;
      savedMinor: string;
    }[];
    expect(list.find((g) => g.id === own)?.savedMinor).toBe('2500');
  });

  it('rechaza la meta de otro usuario', async () => {
    expect((await contribute(other, '2500')).status).toBe(404);
  });

  it('rechaza un monto de 0', async () => {
    expect((await contribute(own, '0')).status).toBe(400);
  });
});
