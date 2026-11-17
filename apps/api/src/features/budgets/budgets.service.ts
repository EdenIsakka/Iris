import { budgets, categories, type Db, transactions } from '@finanzas/db';
import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { currentPeriod, monthStart } from '../../lib/month';

/**
 * Un tope vale desde su mes (period) hasta que otro más nuevo lo reemplace, así cambiarlo
 * no toca los meses pasados. Quitarlo guarda un tope de 0 para este mes, que significa "sin tope".
 */
export function budgetsService(db: Db) {
  /** Fija el tope de este mes; null si la categoría no es un gasto del usuario. */
  async function setForThisMonth(userId: string, categoryId: string, limitMinor: bigint) {
    const [category] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.id, categoryId),
          eq(categories.userId, userId),
          eq(categories.kind, 'expense'),
        ),
      );
    if (!category) return null;
    await db
      .insert(budgets)
      .values({ userId, categoryId, period: currentPeriod, limitMinor })
      .onConflictDoUpdate({
        target: [budgets.userId, budgets.categoryId, budgets.period],
        set: { limitMinor },
      });
    return { categoryId, limitMinor };
  }

  return {
    /** Topes vigentes este mes con lo gastado en cada categoría, por nombre. */
    async list(userId: string) {
      const total = sql<bigint>`coalesce(sum(${transactions.amountMinor}), 0)`.mapWith(BigInt);
      const [latest, spent] = await Promise.all([
        db
          .selectDistinctOn([budgets.categoryId], {
            categoryId: budgets.categoryId,
            name: categories.name,
            limitMinor: budgets.limitMinor,
          })
          .from(budgets)
          .innerJoin(categories, eq(categories.id, budgets.categoryId))
          .where(and(eq(budgets.userId, userId), lte(budgets.period, currentPeriod)))
          .orderBy(asc(budgets.categoryId), desc(budgets.period)),
        db
          .select({ categoryId: transactions.categoryId, total })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, userId),
              eq(transactions.kind, 'expense'),
              gte(transactions.occurredAt, monthStart),
            ),
          )
          .groupBy(transactions.categoryId),
      ]);
      return latest
        .filter((b) => b.limitMinor > 0n)
        .map((b) => ({
          ...b,
          spentMinor: spent.find((s) => s.categoryId === b.categoryId)?.total ?? 0n,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },

    set: setForThisMonth,

    /** Quita el tope desde este mes; false si la categoría no es un gasto del usuario. */
    async remove(userId: string, categoryId: string) {
      return (await setForThisMonth(userId, categoryId, 0n)) !== null;
    },
  };
}
