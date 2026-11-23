import { z } from 'zod';
import { amountMinor } from './transaction';

/** Un pago de una sola vez, o que se repite el mismo día cada mes (arriendo, servicios). */
export const PAYMENT_REPEATS = ['once', 'monthly'] as const;
export const paymentRepeat = z.enum(PAYMENT_REPEATS);

/** Un pago que toca hacer en una fecha; sale de una billetera y en su moneda. */
export const savePaymentSchema = z.object({
  name: z.string().trim().min(1, 'Escribe un nombre').max(80),
  amountMinor,
  walletId: z.string().min(1),
  categoryId: z.string().min(1).nullable(),
  dueDate: z.iso.date(),
  repeat: paymentRepeat,
});

export type PaymentRepeat = z.infer<typeof paymentRepeat>;
export type SavePaymentInput = z.infer<typeof savePaymentSchema>;
