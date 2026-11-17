import { z } from 'zod';
import { amountMinor } from './transaction';

export const investmentKind = z.enum(['crypto', 'stocks', 'fund', 'cdt', 'other']);
export const investmentPeriod = z.enum(['week', 'month', 'year']);

export const createInvestmentSchema = z.object({
  name: z.string().trim().min(1, 'Escribe un nombre').max(80),
  kind: investmentKind,
  /** Lo que se invirtió al empezar. */
  amountMinor,
  /** Día en que empezó; si no viene, hoy. */
  startedAt: z.iso.date().optional(),
  /** Cuánto vale hoy, si ya cambió desde que empezó. */
  currentValueMinor: amountMinor.optional(),
});

export const updateInvestmentSchema = createInvestmentSchema.pick({ name: true, kind: true });
export const contributeToInvestmentSchema = z.object({ amountMinor });
export const valueInvestmentSchema = z.object({ valueMinor: amountMinor });
export const investmentPeriodQuery = z.object({ period: investmentPeriod.default('month') });

export type InvestmentKind = z.infer<typeof investmentKind>;
export type InvestmentPeriod = z.infer<typeof investmentPeriod>;
export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>;
export type UpdateInvestmentInput = z.infer<typeof updateInvestmentSchema>;
