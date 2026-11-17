import { budgets, createDb } from '@finanzas/db';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { deleteUsers, signUp, testAuth } from './helpers';

// Necesita Postgres con migraciones: corre en CI y en local con DATABASE_URL definida.
const url = process.env.DATABASE_URL;

type Budget = { categoryId: string; name: string; limitMinor: string; spentMinor: string };

describe.skipIf(!url)('/v1/budgets contra Postgres', () => {
  const db = createDb(url ?? '');
  const app = createApp({ db, corsOrigin: '*', auth: testAuth });
  let me: Awaited<ReturnType<typeof signUp>>;
  let other: Awaited<ReturnType<typeof signUp>>;
  let food = '';
  let salary = '';
  let wallet = '';

  const send = (who: typeof me, path: string, method: string, body?: unknown) =>
    who.request(path, {
      method,
      headers: { 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  const list = async () => (await (await me.request('/v1/budgets')).json()) as Budget[];
  const createCategory = async (name: string, kind: string) =>
    ((await (await send(me, '/v1/categories', 'POST', { name, kind })).json()) as { id: string })
      .id;
  const spend = (amountMinor: string, occurredAt: string, categoryId = food) =>
    send(me, '/v1/transactions', 'POST', {
      walletId: wallet,
      categoryId,
      kind: 'expense',
      amountMinor,
      occurredAt,
    });

  beforeAll(async () => {
    me = await signUp(app);
    other = await signUp(app);
    food = await createCategory('Comida prueba', 'expense');
    salary = await createCategory('Sueldo prueba', 'income');
    const wallets = (await (await me.request('/v1/wallets')).json()) as { id: string }[];
    wallet = wallets[0]?.id ?? '';
  });

  afterAll(async () => {
    await deleteUsers(db, [me.userId, other.userId]);
    await db.$client.end();
  });

  it('un tope de un mes pasado sigue valiendo y cuenta solo lo gastado este mes', async () => {
    await db
      .insert(budgets)
      .values({ userId: me.userId, categoryId: food, period: '2020-01-01', limitMinor: 80000n });
    expect((await spend('30000', new Date().toISOString())).status).toBe(201);
    expect((await spend('99000', '2020-01-15T12:00:00Z')).status).toBe(201);

    expect(await list()).toEqual([
      { categoryId: food, name: 'Comida prueba', limitMinor: '80000', spentMinor: '30000' },
    ]);
  });

  it('cambiar el tope vale desde este mes y no toca el mes pasado', async () => {
    expect((await send(me, `/v1/budgets/${food}`, 'PUT', { limitMinor: '50000' })).status).toBe(
      200,
    );
    expect((await list())[0]?.limitMinor).toBe('50000');

    const [old] = await db
      .select({ limitMinor: budgets.limitMinor })
      .from(budgets)
      .where(and(eq(budgets.categoryId, food), eq(budgets.period, '2020-01-01')));
    expect(old?.limitMinor).toBe(80000n);
  });

  it('quitar el tope lo saca de la lista', async () => {
    expect((await send(me, `/v1/budgets/${food}`, 'DELETE')).status).toBe(204);
    expect(await list()).toEqual([]);
  });

  it('solo acepta categorías de gasto propias y montos positivos', async () => {
    const body = { limitMinor: '1000' };
    expect((await send(me, `/v1/budgets/${salary}`, 'PUT', body)).status).toBe(404);
    expect((await send(other, `/v1/budgets/${food}`, 'PUT', body)).status).toBe(404);
    expect((await send(other, `/v1/budgets/${food}`, 'DELETE')).status).toBe(404);
    expect((await send(me, `/v1/budgets/${food}`, 'PUT', { limitMinor: '0' })).status).toBe(400);
  });
});
