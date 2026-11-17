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

/** Movimientos por página: si llega una página llena, puede haber más. */
export const TRANSACTIONS_PAGE_SIZE = 50;

/**
 * Página siguiente de movimientos: los anteriores al último que ya se mostró.
 * Va la fecha y el id porque varios movimientos pueden tener la misma fecha.
 */
export const transactionsPageQuery = z
  .object({ before: z.iso.datetime().optional(), beforeId: z.uuid().optional() })
  .refine((q) => !q.before === !q.beforeId, 'Manda before y beforeId juntos');

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type TransactionsPageQuery = z.infer<typeof transactionsPageQuery>;
