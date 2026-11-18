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

    /** Cambia nombre y monto; el estado se recalcula contra lo ahorrado. null si no es suya. */
    async update(userId: string, id: string, input: CreateGoalInput) {
      const target = BigInt(input.targetMinor);
      const saved = sql`(select coalesce(sum(${goalContributions.amountMinor}), 0) from ${goalContributions} where ${goalContributions.goalId} = ${goals.id})`;
      const [row] = await db
        .update(goals)
        .set({
          name: input.name,
          targetMinor: target,
          deadline: input.deadline ?? null,
          status: sql`case when ${target} <= ${saved} then 'completed'::goal_status else 'active'::goal_status end`,
        })
        .where(and(eq(goals.id, id), eq(goals.userId, userId)))
        .returning();
      return row ?? null;
    },

    /** Borra la meta y sus aportes (cascada). false si no existe o no es suya. */
    async remove(userId: string, id: string) {
      const rows = await db
        .delete(goals)
        .where(and(eq(goals.id, id), eq(goals.userId, userId)))
        .returning({ id: goals.id });
      return rows.length > 0;
    },

    async contribute(userId: string, goalId: string, amountMinor: string) {
      const [goal] = await db
        .select({ id: goals.id })
        .from(goals)
        .where(and(eq(goals.id, goalId), eq(goals.userId, userId)));
      if (!goal) return null;
      return db.transaction(async (tx) => {
        const [row] = await tx
          .insert(goalContributions)
          .values({ goalId, amountMinor: BigInt(amountMinor) })
          .returning();
        // shortcut: dos aportes simultáneos que solo juntos llegan a la meta pueden no marcarla
        // (read committed); con un usuario no pasa, revisar con SELECT ... FOR UPDATE si crece.
        await tx
          .update(goals)
          .set({ status: 'completed' })
          .where(
            and(
              eq(goals.id, goalId),
              eq(goals.status, 'active'),
              sql`${goals.targetMinor} <= (select sum(${goalContributions.amountMinor}) from ${goalContributions} where ${goalContributions.goalId} = ${goalId})`,
            ),
          );
        return row;
      });
    },
  };
}
