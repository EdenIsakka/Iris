/**
 * Dinero siempre como entero en la unidad mínima de la moneda (ADR-0004):
 * COP no usa decimales (1 = 1 peso); USD va en centavos (100 = 1 dólar).
 */
export const CURRENCIES = ['COP', 'USD'] as const;
export type Currency = (typeof CURRENCIES)[number];

const formats: Record<Currency, Intl.NumberFormat> = {
  COP: new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }),
  USD: new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
};

export function formatMoney(minor: bigint, currency: Currency = 'COP'): string {
  // shortcut: Number() pierde precisión sobre ~9e15; se usa porque Hermes no garantiza Intl con bigint.
  return formats[currency].format(currency === 'USD' ? Number(minor) / 100 : Number(minor));
}

/** a / b redondeando a la unidad más cercana, también con negativos. */
const divRound = (a: bigint, b: bigint) => (a < 0n ? -((-a + b / 2n) / b) : (a + b / 2n) / b);

/** La TRM va en centavos de peso por dólar (4.123,45 = 412345n). */
export const usdToCop = (usdCents: bigint, trmMinor: bigint) =>
  divRound(usdCents * trmMinor, 10_000n);

export const copToUsd = (pesos: bigint, trmMinor: bigint) => divRound(pesos * 10_000n, trmMinor);
