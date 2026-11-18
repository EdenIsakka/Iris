import { z } from 'zod';
import { CURRENCIES } from '../money';

export const walletType = z.enum(['cash', 'bank', 'card']);

export const createWalletSchema = z.object({
  name: z.string().trim().min(1, 'Escribe un nombre').max(40),
  type: walletType,
  /** Se elige al crearla; al editar se ignora porque sus movimientos ya están en ella. */
  currency: z.enum(CURRENCIES).default('COP'),
  /** Lo que tenía antes de usar la app, en su unidad mínima; puede ser 0. */
  openingBalanceMinor: z
    .string()
    .regex(/^(0|[1-9]\d{0,14})$/, 'Debe ser un entero de 0 o más, de hasta 15 dígitos')
    .default('0'),
});

export type WalletType = z.infer<typeof walletType>;
// Lo que recibe el servicio: moneda y saldo inicial pueden faltar.
export type CreateWalletInput = z.input<typeof createWalletSchema>;
