/**
 * Dinero siempre como entero en la unidad mínima de la moneda (ADR-0004).
 * El MVP maneja solo COP, que no usa decimales: 1 unidad mínima = 1 peso.
 */
export const CURRENCIES = ['COP'] as const;

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export function formatMoney(minor: bigint): string {
  // shortcut: Number() pierde precisión sobre ~9e15 pesos; se usa porque Hermes no garantiza Intl con bigint.
  return cop.format(Number(minor));
}
