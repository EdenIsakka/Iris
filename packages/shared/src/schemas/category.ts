import { z } from 'zod';
import { transactionKind } from './transaction';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Escribe un nombre').max(40),
  kind: transactionKind,
});

// El tipo no se cambia: los movimientos ya guardados dependen de él.
export const renameCategorySchema = createCategorySchema.pick({ name: true });

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
