import {
  type CreateTransactionInput,
  createTransactionSchema,
  TRANSACTIONS_PAGE_SIZE,
} from '@finanzas/shared';
import { and, desc, eq, gte, lt, sql } from 'drizzle-orm';
import type { Db } from '../db';
import { BOGOTA_OFFSET_MS, monthKey, monthStart } from '../month';
import { categories, transactions, wallets } from '../schema';
import { inCop } from './trm';

/** Desde dónde sigue la página: el último movimiento que ya se mostró. */
export type TransactionsPage = { before: Date; beforeId: string };

/** Suma en pesos: los movimientos en USD pasan con la TRM (ver `inCop`). */
const total = () =>
  sql<bigint>`coalesce(sum(${inCop(transactions.amountMinor, transactions.currency)}), 0)`.mapWith(
    BigInt,
  );

export function transactionsService(db: Db) {
  /**
   * Valida la entrada y arma la fila. null si la billetera no existe, o si la categoría no
   * existe o es de otro tipo. La moneda sale de la billetera.
   */
  function toRow(raw: CreateTransactionInput) {
    const input = createTransactionSchema.parse(raw);
    const wallet = db
      .select({ currency: wallets.currency })
      .from(wallets)
      .where(eq(wallets.id, input.walletId))
      .get();
    if (!wallet) return null;
    if (input.categoryId) {
      const category = db
        .select({ id: categories.id })
        .from(categories)
        .where(and(eq(categories.id, input.categoryId), eq(categories.kind, input.kind)))
        .get();
      if (!category) return null;
    }
    return {
      walletId: input.walletId,
      categoryId: input.categoryId,
      kind: input.kind,
      amountMinor: BigInt(input.amountMinor),
      currency: wallet.currency,
      occurredAt: new Date(input.occurredAt),
      // null la borra al editar; undefined la dejaría como estaba.
      note: input.note ?? null,
    };
  }

  return {
    /** Una página, del más nuevo al más viejo; `page` dice desde dónde seguir. */
    list(page?: TransactionsPage, limit = TRANSACTIONS_PAGE_SIZE) {
      return db
        .select()
        .from(transactions)
        .where(
          page
            ? sql`(${transactions.occurredAt}, ${transactions.id}) < (${page.before.getTime()}, ${page.beforeId})`
            : undefined,
        )
        .orderBy(desc(transactions.occurredAt), desc(transactions.id))
        .limit(limit)
        .all();
    },

    /** null si no existe. */
    get(id: string) {
      return db.select().from(transactions).where(eq(transactions.id, id)).get() ?? null;
    },

    /** null si la billetera o la categoría no valen. */
    create(input: CreateTransactionInput) {
      const row = toRow(input);
      return row ? db.insert(transactions).values(row).returning().get() : null;
    },

    /** Reemplaza todos los campos. null si no existe o las referencias no valen. */
    update(id: string, input: CreateTransactionInput) {
      const row = toRow(input);
      if (!row) return null;
      return (
        db.update(transactions).set(row).where(eq(transactions.id, id)).returning().get() ?? null
      );
    },

    /**
     * Ingresos, gastos y gastos por categoría del mes en curso (hora de Colombia), o del que está
     * `back` meses antes.
     */
    monthSummary(now = new Date(), back = 0) {
      const thisMonth = and(
        gte(transactions.occurredAt, monthStart(now, back)),
        back ? lt(transactions.occurredAt, monthStart(now, back - 1)) : undefined,
      );
      const byKind = db
        .select({ kind: transactions.kind, total: total() })
        .from(transactions)
        .where(thisMonth)
        .groupBy(transactions.kind)
        .all();
      const byCategory = db
        .select({ id: categories.id, name: categories.name, amountMinor: total() })
        .from(transactions)
        .leftJoin(categories, eq(categories.id, transactions.categoryId))
        .where(and(thisMonth, eq(transactions.kind, 'expense')))
        .groupBy(categories.id, categories.name)
        .orderBy(desc(total()))
        .all();
      const sumOf = (kind: string) => byKind.find((r) => r.kind === kind)?.total ?? 0n;
      return { incomeMinor: sumOf('income'), expenseMinor: sumOf('expense'), byCategory };
    },

    /** Ingresos y gastos de los últimos `months` meses (hora de Colombia), con 0 en los vacíos. */
    monthly(months = 6, now = new Date()) {
      const month = sql<string>`strftime('%Y-%m', (${transactions.occurredAt} - ${BOGOTA_OFFSET_MS}) / 1000, 'unixepoch')`;
      const rows = db
        .select({ month, kind: transactions.kind, total: total() })
        .from(transactions)
        .where(gte(transactions.occurredAt, monthStart(now, months - 1)))
        .groupBy(month, transactions.kind)
        .all();
      const sumOf = (key: string, kind: string) =>
        rows.find((r) => r.month === key && r.kind === kind)?.total ?? 0n;
      return Array.from({ length: months }, (_, i) => {
        const key = monthKey(monthStart(now, months - 1 - i));
        return {
          month: key,
          incomeMinor: sumOf(key, 'income'),
          expenseMinor: sumOf(key, 'expense'),
        };
      });
    },

    /** false si no existe. */
    remove(id: string) {
      return db.delete(transactions).where(eq(transactions.id, id)).returning().all().length > 0;
    },
  };
}
