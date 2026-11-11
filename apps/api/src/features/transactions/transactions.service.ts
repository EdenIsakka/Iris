import { categories, type Db, transactions, wallets } from '@finanzas/db';
import type { CreateTransactionInput } from '@finanzas/shared';
import { and, desc, eq, gte, sql } from 'drizzle-orm';

// shortcut: zona fija de Colombia (MVP solo COP); pasarla por usuario si se abre a otros países.
const TZ = 'America/Bogota';

/** Lógica de negocio sin saber nada de HTTP: fácil de probar y reutilizar. */
export function transactionsService(db: Db) {
  return {
    list(userId: string, limit = 50) {
      return db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.occurredAt))
        .limit(limit);
    },

    /** Devuelve null si la billetera o la categoría no existen o son de otro usuario. */
    async create(userId: string, input: CreateTransactionInput) {
      const [wallet] = await db
        .select({ id: wallets.id })
        .from(wallets)
        .where(and(eq(wallets.id, input.walletId), eq(wallets.userId, userId)));
      if (!wallet) return null;
      if (input.categoryId) {
        const [category] = await db
          .select({ id: categories.id })
          .from(categories)
          .where(and(eq(categories.id, input.categoryId), eq(categories.userId, userId)));
        if (!category) return null;
      }
      const [row] = await db
        .insert(transactions)
        .values({
          userId,
          walletId: input.walletId,
          categoryId: input.categoryId,
          kind: input.kind,
          amountMinor: BigInt(input.amountMinor),
          currency: input.currency,
          occurredAt: new Date(input.occurredAt),
          note: input.note,
        })
        .returning();
      return row;
    },

    /** Ingresos, gastos y gastos por categoría del mes en curso (hora de Colombia). */
    async monthSummary(userId: string) {
      const total = sql<bigint>`coalesce(sum(${transactions.amountMinor}), 0)`.mapWith(BigInt);
      const thisMonth = and(
        eq(transactions.userId, userId),
        gte(
          transactions.occurredAt,
          sql`date_trunc('month', now() at time zone ${TZ}) at time zone ${TZ}`,
        ),
      );
      const [byKind, byCategory] = await Promise.all([
        db
          .select({ kind: transactions.kind, total })
          .from(transactions)
          .where(thisMonth)
          .groupBy(transactions.kind),
        db
          .select({ name: categories.name, amountMinor: total })
          .from(transactions)
          .leftJoin(categories, eq(categories.id, transactions.categoryId))
          .where(and(thisMonth, eq(transactions.kind, 'expense')))
          .groupBy(categories.id, categories.name)
          .orderBy(desc(total)),
      ]);
      const sumOf = (kind: string) => byKind.find((r) => r.kind === kind)?.total ?? 0n;
      return { incomeMinor: sumOf('income'), expenseMinor: sumOf('expense'), byCategory };
    },

    remove(userId: string, id: string) {
      return db
        .delete(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
    },
  };
}
