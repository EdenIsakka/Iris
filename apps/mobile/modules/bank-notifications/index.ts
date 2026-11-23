import { requireOptionalNativeModule } from 'expo';

type Native = { isEnabled(): boolean; all(): string; remove(ids: string[]): void };

export type BankNotification = {
  id: string;
  package: string;
  title: string;
  text: string;
  /** Milisegundos, como Date.getTime(). */
  postedAt: number;
};

const native = requireOptionalNativeModule<Native>('BankNotifications');

/**
 * Notificaciones de bancos que guardó el celular (ADR-0009). null en Expo Go y en iPhone: ahí no
 * se pueden leer las notificaciones de otras apps.
 */
export const bankNotifications = native && {
  isEnabled: () => native.isEnabled(),
  all: () => JSON.parse(native.all()) as BankNotification[],
  remove: (ids: string[]) => native.remove(ids),
};
