import type { WalletType } from '@finanzas/shared';

export const TYPE_LABELS: Record<WalletType, string> = {
  cash: 'Efectivo',
  bank: 'Banco',
  card: 'Tarjeta',
};
