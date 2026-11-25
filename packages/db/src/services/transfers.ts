import { type CreateTransferInput, createTransferSchema } from '@finanzas/shared';
import { and, desc, eq, gte, inArray, lt } from 'drizzle-orm';
import type { Db } from '../db';
import { monthStart } from '../month';
import { transfers, wallets } from '../schema';

export function transfersService(db: Db) {
  return {
    /**
     * null si alguna billetera no existe, o si las monedas son distintas y no viene cuánto
     * llega. Con la misma moneda llega lo mismo que sale.
     */
    create(raw: CreateTransferInput) {
      const input = createTransferSchema.parse(raw);
      const found = db
        .select({ id: wallets.id, currency: wallets.currency })
        .from(wallets)
        .where(inArray(wallets.id, [input.fromWalletId, input.toWalletId]))
        .all();
      const from = found.find((w) => w.id === input.fromWalletId);
      const to = found.find((w) => w.id === input.toWalletId);
      if (!from || !to) return null;
      const toAmount = from.currency === to.currency ? input.amountMinor : input.toAmountMinor;
      if (!toAmount) return null;
      return db
        .insert(transfers)
        .values({
          fromWalletId: input.fromWalletId,
          toWalletId: input.toWalletId,
          amountMinor: BigInt(input.amountMinor),
          toAmountMinor: BigInt(toAmount),
          occurredAt: new Date(input.occurredAt),
          note: input.note ?? null,
        })
        .returning()
        .get();
    },

    /** null si no existe. */
    get(id: string) {
      return db.select().from(transfers).where(eq(transfers.id, id)).get() ?? null;
    },

    /** Las del mes de Colombia que está `back` meses antes del de `now`, de la más nueva a la más vieja. */
    month(back = 0, now = new Date()) {
      return db
        .select()
        .from(transfers)
        .where(
          and(
            gte(transfers.occurredAt, monthStart(now, back)),
            lt(transfers.occurredAt, monthStart(now, back - 1)),
          ),
        )
        .orderBy(desc(transfers.occurredAt), desc(transfers.id))
        .all();
    },

    /** false si no existe. */
    remove(id: string) {
      return db.delete(transfers).where(eq(transfers.id, id)).returning().all().length > 0;
    },
  };
}
