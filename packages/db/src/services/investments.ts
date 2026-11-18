import {
  amountMinor,
  type CreateInvestmentInput,
  createInvestmentSchema,
  type InvestmentPeriod,
  type UpdateInvestmentInput,
  updateInvestmentSchema,
} from '@finanzas/shared';
import { and, asc, desc, eq, gt, inArray, lte, sql } from 'drizzle-orm';
import type { Db } from '../db';
import { investmentContributions, investments, investmentValuations } from '../schema';
import { type InvestmentStats, investmentStats, periodStart } from './investment-stats';

// Mediodía en Colombia, para que la fecha no se corra de día al pasar a UTC.
const atNoon = (date: string) => new Date(`${date}T12:00:00-05:00`);

// Dos valores con la misma hora se ordenan por cuál se guardó primero.
const insertOrder = sql`rowid`;

const zero: InvestmentStats = {
  investedMinor: 0n,
  valueMinor: 0n,
  gainMinor: 0n,
  periodGainMinor: 0n,
  periodBaseMinor: 0n,
};

export function investmentsService(db: Db) {
  const exists = (id: string) =>
    Boolean(
      db.select({ id: investments.id }).from(investments).where(eq(investments.id, id)).get(),
    );

  const latestValue = (id: string) =>
    db
      .select({ valueMinor: investmentValuations.valueMinor })
      .from(investmentValuations)
      .where(eq(investmentValuations.investmentId, id))
      .orderBy(desc(investmentValuations.occurredAt), desc(insertOrder))
      .limit(1)
      .get()?.valueMinor ?? 0n;

  return {
    /** Cada inversión con su valor y ganancia, y los totales, para el periodo pedido. */
    list(period: InvestmentPeriod) {
      const rows = db.select().from(investments).orderBy(asc(investments.createdAt)).all();
      if (!rows.length) return { items: [], totals: zero };
      const ids = rows.map((r) => r.id);
      // shortcut: trae todo el historial y calcula en memoria; sirve con registros a mano,
      // pasar a SQL si algún día se cargan precios automáticos cada hora.
      const contributions = db
        .select()
        .from(investmentContributions)
        .where(inArray(investmentContributions.investmentId, ids))
        .all();
      const valuations = db
        .select()
        .from(investmentValuations)
        .where(inArray(investmentValuations.investmentId, ids))
        .orderBy(asc(investmentValuations.occurredAt), asc(insertOrder))
        .all();
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

    /** Valores registrados en el periodo, más el último de antes como punto de partida. null si no existe. */
    history(id: string, period: InvestmentPeriod) {
      if (!exists(id)) return null;
      const since = periodStart(period);
      const columns = {
        id: investmentValuations.id,
        valueMinor: investmentValuations.valueMinor,
        occurredAt: investmentValuations.occurredAt,
      };
      const ofThis = eq(investmentValuations.investmentId, id);
      const before = db
        .select(columns)
        .from(investmentValuations)
        .where(and(ofThis, lte(investmentValuations.occurredAt, since)))
        .orderBy(desc(investmentValuations.occurredAt), desc(insertOrder))
        .limit(1)
        .all();
      const during = db
        .select(columns)
        .from(investmentValuations)
        .where(and(ofThis, gt(investmentValuations.occurredAt, since)))
        .orderBy(asc(investmentValuations.occurredAt), asc(insertOrder))
        .all();
      return [...before, ...during];
    },

    /** Crea la inversión con su primer aporte y, si viene, su valor de hoy. */
    create(raw: CreateInvestmentInput) {
      const input = createInvestmentSchema.parse(raw);
      const occurredAt = input.startedAt ? atNoon(input.startedAt) : new Date();
      const amount = BigInt(input.amountMinor);
      return db.transaction((tx) => {
        const row = tx
          .insert(investments)
          .values({ name: input.name, kind: input.kind })
          .returning()
          .get();
        const investmentId = row.id;
        tx.insert(investmentContributions)
          .values({ investmentId, amountMinor: amount, occurredAt })
          .run();
        tx.insert(investmentValuations)
          .values({ investmentId, valueMinor: amount, occurredAt })
          .run();
        if (input.currentValueMinor) {
          tx.insert(investmentValuations)
            .values({ investmentId, valueMinor: BigInt(input.currentValueMinor) })
            .run();
        }
        return row;
      });
    },

    /** null si no existe. */
    update(id: string, raw: UpdateInvestmentInput) {
      const input = updateInvestmentSchema.parse(raw);
      return (
        db
          .update(investments)
          .set({ name: input.name, kind: input.kind })
          .where(eq(investments.id, id))
          .returning()
          .get() ?? null
      );
    },

    /** Borra la inversión con su historial (cascada). false si no existe. */
    remove(id: string) {
      return db.delete(investments).where(eq(investments.id, id)).returning().all().length > 0;
    },

    /** Mete más plata: el valor actual sube en lo mismo. false si no existe. */
    contribute(id: string, raw: string) {
      const amount = BigInt(amountMinor.parse(raw));
      if (!exists(id)) return false;
      db.transaction((tx) => {
        const valueMinor = latestValue(id) + amount;
        tx.insert(investmentContributions).values({ investmentId: id, amountMinor: amount }).run();
        tx.insert(investmentValuations).values({ investmentId: id, valueMinor }).run();
      });
      return true;
    },

    /** Registra cuánto vale hoy. false si no existe. */
    value(id: string, raw: string) {
      const valueMinor = BigInt(amountMinor.parse(raw));
      if (!exists(id)) return false;
      db.insert(investmentValuations).values({ investmentId: id, valueMinor }).run();
      return true;
    },
  };
}
