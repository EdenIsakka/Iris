import { createDb } from '@finanzas/db';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { deleteUsers, signUp, testAuth } from './helpers';

// Necesita Postgres con migraciones: corre en CI y en local con DATABASE_URL definida.
const url = process.env.DATABASE_URL;

type Item = { id: string; investedMinor: string; valueMinor: string; periodGainMinor: string };
type List = { items: Item[]; totals: Item };

describe.skipIf(!url)('/v1/investments contra Postgres', () => {
  const db = createDb(url ?? '');
  const app = createApp({ db, corsOrigin: '*', auth: testAuth });
  let me: Awaited<ReturnType<typeof signUp>>;
  let other: Awaited<ReturnType<typeof signUp>>;

  const send = (who: typeof me, path: string, method: string, body?: unknown) =>
    who.request(path, {
      method,
      headers: { 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  const list = async (period = 'month') =>
    (await (await me.request(`/v1/investments?period=${period}`)).json()) as List;

  beforeAll(async () => {
    me = await signUp(app);
    other = await signUp(app);
  });

  afterAll(async () => {
    await deleteUsers(db, [me.userId, other.userId]);
    await db.$client.end();
  });

  it('calcula valor, aportes y ganancia del periodo', async () => {
    const twoMonthsAgo = new Date(Date.now() - 60 * 864e5).toISOString().slice(0, 10);
    const res = await send(me, '/v1/investments', 'POST', {
      name: 'Bitcoin',
      kind: 'crypto',
      amountMinor: '1000000',
      startedAt: twoMonthsAgo,
      currentValueMinor: '1200000',
    });
    expect(res.status).toBe(201);
    const { id } = (await res.json()) as { id: string };

    expect(
      (await send(me, `/v1/investments/${id}/contributions`, 'POST', { amountMinor: '500000' }))
        .status,
    ).toBe(201);
    expect(
      (await send(me, `/v1/investments/${id}/valuations`, 'POST', { valueMinor: '1800000' }))
        .status,
    ).toBe(201);

    const month = await list('month');
    expect(month.items.find((i) => i.id === id)).toMatchObject({
      investedMinor: '1500000',
      valueMinor: '1800000',
      // Al empezar el mes valía 1.000.000; se aportaron 500.000 y hoy vale 1.800.000.
      periodGainMinor: '300000',
    });
    expect(month.totals.valueMinor).toBe('1800000');

    const history = (await (
      await me.request(`/v1/investments/${id}/valuations?period=month`)
    ).json()) as {
      valueMinor: string;
    }[];
    expect(history.map((h) => h.valueMinor)).toEqual(['1000000', '1200000', '1700000', '1800000']);
  });

  it('no deja ver ni tocar inversiones de otra persona', async () => {
    const res = await send(other, '/v1/investments', 'POST', {
      name: 'Acciones',
      kind: 'stocks',
      amountMinor: '100',
    });
    const { id } = (await res.json()) as { id: string };

    expect((await list()).items.some((i) => i.id === id)).toBe(false);
    expect(
      (await send(me, `/v1/investments/${id}/valuations`, 'POST', { valueMinor: '1' })).status,
    ).toBe(404);
    expect(
      (await send(me, `/v1/investments/${id}/contributions`, 'POST', { amountMinor: '1' })).status,
    ).toBe(404);
    expect((await me.request(`/v1/investments/${id}/valuations`)).status).toBe(404);
    expect(
      (await send(me, `/v1/investments/${id}`, 'PUT', { name: 'X', kind: 'other' })).status,
    ).toBe(404);
    expect((await send(me, `/v1/investments/${id}`, 'DELETE')).status).toBe(404);
  });

  it('borra la inversión con su historial', async () => {
    const res = await send(me, '/v1/investments', 'POST', {
      name: 'CDT',
      kind: 'cdt',
      amountMinor: '100',
    });
    const { id } = (await res.json()) as { id: string };
    expect((await send(me, `/v1/investments/${id}`, 'DELETE')).status).toBe(204);
    expect((await list()).items.some((i) => i.id === id)).toBe(false);
  });

  it('rechaza un tipo o periodo que no existe', async () => {
    const bad = await send(me, '/v1/investments', 'POST', {
      name: 'X',
      kind: 'oro',
      amountMinor: '1',
    });
    expect(bad.status).toBe(400);
    expect((await me.request('/v1/investments?period=dia')).status).toBe(400);
  });
});
