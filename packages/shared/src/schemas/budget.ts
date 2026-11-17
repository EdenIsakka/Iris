import { z } from 'zod';
import { amountMinor } from './transaction';

/** Tope de gasto mensual de una categoría; vale desde este mes hasta que se cambie. */
export const setBudgetSchema = z.object({ limitMinor: amountMinor });

export type SetBudgetInput = z.infer<typeof setBudgetSchema>;
