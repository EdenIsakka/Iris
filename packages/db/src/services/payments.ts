import { type SavePaymentInput, savePaymentSchema } from '@finanzas/shared';
import { and, asc, eq } from 'drizzle-orm';
import type { Db } from '../db';
import { categories, scheduledPayments, wallets } from '../schema';
import { transactionsService } from './transactions';
import { walletsService } from './wallets';

/** La misma fecha el mes siguiente; si el mes no tiene ese día, el último (31 → 28 de feb). */
export function nextMonth(date: string, dayOfMonth: number) {
  const [y = 0, m = 1] = date.split('-').map(Number);
  // Con `m` contando enero = 1: Date.UTC(y, m, d) cae en el mes siguiente, y el día 0 de dos
  // meses después es el último día de ese mes siguiente.
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(dayOfMonth, lastDay))).toISOString().slice(0, 10);
}

export function paymentsService(db: Db) {
  /** Valida y arma la fila. null si la billetera no existe o la categoría no es de gasto. */
  function toRow(raw: SavePaymentInput) {
    const input = savePaymentSchema.parse(raw);
    const wallet = db
      .select({ id: wallets.id })
      .from(wallets)
      .where(eq(wallets.id, input.walletId))
      .get();
    if (!wallet) return null;
    if (input.categoryId) {
      const category = db
        .select({ id: categories.id })
        .from(categories)
        .where(and(eq(categories.id, input.categoryId), eq(categories.kind, 'expense')))
        .get();
      if (!category) return null;
    }
    return {
      name: input.name,
      amountMinor: BigInt(input.amountMinor),
      walletId: input.walletId,
      categoryId: input.categoryId,
      dueDate: input.dueDate,
      dayOfMonth: Number(input.dueDate.slice(8)),
      repeat: input.repeat,
    };
  }

  return {
    /**
     * Los pagos por fecha, cada uno con lo que quedaría en su billetera después de hacerlo y de
     * los anteriores de la misma billetera. Negativo: no alcanza.
     */
    list() {
      const rows = db
        .select({
          id: scheduledPayments.id,
          name: scheduledPayments.name,
          amountMinor: scheduledPayments.amountMinor,
          walletId: scheduledPayments.walletId,
          categoryId: scheduledPayments.categoryId,
          dueDate: scheduledPayments.dueDate,
          repeat: scheduledPayments.repeat,
        })
        .from(scheduledPayments)
        .orderBy(asc(scheduledPayments.dueDate), asc(scheduledPayments.createdAt))
        .all();
      const left = new Map(
        walletsService(db)
          .list()
          .map((w) => [w.id, w]),
      );
      return rows.flatMap((p) => {
        const wallet = left.get(p.walletId);
        if (!wallet) return [];
        const leftMinor = wallet.balanceMinor - p.amountMinor;
        left.set(p.walletId, { ...wallet, balanceMinor: leftMinor });
        return [{ ...p, walletName: wallet.name, currency: wallet.currency, leftMinor }];
      });
    },

    /** null si la billetera o la categoría no valen. */
    create(input: SavePaymentInput) {
      const row = toRow(input);
      return row ? db.insert(scheduledPayments).values(row).returning().get() : null;
    },

    /**
     * null si no existe o las referencias no valen. Si la fecha no cambió, se queda el día
     * original: uno del 31 que va en el 28 de febrero vuelve al 31 en marzo.
     */
    update(id: string, input: SavePaymentInput) {
      const row = toRow(input);
      if (!row) return null;
      const before = db
        .select({ dueDate: scheduledPayments.dueDate, dayOfMonth: scheduledPayments.dayOfMonth })
        .from(scheduledPayments)
        .where(eq(scheduledPayments.id, id))
        .get();
      if (before?.dueDate === row.dueDate) row.dayOfMonth = before.dayOfMonth;
      return (
        db
          .update(scheduledPayments)
          .set(row)
          .where(eq(scheduledPayments.id, id))
          .returning()
          .get() ?? null
      );
    },

    /** false si no existe. */
    remove(id: string) {
      return (
        db.delete(scheduledPayments).where(eq(scheduledPayments.id, id)).returning().all().length >
        0
      );
    },

    /**
     * Lo registra como gasto de hoy. Si es mensual pasa al mes siguiente; si es de una vez, se
     * borra. false si no existe.
     */
    pay(id: string, now = new Date()) {
      const p = db.select().from(scheduledPayments).where(eq(scheduledPayments.id, id)).get();
      if (!p) return false;
      db.transaction((tx) => {
        const created = transactionsService(tx).create({
          walletId: p.walletId,
          categoryId: p.categoryId,
          kind: 'expense',
          amountMinor: p.amountMinor.toString(),
          occurredAt: now.toISOString(),
          note: p.name,
        });
        if (!created) throw new Error('La billetera de este pago ya no existe.');
        if (p.repeat === 'once') {
          tx.delete(scheduledPayments).where(eq(scheduledPayments.id, id)).run();
        } else {
          tx.update(scheduledPayments)
            .set({ dueDate: nextMonth(p.dueDate, p.dayOfMonth) })
            .where(eq(scheduledPayments.id, id))
            .run();
        }
      });
      return true;
    },
  };
}
