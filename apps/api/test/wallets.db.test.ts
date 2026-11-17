import { createDb } from '@finanzas/db';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { deleteUsers, signUp, testAuth } from './helpers';

// Necesita Postgres con migraciones: corre en CI y en local con DATABASE_URL definida.
const url = process.env.DATABASE_URL;

type Wallet = { id: string; name: string; balanceMinor: string };

describe.skipIf(!url)('/v1/wallets contra Postgres', () => {
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
  const list = async (who = me) => (await (await who.request('/v1/wallets')).json()) as Wallet[];
  const createWallet = async (who: typeof me, body: object) =>
    ((await (await send(who, '/v1/wallets', 'POST', body)).json()) as Wallet).id;

  beforeAll(async () => {
    me = await signUp(app);
    other = await signUp(app);
  });

  afterAll(async () => {
    await deleteUsers(db, [me.userId, other.userId]);
    await db.$client.end();
  });

  it('el saldo es el inicial más ingresos menos gastos', async () => {
    const id = await createWallet(me, {
      name: 'Efectivo',
      type: 'cash',
      openingBalanceMinor: '50000',
    });
    const move = (kind: string, amountMinor: string) =>
      send(me, '/v1/transactions', 'POST', {
        walletId: id,
        categoryId: null,
        kind,
        amountMinor,
        occurredAt: new Date().toISOString(),
      });
    expect((await move('income', '20000')).status).toBe(201);
    expect((await move('expense', '5000')).status).toBe(201);

    expect((await list()).find((w) => w.id === id)?.balanceMinor).toBe('65000');
  });

  it('no borra una billetera con movimientos', async () => {
    const withMoves = (await list()).find((w) => w.name === 'Efectivo');
    const res = await send(me, `/v1/wallets/${withMoves?.id}`, 'DELETE');
    expect(res.status).toBe(409);
  });

  it('edita y borra una billetera vacía', async () => {
    const id = await createWallet(me, { name: 'Tarjeta', type: 'card' });
    const put = await send(me, `/v1/wallets/${id}`, 'PUT', {
      name: 'Visa',
      type: 'card',
      openingBalanceMinor: '0',
    });
    expect(put.status).toBe(200);
    expect((await send(me, `/v1/wallets/${id}`, 'DELETE')).status).toBe(204);
    expect((await list()).some((w) => w.id === id)).toBe(false);
  });

  it('no borra la única billetera', async () => {
    const [only] = await list(other);
    expect((await send(other, `/v1/wallets/${only?.id}`, 'DELETE')).status).toBe(409);
  });

  it('no deja tocar billeteras de otra persona', async () => {
    const [theirs] = await list(other);
    const body = { name: 'X', type: 'bank', openingBalanceMinor: '0' };
    expect((await send(me, `/v1/wallets/${theirs?.id}`, 'PUT', body)).status).toBe(404);
    expect((await send(me, `/v1/wallets/${theirs?.id}`, 'DELETE')).status).toBe(404);
    expect((await list()).some((w) => w.id === theirs?.id)).toBe(false);
  });

  it('rechaza un saldo inicial negativo', async () => {
    const res = await send(me, '/v1/wallets', 'POST', {
      name: 'X',
      type: 'bank',
      openingBalanceMinor: '-1',
    });
    expect(res.status).toBe(400);
  });
});
