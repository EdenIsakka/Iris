import { type CreateWalletInput, createWalletSchema } from '@finanzas/shared';
import { asc, count, eq, sql } from 'drizzle-orm';
import type { Db } from '../db';
import { transactions, wallets } from '../schema';

const toRow = (raw: CreateWalletInput) => {
  const input = createWalletSchema.parse(raw);
  return {
    name: input.name,
    type: input.type,
    openingBalanceMinor: BigInt(input.openingBalanceMinor),
  };
};

export function walletsService(db: Db) {
  return {
    /** Cada billetera con su saldo: inicial + ingresos − gastos. */
    list() {
      return db
        .select({
          id: wallets.id,
          name: wallets.name,
          type: wallets.type,
          currency: wallets.currency,
          openingBalanceMinor: wallets.openingBalanceMinor,
          balanceMinor:
            sql<bigint>`${wallets.openingBalanceMinor} + coalesce(sum(case when ${transactions.kind} = 'income' then ${transactions.amountMinor} else -${transactions.amountMinor} end), 0)`.mapWith(
              BigInt,
            ),
        })
        .from(wallets)
        .leftJoin(transactions, eq(transactions.walletId, wallets.id))
        .groupBy(wallets.id)
        .orderBy(asc(wallets.createdAt))
        .all();
    },

    create(input: CreateWalletInput) {
      return db.insert(wallets).values(toRow(input)).returning().get();
    },

    /** null si no existe. */
    update(id: string, input: CreateWalletInput) {
      return (
        db.update(wallets).set(toRow(input)).where(eq(wallets.id, id)).returning().get() ?? null
      );
    },

    /** No borra si tiene movimientos o es la única: el formulario de movimientos necesita una. */
    remove(id: string) {
      const all = db.select({ id: wallets.id }).from(wallets).all();
      if (!all.some((w) => w.id === id)) return 'not-found' as const;
      if (all.length === 1) return 'last' as const;
      const used = db
        .select({ n: count() })
        .from(transactions)
        .where(eq(transactions.walletId, id))
        .get();
      if (used && used.n > 0) return 'has-transactions' as const;
      db.delete(wallets).where(eq(wallets.id, id)).run();
      return 'deleted' as const;
    },
  };
}
