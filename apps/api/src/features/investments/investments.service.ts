import { type Db, investmentContributions, investments, investmentValuations } from '@finanzas/db';
import type {
  CreateInvestmentInput,
  InvestmentPeriod,
  UpdateInvestmentInput,
} from '@finanzas/shared';
import { and, asc, desc, eq, gt, inArray, lte } from 'drizzle-orm';
import { type InvestmentStats, investmentStats, periodStart } from './stats';

// Mediodía en Colombia, para que la fecha no se corra de día al pasar a UTC.
const atNoon = (date: string) => new Date(`${date}T12:00:00-05:00`);

const zero: InvestmentStats = {
  investedMinor: 0n,
  valueMinor: 0n,
  gainMinor: 0n,
  periodGainMinor: 0n,
  periodBaseMinor: 0n,
};

export function investmentsService(db: Db) {
  async function owned(userId: string, id: string) {
    const [row] = await db
      .select({ id: investments.id })
      .from(investments)
      .where(and(eq(investments.id, id), eq(investments.userId, userId)));
    return Boolean(row);
  }

  async function latestValue(id: string) {
    const [last] = await db
      .select({ valueMinor: investmentValuations.valueMinor })
      .from(investmentValuations)
      .where(eq(investmentValuations.investmentId, id))
      .orderBy(desc(investmentValuations.occurredAt), desc(investmentValuations.createdAt))
      .limit(1);
    return last?.valueMinor ?? 0n;
  }

  return {
    /** Cada inversión con su valor y ganancia, y los totales, para el periodo pedido. */
    async list(userId: string, period: InvestmentPeriod) {
      const rows = await db
        .select()
        .from(investments)
        .where(eq(investments.userId, userId))
        .orderBy(asc(investments.createdAt));
      if (!rows.length) return { items: [], totals: zero };
      const ids = rows.map((r) => r.id);
      // shortcut: trae todo el historial y calcula en memoria; sirve con registros a mano,
      // pasar a SQL si algún día se cargan precios automáticos cada hora.
      const [contributions, valuations] = await Promise.all([
        db
          .select()
          .from(investmentContributions)
          .where(inArray(investmentContributions.investmentId, ids)),
        db
          .select()
          .from(investmentValuations)
          .where(inArray(investmentValuations.investmentId, ids))
          .orderBy(asc(investmentValuations.occurredAt), asc(investmentValuations.createdAt)),
      ]);
      const since = periodStart(period);
      const items = rows.map((r) => ({
        id: r.id,
        name: r.name,
        kind: r.kind,
        currency: r.currency,
        ...investmentStats(
          contributions.filter((c) => c.investmentId === r.id),
          valuations.filter((v) => v.investmentId === r.id),
          since,
        ),
      }));
      const totals = { ...zero };
      for (const item of items) {
        for (const key of Object.keys(zero) as (keyof InvestmentStats)[]) totals[key] += item[key];
      }
      return { items, totals };
    },

    /** Valores registrados en el periodo, más el último de antes como punto de partida. */
    async history(userId: string, id: string, period: InvestmentPeriod) {
      if (!(await owned(userId, id))) return null;
      const since = periodStart(period);
      const columns = {
        id: investmentValuations.id,
        valueMinor: investmentValuations.valueMinor,
        occurredAt: investmentValuations.occurredAt,
      };
      const ofThis = eq(investmentValuations.investmentId, id);
      const [before, during] = await Promise.all([
        db
          .select(columns)
          .from(investmentValuations)
          .where(and(ofThis, lte(investmentValuations.occurredAt, since)))
          .orderBy(desc(investmentValuations.occurredAt), desc(investmentValuations.createdAt))
          .limit(1),
        db
          .select(columns)
          .from(investmentValuations)
          .where(and(ofThis, gt(investmentValuations.occurredAt, since)))
          .orderBy(asc(investmentValuations.occurredAt), asc(investmentValuations.createdAt)),
      ]);
      return [...before, ...during];
    },

    /** Crea la inversión con su primer aporte y, si viene, su valor de hoy. */
    async create(userId: string, input: CreateInvestmentInput) {
      const occurredAt = input.startedAt ? atNoon(input.startedAt) : new Date();
      const amountMinor = BigInt(input.amountMinor);
      return db.transaction(async (tx) => {
        const [row] = await tx
          .insert(investments)
          .values({ userId, name: input.name, kind: input.kind })
          .returning();
        if (!row) throw new Error('No se creó la inversión');
        const investmentId = row.id;
        await tx.insert(investmentContributions).values({ investmentId, amountMinor, occurredAt });
        await tx
          .insert(investmentValuations)
          .values({ investmentId, valueMinor: amountMinor, occurredAt });
        if (input.currentValueMinor) {
          await tx
            .insert(investmentValuations)
            .values({ investmentId, valueMinor: BigInt(input.currentValueMinor) });
        }
        return row;
      });
    },

    /** null si no es suya. */
    async update(userId: string, id: string, input: UpdateInvestmentInput) {
      const [row] = await db
        .update(investments)
        .set({ name: input.name, kind: input.kind })
        .where(and(eq(investments.id, id), eq(investments.userId, userId)))
        .returning();
      return row ?? null;
    },

    /** Borra la inversión con su historial (cascada). false si no existe o no es suya. */
    async remove(userId: string, id: string) {
      const rows = await db
        .delete(investments)
        .where(and(eq(investments.id, id), eq(investments.userId, userId)))
        .returning({ id: investments.id });
      return rows.length > 0;
    },

    /** Mete más plata: el valor actual sube en lo mismo. false si no es suya. */
    async contribute(userId: string, id: string, amountMinor: string) {
      if (!(await owned(userId, id))) return false;
      const amount = BigInt(amountMinor);
      // shortcut: dos aportes a la vez pueden leer el mismo valor anterior; con una persona
      // registrando a mano no pasa, usar SELECT ... FOR UPDATE si crece.
      const valueMinor = (await latestValue(id)) + amount;
      await db.transaction(async (tx) => {
        await tx.insert(investmentContributions).values({ investmentId: id, amountMinor: amount });
        await tx.insert(investmentValuations).values({ investmentId: id, valueMinor });
      });
      return true;
    },

    /** Registra cuánto vale hoy. false si no es suya. */
    async value(userId: string, id: string, valueMinor: string) {
      if (!(await owned(userId, id))) return false;
      await db
        .insert(investmentValuations)
        .values({ investmentId: id, valueMinor: BigInt(valueMinor) });
      return true;
    },
  };
}
