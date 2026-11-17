import type { InvestmentPeriod } from '@finanzas/shared';

type Contribution = { amountMinor: bigint; occurredAt: Date };
type Valuation = { valueMinor: bigint; occurredAt: Date };

/** Inicio del periodo contando hacia atrás desde `now`. */
export function periodStart(period: InvestmentPeriod, now = new Date()) {
  const d = new Date(now);
  if (period === 'week') d.setDate(d.getDate() - 7);
  if (period === 'month') d.setMonth(d.getMonth() - 1);
  if (period === 'year') d.setFullYear(d.getFullYear() - 1);
  return d;
}

/**
 * Cómo va una inversión. `valuations` debe venir ordenada de la más vieja a la más nueva.
 * La ganancia del periodo descuenta lo aportado en él: meter plata no cuenta como ganar.
 */
export function investmentStats(
  contributions: Contribution[],
  valuations: Valuation[],
  since: Date,
) {
  const sum = (xs: Contribution[]) => xs.reduce((acc, c) => acc + c.amountMinor, 0n);
  const valueAt = (t?: Date) => {
    let value = 0n;
    for (const v of valuations) {
      if (t && v.occurredAt > t) break;
      value = v.valueMinor;
    }
    return value;
  };
  const investedMinor = sum(contributions);
  const valueMinor = valueAt();
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
