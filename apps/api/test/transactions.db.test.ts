import { categories, createDb, wallets } from '@finanzas/db';
import { inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';

// Necesita Postgres con migraciones: corre en CI y en local con DATABASE_URL definida.
const url = process.env.DATABASE_URL;

describe.skipIf(!url)('Datos por usuario contra Postgres', () => {
  const db = createDb(url ?? '');
  const app = createApp({ db, corsOrigin: '*' });
  const walletIds: string[] = [];
  const categoryIds: string[] = [];
  let own = { wallet: '', category: '' };
  let other = { wallet: '', category: '' };

  async function seedUser(userId: string) {
    const [w] = await db.insert(wallets).values({ userId, name: 'Test', type: 'bank' }).returning();
    const [c] = await db
      .insert(categories)
      .values({ userId, name: 'Test', kind: 'expense' })
      .returning();
    if (!w || !c) throw new Error('seed falló');
    walletIds.push(w.id);
    categoryIds.push(c.id);
    return { wallet: w.id, category: c.id };
  }

  beforeAll(async () => {
    own = await seedUser('demo-user'); // el usuario que pone el middleware en desarrollo
    other = await seedUser(`otro-${crypto.randomUUID()}`);
  });

  afterAll(async () => {
    // La cascada de wallets borra las transacciones creadas aquí.
    await db.delete(wallets).where(inArray(wallets.id, walletIds));
    await db.delete(categories).where(inArray(categories.id, categoryIds));
    await db.$client.end();
  });

  const post = (walletId: string, categoryId: string | null) =>
    app.request('/v1/transactions', {
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

  const postCategory = (body: unknown) =>
    app.request('/v1/categories', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('crea una categoría propia y no la duplica', async () => {
    const name = `Mascotas ${crypto.randomUUID().slice(0, 8)}`;
    const first = await postCategory({ name, kind: 'expense' });
    expect(first.status).toBe(201);
    const { id } = (await first.json()) as { id: string };
    categoryIds.push(id);

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

  it.each([
    ['/v1/wallets', () => own.wallet, () => other.wallet],
    ['/v1/categories', () => own.category, () => other.category],
  ])('GET %s solo devuelve lo del usuario', async (path, ownId, otherId) => {
    const ids = ((await (await app.request(path)).json()) as { id: string }[]).map((r) => r.id);
    expect(ids).toContain(ownId());
    expect(ids).not.toContain(otherId());
  });
});
