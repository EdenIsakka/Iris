import { categories, type Db, transactions, wallets } from '@finanzas/db';
import {
  type CreateTransactionInput,
  TRANSACTIONS_PAGE_SIZE,
  type TransactionsPageQuery,
} from '@finanzas/shared';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { monthStart, TZ } from '../../lib/month';

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
    /** Una página, de la más nueva a la más vieja; `page` dice desde dónde seguir. */
    list(userId: string, page: TransactionsPageQuery = {}, limit = TRANSACTIONS_PAGE_SIZE) {
      return db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            page.before && page.beforeId
              ? sql`(${transactions.occurredAt}, ${transactions.id}) < (${page.before}::timestamptz, ${page.beforeId}::uuid)`
              : undefined,
          ),
        )
        .orderBy(desc(transactions.occurredAt), desc(transactions.id))
        .limit(limit);
    },

    /** null si no existe o es de otro usuario. */
    async get(userId: string, id: string) {
      const [row] = await db
        .select()
        .from(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
      return row ?? null;
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

    /** Ingresos y gastos de los últimos `months` meses (hora de Colombia), con 0 en los vacíos. */
    async monthly(userId: string, months = 6) {
      const thisMonth = sql`date_trunc('month', now() at time zone ${TZ})`;
      const rows = await db.execute<{ month: string; income: string; expense: string }>(sql`
        select to_char(m, 'YYYY-MM') as month,
          coalesce(sum(${transactions.amountMinor}) filter (where ${transactions.kind} = 'income'), 0) as income,
          coalesce(sum(${transactions.amountMinor}) filter (where ${transactions.kind} = 'expense'), 0) as expense
        from generate_series(${thisMonth} - make_interval(months => ${months - 1}), ${thisMonth}, interval '1 month') as m
        left join ${transactions} on ${transactions.userId} = ${userId}
          and ${transactions.occurredAt} >= m at time zone ${TZ}
          and ${transactions.occurredAt} < (m + interval '1 month') at time zone ${TZ}
        group by m
        order by m`);
      return rows.map((r) => ({
        month: r.month,
        incomeMinor: BigInt(r.income),
        expenseMinor: BigInt(r.expense),
      }));
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
