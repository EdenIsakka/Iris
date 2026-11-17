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

/** "+$ 120.000 (+8,5 %)": ganancia en pesos y en % sobre `base`; sin % si la base es 0. */
export function formatChange(gainMinor: string, baseMinor: string) {
  const gain = BigInt(gainMinor);
  const base = BigInt(baseMinor);
  const sign = gain > 0n ? '+' : gain < 0n ? '−' : '';
  const abs = gain < 0n ? -gain : gain;
  const pct =
    base > 0n ? ` (${sign}${(Number((abs * 10000n) / base) / 100).toLocaleString('es-CO')} %)` : '';
  return `${sign}${formatMoney(abs)}${pct}`;
}

export const changeColor = (gainMinor: string) => {
  const gain = BigInt(gainMinor);
  return gain > 0n ? '#1b5e20' : gain < 0n ? '#b00020' : '#555';
};
