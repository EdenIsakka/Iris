import { type CreateWalletInput, createWalletSchema } from '@finanzas/shared';
import { asc, count, eq, or, sql } from 'drizzle-orm';
import type { Db } from '../db';
import { transactions, transfers, wallets } from '../schema';

const toRow = (raw: CreateWalletInput) => {
  const input = createWalletSchema.parse(raw);
  return {
    name: input.name,
    type: input.type,
    currency: input.currency,
    openingBalanceMinor: BigInt(input.openingBalanceMinor),
  };
};

export function walletsService(db: Db) {
  return {
    /** Cada billetera con su saldo: inicial + ingresos − gastos − lo que salió + lo que llegó. */
    list() {
      return db
        .select({
          id: wallets.id,
          name: wallets.name,
          type: wallets.type,
          currency: wallets.currency,
          openingBalanceMinor: wallets.openingBalanceMinor,
          // Subconsultas y no join: con dos tablas sumadas a la vez, cada fila se contaría de más.
          // Nombres con tabla a mano: Drizzle los deja sin tabla y "id" sería el de la subconsulta.
          balanceMinor: sql<bigint>`wallets.opening_balance_minor
            + (select coalesce(sum(case when t.kind = 'income' then t.amount_minor else -t.amount_minor end), 0)
               from transactions t where t.wallet_id = wallets.id)
            - (select coalesce(sum(f.amount_minor), 0) from transfers f where f.from_wallet_id = wallets.id)
            + (select coalesce(sum(f.to_amount_minor), 0) from transfers f where f.to_wallet_id = wallets.id)`.mapWith(
            BigInt,
          ),
        })
        .from(wallets)
        .orderBy(asc(wallets.createdAt))
        .all();
    },

    create(input: CreateWalletInput) {
      return db.insert(wallets).values(toRow(input)).returning().get();
    },

    /** null si no existe. */
    update(id: string, input: CreateWalletInput) {
      return (
        // La moneda no cambia: sus movimientos ya están en ella. Drizzle omite los undefined.
        db
          .update(wallets)
          .set({ ...toRow(input), currency: undefined })
          .where(eq(wallets.id, id))
          .returning()
          .get() ?? null
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
      const moved = db
        .select({ n: count() })
        .from(transfers)
        .where(or(eq(transfers.fromWalletId, id), eq(transfers.toWalletId, id)))
        .get();
      if ((used && used.n > 0) || (moved && moved.n > 0)) return 'has-transactions' as const;
      db.delete(wallets).where(eq(wallets.id, id)).run();
      return 'deleted' as const;
    },
  };
}
