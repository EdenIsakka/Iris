import { z } from 'zod';
import { CURRENCIES } from '../money';

export const transactionKind = z.enum(['income', 'expense']);

/**
 * Los montos viajan como string de enteros para no perder precisión en JSON.
 * Mayor que 0 y de hasta 18 dígitos para caber en el bigint de Postgres (máx. ~9,2e18).
 */
export const amountMinor = z
  .string()
  .regex(/^[1-9]\d{0,17}$/, 'Debe ser un entero positivo de hasta 18 dígitos');

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
