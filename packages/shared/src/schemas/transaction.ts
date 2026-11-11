import { z } from 'zod';
import { CURRENCIES } from '../money';

export const transactionKind = z.enum(['income', 'expense']);

/** Los montos viajan como string de enteros para no perder precisión en JSON. */
export const amountMinor = z.string().regex(/^\d+$/, 'Debe ser un entero positivo');

export const createTransactionSchema = z.object({
  walletId: z.uuid(),
  categoryId: z.uuid().nullable(),
  kind: transactionKind,
  amountMinor,
  currency: z.enum(CURRENCIES).default('COP'),
  occurredAt: z.iso.datetime(),
  note: z.string().max(280).optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
