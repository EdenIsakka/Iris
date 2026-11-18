import { z } from 'zod';
import { amountMinor } from './transaction';

export const investmentKind = z.enum(['crypto', 'stocks', 'fund', 'cdt', 'other']);
export const investmentPeriod = z.enum(['week', 'month', 'year']);

/** Inversiones con precio automático: Bitcoin desde CoinGecko (en COP), fondos desde Twelve Data (en USD). */
export const PRICED = {
  BTC: { name: 'Bitcoin', kind: 'crypto' },
  VOO: { name: 'Vanguard S&P 500 ETF (VOO)', kind: 'fund' },
  SPY: { name: 'SPDR S&P 500 ETF Trust (SPY)', kind: 'fund' },
  IVV: { name: 'iShares Core S&P 500 ETF (IVV)', kind: 'fund' },
} as const;
export const PRICE_SYMBOLS = ['BTC', 'VOO', 'SPY', 'IVV'] as const;
export const priceSymbol = z.enum(PRICE_SYMBOLS);

/** Unidades compradas, con hasta 8 decimales: "0,0015" o "3". */
export const quantity = z
  .string()
  .regex(/^\d{1,9}([.,]\d{1,8})?$/, 'Escribe cuántas unidades, ej. 0,0015')
  .refine((s) => /[1-9]/.test(s), 'Las unidades deben ser más de 0');

/** "0,0015" → 150000n (cienmillonésimas de unidad, como los satoshis), sin pasar por decimales. */
export function toQuantityE8(text: string) {
  const [whole = '0', decimals = ''] = text.split(/[.,]/);
  return BigInt(`${whole}${decimals.padEnd(8, '0')}`);
}

const investmentFields = z.object({
  name: z.string().trim().min(1, 'Escribe un nombre').max(80),
  kind: investmentKind,
  /** Lo que se invirtió al empezar. */
  amountMinor,
  /** Día en que empezó; si no viene, hoy. */
  startedAt: z.iso.date().optional(),
  /** Cuánto vale hoy, si ya cambió desde que empezó. */
  currentValueMinor: amountMinor.optional(),
  /** Tasa efectiva anual en centésimas de % (11,5 % = 1150). Si viene, el valor crece solo cada día. */
  rateBps: z.number().int().min(1).max(10_000).nullable().optional(),
  /** Si viene, el valor sale de unidades × precio; las unidades son obligatorias. */
  symbol: priceSymbol.nullable().optional(),
  quantity: quantity.optional(),
});

export const createInvestmentSchema = investmentFields.refine((i) => !i.symbol || i.quantity, {
  message: 'Escribe cuántas unidades compraste',
  path: ['quantity'],
});
export const updateInvestmentSchema = investmentFields.pick({
  name: true,
  kind: true,
  rateBps: true,
});
export const contributeToInvestmentSchema = z.object({
  amountMinor,
  quantity: quantity.optional(),
});
export const valueInvestmentSchema = z.object({ valueMinor: amountMinor });
export const investmentPeriodQuery = z.object({ period: investmentPeriod.default('month') });

export type InvestmentKind = z.infer<typeof investmentKind>;
export type InvestmentPeriod = z.infer<typeof investmentPeriod>;
export type PriceSymbol = z.infer<typeof priceSymbol>;
export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>;
export type UpdateInvestmentInput = z.infer<typeof updateInvestmentSchema>;
export type ContributeToInvestmentInput = z.infer<typeof contributeToInvestmentSchema>;
