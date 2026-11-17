import { createDb, goals } from '@finanzas/db';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { deleteUsers, signUp, testAuth } from './helpers';

// Necesita Postgres con migraciones: corre en CI y en local con DATABASE_URL definida.
const url = process.env.DATABASE_URL;

describe.skipIf(!url)('POST /v1/goals/:id/contributions contra Postgres', () => {
  const db = createDb(url ?? '');
  const app = createApp({ db, corsOrigin: '*', auth: testAuth });
  let me: Awaited<ReturnType<typeof signUp>>;
  const req = (path: string, init?: RequestInit) => me.request(path, init);
  let otherUser = '';
  let own = '';
  let other = '';

  async function seedGoal(userId: string) {
    const [g] = await db
      .insert(goals)
      .values({ userId, name: 'Test', targetMinor: 100000n })
      .returning();
    if (!g) throw new Error('seed falló');
    return g.id;
  }

  beforeAll(async () => {
    me = await signUp(app);
    otherUser = (await signUp(app)).userId;
    own = await seedGoal(me.userId);
    other = await seedGoal(otherUser);
  });

  afterAll(async () => {
    await deleteUsers(db, [me.userId, otherUser]);
    await db.$client.end();
  });

  const contribute = (goalId: string, amountMinor: string) =>
    req(`/v1/goals/${goalId}/contributions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ amountMinor }),
    });

  it('suma el aporte a la meta propia', async () => {
    expect((await contribute(own, '2500')).status).toBe(201);
    const list = (await (await req('/v1/goals')).json()) as {
      id: string;
      savedMinor: string;
    }[];
    expect(list.find((g) => g.id === own)?.savedMinor).toBe('2500');
  });

  it('marca la meta como cumplida al llegar al 100 %', async () => {
    const [g] = await db
      .insert(goals)
      .values({ userId: me.userId, name: 'Corta', targetMinor: 3000n })
      .returning();
    if (!g) throw new Error('seed falló');
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
    req(`/v1/goals/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: ' Nueva ', targetMinor }),
    });

  it('edita la meta y recalcula si quedó cumplida', async () => {
    const id = await seedGoal(me.userId);
    await contribute(id, '5000');
    const lower = await put(id, '5000');
    expect(lower.status).toBe(200);
    expect(await lower.json()).toMatchObject({ name: 'Nueva', status: 'completed' });
    expect(await (await put(id, '9000')).json()).toMatchObject({ status: 'active' });
  });

  it('no edita ni borra la meta de otro usuario', async () => {
    expect((await put(other, '5000')).status).toBe(404);
    expect((await req(`/v1/goals/${other}`, { method: 'DELETE' })).status).toBe(404);
  });

  it('borra una meta propia una sola vez', async () => {
    const id = await seedGoal(me.userId);
    await contribute(id, '1000');
    const del = () => req(`/v1/goals/${id}`, { method: 'DELETE' });
    expect((await del()).status).toBe(204);
    expect((await del()).status).toBe(404);
  });

  const createGoal = (name: string) =>
    req('/v1/goals', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, targetMinor: '500000' }),
    });

  it('crea una meta para el usuario con el nombre recortado', async () => {
    const res = await createGoal('  Viaje  ');
    expect(res.status).toBe(201);
    const goal = (await res.json()) as { id: string; name: string; targetMinor: string };
    expect(goal).toMatchObject({ name: 'Viaje', targetMinor: '500000' });
  });

  it('rechaza un nombre vacío', async () => {
    expect((await createGoal('   ')).status).toBe(400);
  });
});
