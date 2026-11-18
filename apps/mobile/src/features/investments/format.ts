import { formatMoney, type InvestmentKind, type InvestmentPeriod } from '@finanzas/shared';

export const KIND_LABELS: Record<InvestmentKind, string> = {
  crypto: 'Cripto',
  stocks: 'Acciones',
  fund: 'Fondo',
  cdt: 'CDT',
  other: 'Otra',
};

export const PERIOD_LABELS: Record<InvestmentPeriod, string> = {
  week: '1 semana',
  month: '1 mes',
  year: '1 año',
};

export const PERIOD_CHANGE_LABELS: Record<InvestmentPeriod, string> = {
  week: 'Última semana',
  month: 'Último mes',
  year: 'Último año',
};

/** "11,5 %" desde centésimas de %. */
export const formatRate = (bps: number) => `${(bps / 100).toLocaleString('es-CO')} %`;

/** "+$ 120.000 (+8,5 %)": ganancia en pesos y en % sobre `base`; sin % si la base es 0. */
export function formatChange(gain: bigint, base: bigint) {
  const sign = gain > 0n ? '+' : gain < 0n ? '−' : '';
  const abs = gain < 0n ? -gain : gain;
  const pct =
    base > 0n ? ` (${sign}${(Number((abs * 10000n) / base) / 100).toLocaleString('es-CO')} %)` : '';
  return `${sign}${formatMoney(abs)}${pct}`;
}

/** Clase de color del tema para una ganancia: verde, rojo o gris si es 0. */
export const changeClass = (gain: bigint) =>
  gain > 0n ? 'text-positive' : gain < 0n ? 'text-negative' : 'text-secondary';
