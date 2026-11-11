/**
 * Dinero siempre como entero en la unidad mínima de la moneda (ADR-0004).
 * COP tiene 0 decimales en la práctica, así que 1 unidad mínima = 1 peso.
 */
export const CURRENCIES = ['COP', 'USD'] as const;
export type Currency = (typeof CURRENCIES)[number];

const MINOR_DIGITS: Record<Currency, number> = { COP: 0, USD: 2 };

export function toMinor(amount: number, currency: Currency): bigint {
  return BigInt(Math.round(amount * 10 ** MINOR_DIGITS[currency]));
}

export function formatMoney(minor: bigint, currency: Currency, locale = 'es-CO'): string {
  const value = Number(minor) / 10 ** MINOR_DIGITS[currency];
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: MINOR_DIGITS[currency],
  }).format(value);
}
