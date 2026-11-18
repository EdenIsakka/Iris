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
import { grow, type InvestmentStats, investmentStats, periodStart } from './investment-stats';

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
  /** La inversión con su tasa; undefined si no existe. */
  const find = (id: string) =>
    db
      .select({ id: investments.id, rateBps: investments.rateBps })
      .from(investments)
      .where(eq(investments.id, id))
      .get();

  /** Valor de hoy: el último registrado, más lo que rindió desde entonces si tiene tasa. */
  const currentValue = (id: string, rateBps: number | null, now = new Date()) => {
    const last = db
      .select({
        valueMinor: investmentValuations.valueMinor,
        occurredAt: investmentValuations.occurredAt,
      })
      .from(investmentValuations)
      .where(eq(investmentValuations.investmentId, id))
      .orderBy(desc(investmentValuations.occurredAt), desc(insertOrder))
      .limit(1)
      .get();
    return last ? grow(last.valueMinor, rateBps, last.occurredAt, now) : 0n;
  };

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
        rateBps: r.rateBps,
        ...investmentStats(
          contributions.filter((c) => c.investmentId === r.id),
          valuations.filter((v) => v.investmentId === r.id),
          since,
          r.rateBps,
        ),
      }));
      const totals = { ...zero };
      for (const item of items) {
        for (const key of Object.keys(zero) as (keyof InvestmentStats)[]) totals[key] += item[key];
      }
      return { items, totals };
    },

    /** Valores registrados en el periodo, más el último de antes como punto de partida. null si no existe. */
    history(id: string, period: InvestmentPeriod, now = new Date()) {
      const investment = find(id);
      if (!investment) return null;
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
      const rows = [...before, ...during];
      // Con tasa, el valor de hoy no está guardado: se agrega calculado.
      const last = rows.at(-1);
      const today = currentValue(id, investment.rateBps, now);
      if (investment.rateBps && last && today !== last.valueMinor) {
        rows.push({ id: 'today', valueMinor: today, occurredAt: now });
      }
      return rows;
    },

    /** Crea la inversión con su primer aporte y, si viene, su valor de hoy. */
    create(raw: CreateInvestmentInput) {
      const input = createInvestmentSchema.parse(raw);
      const occurredAt = input.startedAt ? atNoon(input.startedAt) : new Date();
      const amount = BigInt(input.amountMinor);
      return db.transaction((tx) => {
        const row = tx
          .insert(investments)
          .values({ name: input.name, kind: input.kind, rateBps: input.rateBps ?? null })
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

    /**
     * null si no existe. Si cambia la tasa (la de Nu cambia seguido), primero guarda lo que
     * vale hoy con la tasa vieja, para que la nueva rinda solo desde hoy.
     */
    update(id: string, raw: UpdateInvestmentInput) {
      const input = updateInvestmentSchema.parse(raw);
      const before = find(id);
      if (!before) return null;
      const rateBps = input.rateBps ?? null;
      return db.transaction((tx) => {
        if (before.rateBps !== rateBps) {
          tx.insert(investmentValuations)
            .values({ investmentId: id, valueMinor: currentValue(id, before.rateBps) })
            .run();
        }
        return (
          tx
            .update(investments)
            .set({ name: input.name, kind: input.kind, rateBps })
            .where(eq(investments.id, id))
            .returning()
            .get() ?? null
        );
      });
    },

    /** Borra la inversión con su historial (cascada). false si no existe. */
    remove(id: string) {
      return db.delete(investments).where(eq(investments.id, id)).returning().all().length > 0;
    },

    /** Mete más plata: el valor actual sube en lo mismo. false si no existe. */
    contribute(id: string, raw: string) {
      const amount = BigInt(amountMinor.parse(raw));
      const investment = find(id);
      if (!investment) return false;
      db.transaction((tx) => {
        const valueMinor = currentValue(id, investment.rateBps) + amount;
        tx.insert(investmentContributions).values({ investmentId: id, amountMinor: amount }).run();
        tx.insert(investmentValuations).values({ investmentId: id, valueMinor }).run();
      });
      return true;
    },

    /** Registra cuánto vale hoy. false si no existe. */
    value(id: string, raw: string) {
      const valueMinor = BigInt(amountMinor.parse(raw));
      if (!find(id)) return false;
      db.insert(investmentValuations).values({ investmentId: id, valueMinor }).run();
      return true;
    },
  };
}
