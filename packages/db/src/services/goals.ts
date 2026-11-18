import { amountMinor, type CreateGoalInput, createGoalSchema } from '@finanzas/shared';
import { and, eq, sql } from 'drizzle-orm';
import type { Db } from '../db';
import { goalContributions, goals } from '../schema';

export function goalsService(db: Db) {
  const savedOf = (goalId: string) =>
    db
      .select({
        total: sql<bigint>`coalesce(sum(${goalContributions.amountMinor}), 0)`.mapWith(BigInt),
      })
      .from(goalContributions)
      .where(eq(goalContributions.goalId, goalId))
      .get()?.total ?? 0n;

  return {
    /** Cada meta con su progreso (suma de aportes). */
    list() {
      return db
        .select({
          id: goals.id,
          name: goals.name,
          targetMinor: goals.targetMinor,
          currency: goals.currency,
          deadline: goals.deadline,
          status: goals.status,
          savedMinor: sql<bigint>`coalesce(sum(${goalContributions.amountMinor}), 0)`.mapWith(
            BigInt,
          ),
        })
        .from(goals)
        .leftJoin(goalContributions, eq(goalContributions.goalId, goals.id))
        .groupBy(goals.id)
        .all();
    },

    create(raw: CreateGoalInput) {
      const input = createGoalSchema.parse(raw);
      return db
        .insert(goals)
        .values({
          name: input.name,
          targetMinor: BigInt(input.targetMinor),
          deadline: input.deadline ?? null,
        })
        .returning()
        .get();
    },

    /** Cambia nombre y monto; el estado se recalcula contra lo ahorrado. null si no existe. */
    update(id: string, raw: CreateGoalInput) {
      const input = createGoalSchema.parse(raw);
      const target = BigInt(input.targetMinor);
      return (
        db
          .update(goals)
          .set({
            name: input.name,
            targetMinor: target,
            deadline: input.deadline ?? null,
            status: target <= savedOf(id) ? 'completed' : 'active',
          })
          .where(eq(goals.id, id))
          .returning()
          .get() ?? null
      );
    },

    /** Borra la meta y sus aportes (cascada). false si no existe. */
    remove(id: string) {
      return db.delete(goals).where(eq(goals.id, id)).returning().all().length > 0;
    },

    /** Suma un aporte y marca la meta cumplida si llegó. null si la meta no existe. */
    contribute(goalId: string, raw: string) {
      const amount = BigInt(amountMinor.parse(raw));
      const goal = db.select({ id: goals.id }).from(goals).where(eq(goals.id, goalId)).get();
      if (!goal) return null;
      return db.transaction((tx) => {
        const row = tx
          .insert(goalContributions)
          .values({ goalId, amountMinor: amount })
          .returning()
          .get();
        tx.update(goals)
          .set({ status: 'completed' })
          .where(
            and(
              eq(goals.id, goalId),
              eq(goals.status, 'active'),
              sql`${goals.targetMinor} <= (select sum(${goalContributions.amountMinor}) from ${goalContributions} where ${goalContributions.goalId} = ${goalId})`,
            ),
          )
          .run();
        return row;
      });
    },
  };
}
