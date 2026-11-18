import type { InvestmentPeriod } from '@finanzas/shared';

type Contribution = { amountMinor: bigint; occurredAt: Date };
type Valuation = { valueMinor: bigint; occurredAt: Date };

/** Inicio del periodo contando hacia atrás desde `now`. */
export function periodStart(period: InvestmentPeriod, now = new Date()) {
  const d = new Date(now);
  if (period === 'week') {
    d.setDate(d.getDate() - 7);
    return d;
  }
  // El 31 de marzo menos un mes es el 28 (o 29) de febrero, no el 3 de marzo.
  const months = period === 'month' ? 1 : 12;
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() - months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}

const DAY_MS = 86_400_000;

/**
 * Lo que vale en `to` un valor de `from` que rinde una tasa efectiva anual, por días completos.
 * Sin tasa no cambia. Ganancia bruta: no descuenta la retención en la fuente del CDT.
 */
export function grow(valueMinor: bigint, rateBps: number | null, from: Date, to: Date) {
  const days = Math.floor((to.getTime() - from.getTime()) / DAY_MS);
  if (!rateBps || days <= 0) return valueMinor;
  return BigInt(Math.round(Number(valueMinor) * (1 + rateBps / 10_000) ** (days / 365)));
}

/**
 * Cómo va una inversión. `valuations` debe venir ordenada de la más vieja a la más nueva.
 * La ganancia del periodo descuenta lo aportado en él: meter plata no cuenta como ganar.
 */
export function investmentStats(
  contributions: Contribution[],
  valuations: Valuation[],
  since: Date,
  /** Con tasa, el último valor registrado crece hasta cada fecha. */
  rateBps: number | null = null,
  now = new Date(),
) {
  const sum = (xs: Contribution[]) => xs.reduce((acc, c) => acc + c.amountMinor, 0n);
  // shortcut: con tasa, la tasa de hoy se aplica también antes de un cambio de tasa; solo mueve
  // la ganancia de un periodo que cruce el cambio. Guardar la tasa por valor si molesta.
  const valueAt = (t: Date) => {
    let last: Valuation | undefined;
    for (const v of valuations) {
      if (v.occurredAt > t) break;
      last = v;
    }
    return last ? grow(last.valueMinor, rateBps, last.occurredAt, t) : 0n;
  };
  const investedMinor = sum(contributions);
  const valueMinor = valueAt(now);
  const startValueMinor = valueAt(since);
  const addedMinor = sum(contributions.filter((c) => c.occurredAt > since));
  return {
    investedMinor,
    valueMinor,
    gainMinor: valueMinor - investedMinor,
    periodGainMinor: valueMinor - startValueMinor - addedMinor,
    /** Sobre qué se calcula el % del periodo: lo que había al empezar más lo aportado. */
    periodBaseMinor: startValueMinor + addedMinor,
  };
}

export type InvestmentStats = ReturnType<typeof investmentStats>;
