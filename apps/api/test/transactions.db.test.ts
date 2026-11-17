import { categories, createDb, transactions, wallets } from '@finanzas/db';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { deleteUsers, signUp, testAuth } from './helpers';

// Necesita Postgres con migraciones: corre en CI y en local con DATABASE_URL definida.
const url = process.env.DATABASE_URL;

describe.skipIf(!url)('Datos por usuario contra Postgres', () => {
  const db = createDb(url ?? '');
  const app = createApp({ db, corsOrigin: '*', auth: testAuth });
  let me: Awaited<ReturnType<typeof signUp>>;
  const req = (path: string, init?: RequestInit) => me.request(path, init);
  let otherUser = '';
  let own = { wallet: '', category: '' };
  let other = { wallet: '', category: '' };

  async function seedUser(userId: string) {
    const [w] = await db.insert(wallets).values({ userId, name: 'Test', type: 'bank' }).returning();
    const [c] = await db
      .insert(categories)
      .values({ userId, name: 'Test', kind: 'expense' })
      .returning();
    if (!w || !c) throw new Error('seed falló');
    return { wallet: w.id, category: c.id };
  }

  beforeAll(async () => {
    me = await signUp(app);
    otherUser = (await signUp(app)).userId;
    own = await seedUser(me.userId);
    other = await seedUser(otherUser);
  });

  afterAll(async () => {
    await deleteUsers(db, [me.userId, otherUser]);
    await db.$client.end();
  });

  const post = (walletId: string, categoryId: string | null) =>
    req('/v1/transactions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        walletId,
        categoryId,
        kind: 'expense',
        amountMinor: '1000',
        occurredAt: '2026-11-11T12:00:00Z',
      }),
    });

  it('sin sesión responde 401', async () => {
    expect((await app.request('/v1/wallets')).status).toBe(401);
  });

  it('una cuenta nueva arranca con billetera y categorías por defecto', async () => {
    const wallets = (await (await req('/v1/wallets')).json()) as { name: string }[];
    expect(wallets.map((w) => w.name)).toContain('Cuenta de ahorros');
    const cats = (await (await req('/v1/categories')).json()) as { name: string }[];
    expect(cats.map((c) => c.name)).toEqual(expect.arrayContaining(['Mercado', 'Salario']));
  });

  it('crea con billetera y categoría propias', async () => {
    expect((await post(own.wallet, own.category)).status).toBe(201);
  });

  it('rechaza la billetera de otro usuario', async () => {
    expect((await post(other.wallet, null)).status).toBe(404);
  });

  it('rechaza la categoría de otro usuario', async () => {
    expect((await post(own.wallet, other.category)).status).toBe(404);
  });

  it('rechaza una billetera que no existe', async () => {
    expect((await post(crypto.randomUUID(), null)).status).toBe(404);
  });

  it('rechaza un gasto con una categoría de ingreso', async () => {
    const [income] = await db
      .insert(categories)
      .values({ userId: me.userId, name: 'Test ingreso', kind: 'income' })
      .returning();
    if (!income) throw new Error('seed falló');
    expect((await post(own.wallet, income.id)).status).toBe(404);
  });

  const put = (id: string, body: Record<string, unknown>) =>
    req(`/v1/transactions/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        kind: 'expense',
        amountMinor: '1000',
        occurredAt: '2026-11-11T12:00:00Z',
        categoryId: null,
        ...body,
      }),
    });

  it('edita un movimiento propio y puede borrar la nota', async () => {
    const created = await req('/v1/transactions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        walletId: own.wallet,
        categoryId: null,
        kind: 'expense',
        amountMinor: '1000',
        occurredAt: '2026-11-11T12:00:00Z',
        note: 'Antes',
      }),
    });
    const { id } = (await created.json()) as { id: string };
    const res = await put(id, { walletId: own.wallet, amountMinor: '2500' });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ amountMinor: '2500', note: null });
  });

  it('no edita el movimiento de otro usuario ni usa su billetera', async () => {
    const [theirs] = await db
      .insert(transactions)
      .values({
        userId: otherUser,
        walletId: other.wallet,
        kind: 'expense',
        amountMinor: 1000n,
        occurredAt: new Date(),
      })
      .returning();
    if (!theirs) throw new Error('seed falló');
    expect((await put(theirs.id, { walletId: own.wallet })).status).toBe(404);
    const { id } = (await (await post(own.wallet, null)).json()) as { id: string };
    expect((await put(id, { walletId: other.wallet })).status).toBe(404);
  });

  it('borra un movimiento propio una sola vez', async () => {
    const { id } = (await (await post(own.wallet, null)).json()) as { id: string };
    const del = () => req(`/v1/transactions/${id}`, { method: 'DELETE' });
    expect((await del()).status).toBe(204);
    expect((await del()).status).toBe(404);
  });

  it('responde 400 si el id no es un UUID', async () => {
    expect((await req('/v1/transactions/abc', { method: 'DELETE' })).status).toBe(400);
  });

  const postCategory = (body: unknown) =>
    req('/v1/categories', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('crea una categoría propia y no la duplica', async () => {
    const name = `Mascotas ${crypto.randomUUID().slice(0, 8)}`;
    const first = await postCategory({ name, kind: 'expense' });
    expect(first.status).toBe(201);
    const { id } = (await first.json()) as { id: string };

    const again = await postCategory({ name: `  ${name.toUpperCase()} `, kind: 'expense' });
    expect(again.status).toBe(200);
    expect(((await again.json()) as { id: string }).id).toBe(id);
  });

  it('al repetir un nombre devuelve la categoría propia, no la de otro usuario', async () => {
    // Ambos usuarios tienen una categoría de gasto llamada "Test".
    const res = await postCategory({ name: 'test', kind: 'expense' });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { id: string }).id).toBe(own.category);
  });

  it('rechaza una categoría sin nombre', async () => {
    expect((await postCategory({ name: '   ', kind: 'expense' })).status).toBe(400);
  });

  const putCategory = (id: string, name: string) =>
    req(`/v1/categories/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name }),
    });

  it('renombra una categoría propia sin chocar con otra', async () => {
    const name = `Renombrar ${crypto.randomUUID().slice(0, 8)}`;
    const { id } = (await (await postCategory({ name, kind: 'expense' })).json()) as {
      id: string;
    };
    const res = await putCategory(id, `${name} 2`);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ name: `${name} 2`, kind: 'expense' });
    expect((await putCategory(id, 'TEST')).status).toBe(409); // ya existe "Test" de gasto
    expect((await putCategory(other.category, 'Otro')).status).toBe(404);
  });

  it('al borrar una categoría sus movimientos quedan sin categoría', async () => {
    const name = `Borrar ${crypto.randomUUID().slice(0, 8)}`;
    const { id } = (await (await postCategory({ name, kind: 'expense' })).json()) as {
      id: string;
    };
    const tx = (await (await post(own.wallet, id)).json()) as { id: string };
    const del = () => req(`/v1/categories/${id}`, { method: 'DELETE' });
    expect((await del()).status).toBe(204);
    expect((await del()).status).toBe(404);
    const [row] = await db.select().from(transactions).where(eq(transactions.id, tx.id));
    expect(row?.categoryId).toBeNull();
    expect((await req(`/v1/categories/${other.category}`, { method: 'DELETE' })).status).toBe(404);
  });

  it.each([
    ['/v1/wallets', () => own.wallet, () => other.wallet],
    ['/v1/categories', () => own.category, () => other.category],
  ])('GET %s solo devuelve lo del usuario', async (path, ownId, otherId) => {
    const ids = ((await (await req(path)).json()) as { id: string }[]).map((r) => r.id);
    expect(ids).toContain(ownId());
    expect(ids).not.toContain(otherId());
  });

  it('resume solo el mes en curso, con gastos por categoría', async () => {
    type Summary = {
      incomeMinor: string;
      expenseMinor: string;
      byCategory: { name: string | null; amountMinor: string }[];
    };
    const summary = async () => (await (await req('/v1/transactions/summary')).json()) as Summary;
    const name = `Resumen ${crypto.randomUUID().slice(0, 8)}`;
    const [cat] = await db
      .insert(categories)
      .values({ userId: me.userId, name, kind: 'expense' })
      .returning();
    if (!cat) throw new Error('seed falló');
    const before = await summary();

    const tx = (kind: 'income' | 'expense', amountMinor: bigint, occurredAt: Date) => ({
      userId: me.userId,
      walletId: own.wallet,
      categoryId: kind === 'expense' ? cat.id : null,
      kind,
      amountMinor,
      occurredAt,
    });
    const now = new Date();
    const lastMonth = new Date(now.getTime() - 45 * 86_400_000);
    await db
      .insert(transactions)
      .values([
        tx('expense', 700n, now),
        tx('expense', 300n, now),
        tx('income', 5000n, now),
        tx('expense', 9999n, lastMonth),
      ]);

    const after = await summary();
    expect(BigInt(after.expenseMinor) - BigInt(before.expenseMinor)).toBe(1000n);
    expect(BigInt(after.incomeMinor) - BigInt(before.incomeMinor)).toBe(5000n);
    expect(after.byCategory.find((c) => c.name === name)?.amountMinor).toBe('1000');
  });

  it('pagina todos los movimientos sin repetir ni saltar, aunque compartan fecha', async () => {
    const sameDate = new Date('2026-06-01T12:00:00Z');
    await db.insert(transactions).values(
      Array.from({ length: 55 }, () => ({
        userId: me.userId,
        walletId: own.wallet,
        kind: 'expense' as const,
        amountMinor: 1n,
        occurredAt: sameDate,
      })),
    );
    const mine = await db.select().from(transactions).where(eq(transactions.userId, me.userId));

    type Row = { id: string; occurredAt: string };
    const seen: string[] = [];
    let query = '';
    for (;;) {
      const page = (await (await req(`/v1/transactions${query}`)).json()) as Row[];
      seen.push(...page.map((t) => t.id));
      const last = page.at(-1);
      if (page.length < 50 || !last) break;
      query = `?before=${encodeURIComponent(last.occurredAt)}&beforeId=${last.id}`;
    }
    expect(seen).toHaveLength(mine.length);
    expect(new Set(seen).size).toBe(mine.length);
  });

  it('borrar un usuario se lleva sus billeteras, movimientos y categorías', async () => {
    const gone = await signUp(app);
    const [wallet] = (await (await gone.request('/v1/wallets')).json()) as { id: string }[];
    await db.insert(transactions).values({
      userId: gone.userId,
      walletId: wallet?.id ?? '',
      kind: 'expense',
      amountMinor: 1n,
      occurredAt: new Date(),
    });

    await deleteUsers(db, [gone.userId]);

    const left = await Promise.all(
      [transactions, wallets, categories].map((t) =>
        db.select().from(t).where(eq(t.userId, gone.userId)),
      ),
    );
    expect(left.map((rows) => rows.length)).toEqual([0, 0, 0]);
  });

  it('responde 400 si llega before sin beforeId', async () => {
    expect((await req('/v1/transactions?before=2026-06-01T12:00:00Z')).status).toBe(400);
  });

  it('trae un movimiento propio por id, pero no el de otro usuario', async () => {
    const { id } = (await (await post(own.wallet, null)).json()) as { id: string };
    const res = await req(`/v1/transactions/${id}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id, amountMinor: '1000' });

    const [theirs] = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.walletId, other.wallet));
    expect((await req(`/v1/transactions/${theirs?.id}`)).status).toBe(404);
  });
});
