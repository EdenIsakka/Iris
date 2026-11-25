import { z } from 'zod';
import { amountMinor } from './transaction';

/**
 * Plata que pasa de una billetera a otra. `toAmountMinor` es lo que llega: solo hace falta si
 * las monedas son distintas (pesos → dólares); con la misma moneda llega lo mismo que sale.
 */
export const createTransferSchema = z
  .object({
    fromWalletId: z.string().min(1),
    toWalletId: z.string().min(1),
    amountMinor,
    toAmountMinor: amountMinor.optional(),
    occurredAt: z.iso.datetime(),
    note: z.string().max(280).optional(),
  })
  .refine((t) => t.fromWalletId !== t.toWalletId, {
    path: ['toWalletId'],
    message: 'Elige otra billetera de destino',
  });

export type CreateTransferInput = z.infer<typeof createTransferSchema>;
