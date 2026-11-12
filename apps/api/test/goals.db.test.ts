import { createDb, goals } from '@finanzas/db';
import { eq, inArray } from 'drizzle-orm';
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

  it('marca la meta como cumplida al llegar al 100 %', async () => {
    const [g] = await db
      .insert(goals)
      .values({ userId: 'demo-user', name: 'Corta', targetMinor: 3000n })
      .returning();
    if (!g) throw new Error('seed falló');
    goalIds.push(g.id);
    const status = async () =>
      (await db.select({ s: goals.status }).from(goals).where(eq(goals.id, g.id)))[0]?.s;

    await contribute(g.id, '2000');
    expect(await status()).toBe('active');
    await contribute(g.id, '1000');
    expect(await status()).toBe('completed');
  });

  it('rechaza la meta de otro usuario', async () => {
    expect((await contribute(other, '2500')).status).toBe(404);
  });

  it('rechaza un monto de 0', async () => {
    expect((await contribute(own, '0')).status).toBe(400);
  });

  it('responde 400 si el id no es un UUID', async () => {
    expect((await contribute('abc', '2500')).status).toBe(400);
  });

  const put = (id: string, targetMinor: string) =>
    app.request(`/v1/goals/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: ' Nueva ', targetMinor }),
    });

  it('edita la meta y recalcula si quedó cumplida', async () => {
    const id = await seedGoal('demo-user');
    await contribute(id, '5000');
    const lower = await put(id, '5000');
    expect(lower.status).toBe(200);
    expect(await lower.json()).toMatchObject({ name: 'Nueva', status: 'completed' });
    expect(await (await put(id, '9000')).json()).toMatchObject({ status: 'active' });
  });

  it('no edita ni borra la meta de otro usuario', async () => {
    expect((await put(other, '5000')).status).toBe(404);
    expect((await app.request(`/v1/goals/${other}`, { method: 'DELETE' })).status).toBe(404);
  });

  it('borra una meta propia una sola vez', async () => {
    const id = await seedGoal('demo-user');
    await contribute(id, '1000');
    const del = () => app.request(`/v1/goals/${id}`, { method: 'DELETE' });
    expect((await del()).status).toBe(204);
    expect((await del()).status).toBe(404);
  });

  const createGoal = (name: string) =>
    app.request('/v1/goals', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, targetMinor: '500000' }),
    });

  it('crea una meta para el usuario con el nombre recortado', async () => {
    const res = await createGoal('  Viaje  ');
    expect(res.status).toBe(201);
    const goal = (await res.json()) as { id: string; name: string; targetMinor: string };
    goalIds.push(goal.id);
    expect(goal).toMatchObject({ name: 'Viaje', targetMinor: '500000' });
  });

  it('rechaza un nombre vacío', async () => {
    expect((await createGoal('   ')).status).toBe(400);
  });
});
