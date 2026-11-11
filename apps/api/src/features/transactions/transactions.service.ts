import { type Db, transactions } from '@finanzas/db';
import type { CreateTransactionInput } from '@finanzas/shared';
import { and, desc, eq } from 'drizzle-orm';

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

    async create(userId: string, input: CreateTransactionInput) {
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

    remove(userId: string, id: string) {
      return db
        .delete(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
    },
  };
}
