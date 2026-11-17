import { createDb } from '@finanzas/db';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { deleteUsers, signUp, testAuth } from './helpers';

// Necesita Postgres con migraciones: corre en CI y en local con DATABASE_URL definida.
const url = process.env.DATABASE_URL;

type Month = { month: string; incomeMinor: string; expenseMinor: string };

/** Mes de Colombia corrido `offset` meses desde hoy, como 'YYYY-MM' y un día de ese mes. */
function bogotaMonth(offset: number) {
  const [y = 0, m = 0] = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
  })
    .format(new Date())
    .split('-')
    .map(Number);
  const d = new Date(Date.UTC(y, m - 1 + offset, 15, 17));
  return { key: d.toISOString().slice(0, 7), day: d.toISOString() };
}

describe.skipIf(!url)('/v1/transactions/monthly contra Postgres', () => {
  const db = createDb(url ?? '');
  const app = createApp({ db, corsOrigin: '*', auth: testAuth });
  let me: Awaited<ReturnType<typeof signUp>>;
  let wallet = '';

  const move = (kind: string, amountMinor: string, occurredAt: string) =>
    me.request('/v1/transactions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ walletId: wallet, categoryId: null, kind, amountMinor, occurredAt }),
    });

  beforeAll(async () => {
    me = await signUp(app);
    const wallets = (await (await me.request('/v1/wallets')).json()) as { id: string }[];
    wallet = wallets[0]?.id ?? '';
  });

  afterAll(async () => {
    await deleteUsers(db, [me.userId]);
    await db.$client.end();
  });

  it('da 6 meses, del más viejo al actual, con 0 en los meses sin movimientos', async () => {
    const now = bogotaMonth(0);
    const twoAgo = bogotaMonth(-2);
    expect((await move('income', '1000', now.day)).status).toBe(201);
    expect((await move('expense', '300', now.day)).status).toBe(201);
    expect((await move('expense', '50', twoAgo.day)).status).toBe(201);
    expect((await move('expense', '9999', bogotaMonth(-6).day)).status).toBe(201);

    const res = await me.request('/v1/transactions/monthly');
    expect(res.status).toBe(200);
    const months = (await res.json()) as Month[];
    expect(months.map((m) => m.month)).toEqual(
      [-5, -4, -3, -2, -1, 0].map((o) => bogotaMonth(o).key),
    );
    expect(months.at(-1)).toEqual({ month: now.key, incomeMinor: '1000', expenseMinor: '300' });
    expect(months.find((m) => m.month === twoAgo.key)?.expenseMinor).toBe('50');
    expect(months.reduce((acc, m) => acc + BigInt(m.expenseMinor), 0n)).toBe(350n);
  });
});
