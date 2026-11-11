import { z } from 'zod';
import { amountMinor } from './transaction';

export const createGoalSchema = z.object({
  name: z.string().trim().min(1, 'Escribe un nombre').max(80),
  targetMinor: amountMinor,
  deadline: z.iso.date().optional(),
});

export const contributeToGoalSchema = z.object({
  amountMinor,
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type ContributeToGoalInput = z.infer<typeof contributeToGoalSchema>;
