import { type Db, goalContributions, goals } from '@finanzas/db';
import type { CreateGoalInput } from '@finanzas/shared';
import { and, eq, sql } from 'drizzle-orm';

export function goalsService(db: Db) {
  return {
    /** Devuelve cada meta con su progreso (suma de aportes). */
    list(userId: string) {
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
        .where(eq(goals.userId, userId))
        .groupBy(goals.id);
    },

    async create(userId: string, input: CreateGoalInput) {
      const [row] = await db
        .insert(goals)
        .values({
          userId,
          name: input.name,
          targetMinor: BigInt(input.targetMinor),
          deadline: input.deadline,
        })
        .returning();
      return row;
    },

    async contribute(userId: string, goalId: string, amountMinor: string) {
      const [goal] = await db
        .select({ id: goals.id })
        .from(goals)
        .where(and(eq(goals.id, goalId), eq(goals.userId, userId)));
      if (!goal) return null;
      const [row] = await db
        .insert(goalContributions)
        .values({ goalId, amountMinor: BigInt(amountMinor) })
        .returning();
      return row;
    },
  };
}
