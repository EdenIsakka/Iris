import { z } from 'zod';

export const walletType = z.enum(['cash', 'bank', 'card']);

export const createWalletSchema = z.object({
  name: z.string().trim().min(1, 'Escribe un nombre').max(40),
  type: walletType,
  /** Lo que tenía antes de usar la app; puede ser 0. */
  openingBalanceMinor: z
    .string()
    .regex(/^(0|[1-9]\d{0,17})$/, 'Debe ser un entero de 0 o más, de hasta 18 dígitos')
    .default('0'),
});

export type WalletType = z.infer<typeof walletType>;
export type CreateWalletInput = z.infer<typeof createWalletSchema>;
