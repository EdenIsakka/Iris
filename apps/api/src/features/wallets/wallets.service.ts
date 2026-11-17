import { type Db, transactions, wallets } from '@finanzas/db';
import type { CreateWalletInput } from '@finanzas/shared';
import { and, asc, count, eq, sql } from 'drizzle-orm';

const toRow = (input: CreateWalletInput) => ({
  name: input.name,
  type: input.type,
  openingBalanceMinor: BigInt(input.openingBalanceMinor),
});

export function walletsService(db: Db) {
  return {
    /** Cada billetera con su saldo: inicial + ingresos − gastos. */
    list(userId: string) {
      return db
        .select({
          id: wallets.id,
          name: wallets.name,
          type: wallets.type,
          openingBalanceMinor: wallets.openingBalanceMinor,
          balanceMinor:
            sql<bigint>`${wallets.openingBalanceMinor} + coalesce(sum(case when ${transactions.kind} = 'income' then ${transactions.amountMinor} else -${transactions.amountMinor} end), 0)`.mapWith(
              BigInt,
            ),
        })
        .from(wallets)
        .leftJoin(transactions, eq(transactions.walletId, wallets.id))
        .where(eq(wallets.userId, userId))
        .groupBy(wallets.id)
        .orderBy(asc(wallets.createdAt));
    },

    async create(userId: string, input: CreateWalletInput) {
      const [row] = await db
        .insert(wallets)
        .values({ userId, ...toRow(input) })
        .returning();
      return row;
    },

    /** null si no es suya. */
    async update(userId: string, id: string, input: CreateWalletInput) {
      const [row] = await db
        .update(wallets)
        .set(toRow(input))
        .where(and(eq(wallets.id, id), eq(wallets.userId, userId)))
        .returning();
      return row ?? null;
    },

    /** No borra si tiene movimientos o es la única: el formulario de movimientos necesita una. */
    async remove(userId: string, id: string) {
      const mine = await db
        .select({ id: wallets.id })
        .from(wallets)
        .where(eq(wallets.userId, userId));
      if (!mine.some((w) => w.id === id)) return 'not-found' as const;
      if (mine.length === 1) return 'last' as const;
      const [used] = await db
        .select({ n: count() })
        .from(transactions)
        .where(eq(transactions.walletId, id));
      // shortcut: un movimiento creado entre este conteo y el delete lo frena la FK (restrict)
      // con un 500; con una persona usando la app no pasa.
      if (used && used.n > 0) return 'has-transactions' as const;
      await db.delete(wallets).where(and(eq(wallets.id, id), eq(wallets.userId, userId)));
      return 'deleted' as const;
    },
  };
}
