import { z } from 'zod';

export const transactionKind = z.enum(['income', 'expense']);

/**
 * Los montos llegan de los formularios como string de enteros.
 * Mayor que 0 y de hasta 15 dígitos: SQLite los devuelve como number, exacto hasta 2^53 (ADR-0008).
 */
export const amountMinor = z
  .string()
  .regex(/^[1-9]\d{0,14}$/, 'Debe ser un entero positivo de hasta 15 dígitos');

/** La moneda no viene aquí: el movimiento toma la de su billetera. */
export const createTransactionSchema = z.object({
  walletId: z.string().min(1),
  categoryId: z.string().min(1).nullable(),
  kind: transactionKind,
  amountMinor,
  occurredAt: z.iso.datetime(),
  note: z.string().max(280).optional(),
});

/** Movimientos por página: si llega una página llena, puede haber más. */
export const TRANSACTIONS_PAGE_SIZE = 50;

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
