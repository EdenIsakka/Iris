import { setBudgetSchema } from '@finanzas/shared';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import type { Db } from '../db';
import { dayOfMonth, monthKey, monthStart } from '../month';
import { budgets, categories, transactions } from '../schema';
import { inCop } from './trm';

/** 'YYYY-MM-01' del mes en curso (hora de Colombia). */
const currentPeriod = (now: Date) => `${monthKey(now)}-01`;

/**
 * Un tope vale desde su mes (period) hasta que otro más nuevo lo reemplace, así cambiarlo
 * no toca los meses pasados. Quitarlo guarda un tope de 0 para este mes, que significa "sin tope".
 */
export function budgetsService(db: Db) {
  /** Fija el tope de este mes; null si la categoría no existe o no es de gasto. */
  function setForThisMonth(categoryId: string, limitMinor: bigint, now = new Date()) {
    const category = db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.kind, 'expense')))
      .get();
    if (!category) return null;
    db.insert(budgets)
      .values({ categoryId, period: currentPeriod(now), limitMinor })
      .onConflictDoUpdate({ target: [budgets.categoryId, budgets.period], set: { limitMinor } })
      .run();
    return { categoryId, limitMinor };
  }

  return {
    /**
     * Topes vigentes este mes con lo gastado en cada categoría, por nombre, y cuánto se puede
     * gastar por día de aquí a fin de mes (hoy cuenta).
     */
    list(now = new Date()) {
      const rows = db
        .select({
          categoryId: budgets.categoryId,
          name: categories.name,
          limitMinor: budgets.limitMinor,
        })
        .from(budgets)
        .innerJoin(categories, eq(categories.id, budgets.categoryId))
        .where(lte(budgets.period, currentPeriod(now)))
        .orderBy(desc(budgets.period))
        .all();
      // El primero de cada categoría es el más nuevo.
      const latest = new Map<string, (typeof rows)[number]>();
      for (const row of rows) if (!latest.has(row.categoryId)) latest.set(row.categoryId, row);
      const spent = db
        .select({
          categoryId: transactions.categoryId,
          total:
            sql<bigint>`coalesce(sum(${inCop(transactions.amountMinor, transactions.currency)}), 0)`.mapWith(
              BigInt,
            ),
        })
        .from(transactions)
        .where(and(eq(transactions.kind, 'expense'), gte(transactions.occurredAt, monthStart(now))))
        .groupBy(transactions.categoryId)
        .all();
      const { day, days } = dayOfMonth(now);
      const daysLeft = BigInt(days - day + 1);
      return [...latest.values()]
        .filter((b) => b.limitMinor > 0n)
        .map((b) => {
          const spentMinor = spent.find((s) => s.categoryId === b.categoryId)?.total ?? 0n;
          const left = b.limitMinor - spentMinor;
          return { ...b, spentMinor, perDayMinor: left > 0n ? left / daysLeft : 0n };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    },

    set(categoryId: string, limitMinor: string, now = new Date()) {
      return setForThisMonth(
        categoryId,
        BigInt(setBudgetSchema.parse({ limitMinor }).limitMinor),
        now,
      );
    },

    /** Quita el tope desde este mes; false si la categoría no existe o no es de gasto. */
    remove(categoryId: string, now = new Date()) {
      return setForThisMonth(categoryId, 0n, now) !== null;
    },
  };
}
