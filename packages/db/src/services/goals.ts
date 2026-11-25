import { amountMinor, type CreateGoalInput, createGoalSchema } from '@finanzas/shared';
import { and, eq, sql } from 'drizzle-orm';
import type { Db } from '../db';
import { goalContributions, goals } from '../schema';
import { bogotaDay } from './trm';

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
    /**
     * Cada meta con su progreso (suma de aportes). Con fecha y sin cumplir, también cuánto ahorrar
     * al mes para llegar: contando el mes en curso y el de la fecha. Fecha ya pasada: `late`.
     */
    list(now = new Date()) {
      const today = bogotaDay(now);
      const rows = db
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
      return rows.map((g) => {
        if (!g.deadline || g.status === 'completed')
          return { ...g, late: false, perMonthMinor: null };
        if (g.deadline < today) return { ...g, late: true, perMonthMinor: null };
        const month = (iso: string) => Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7));
        const months = BigInt(month(g.deadline) - month(today) + 1);
        const left = g.targetMinor - g.savedMinor;
        // Redondea hacia arriba: con lo justo por mes se llega a tiempo.
        return { ...g, late: false, perMonthMinor: (left + months - 1n) / months };
      });
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
