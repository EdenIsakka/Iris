import { categories, type Db, transactions, wallets } from '@finanzas/db';
import type { CreateTransactionInput } from '@finanzas/shared';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { monthStart } from '../../lib/month';

/** Lógica de negocio sin saber nada de HTTP: fácil de probar y reutilizar. */
// note null la borra al editar; undefined la dejaría como estaba.
const toRow = (input: CreateTransactionInput) => ({
  walletId: input.walletId,
  categoryId: input.categoryId,
  kind: input.kind,
  amountMinor: BigInt(input.amountMinor),
  currency: input.currency,
  occurredAt: new Date(input.occurredAt),
  note: input.note ?? null,
});

export function transactionsService(db: Db) {
  /** La billetera es del usuario, y la categoría (si hay) también y es del mismo tipo. */
  async function ownsRefs(userId: string, input: CreateTransactionInput) {
    const [wallet] = await db
      .select({ id: wallets.id })
      .from(wallets)
      .where(and(eq(wallets.id, input.walletId), eq(wallets.userId, userId)));
    if (!wallet) return false;
    if (!input.categoryId) return true;
    const [category] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.id, input.categoryId),
          eq(categories.userId, userId),
          eq(categories.kind, input.kind),
        ),
      );
    return Boolean(category);
  }

  return {
    list(userId: string, limit = 50) {
      return db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.occurredAt))
        .limit(limit);
    },

    /** Devuelve null si la billetera o la categoría no existen, son de otro usuario o la categoría es de otro tipo. */
    async create(userId: string, input: CreateTransactionInput) {
      if (!(await ownsRefs(userId, input))) return null;
      const [row] = await db
        .insert(transactions)
        .values({ userId, ...toRow(input) })
        .returning();
      return row;
    },

    /** Reemplaza todos los campos. Devuelve null si el movimiento no es suyo o las referencias no valen. */
    async update(userId: string, id: string, input: CreateTransactionInput) {
      if (!(await ownsRefs(userId, input))) return null;
      const [row] = await db
        .update(transactions)
        .set(toRow(input))
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
        .returning();
      return row ?? null;
    },

    /** Ingresos, gastos y gastos por categoría del mes en curso (hora de Colombia). */
    async monthSummary(userId: string) {
      const total = sql<bigint>`coalesce(sum(${transactions.amountMinor}), 0)`.mapWith(BigInt);
      const thisMonth = and(
        eq(transactions.userId, userId),
        gte(transactions.occurredAt, monthStart),
      );
      const [byKind, byCategory] = await Promise.all([
        db
          .select({ kind: transactions.kind, total })
          .from(transactions)
          .where(thisMonth)
          .groupBy(transactions.kind),
        db
          .select({ id: categories.id, name: categories.name, amountMinor: total })
          .from(transactions)
          .leftJoin(categories, eq(categories.id, transactions.categoryId))
          .where(and(thisMonth, eq(transactions.kind, 'expense')))
          .groupBy(categories.id, categories.name)
          .orderBy(desc(total)),
      ]);
      const sumOf = (kind: string) => byKind.find((r) => r.kind === kind)?.total ?? 0n;
      return { incomeMinor: sumOf('income'), expenseMinor: sumOf('expense'), byCategory };
    },

    /** Devuelve false si no existe o es de otro usuario. */
    async remove(userId: string, id: string) {
      const rows = await db
        .delete(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
        .returning({ id: transactions.id });
      return rows.length > 0;
    },
  };
}
