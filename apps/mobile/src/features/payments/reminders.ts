import { formatMoney } from '@finanzas/shared';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL = 'pagos';

// Con la app abierta el aviso también se muestra.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** true si Iris puede mostrar avisos. */
export const canRemind = async () => (await Notifications.getPermissionsAsync()).granted;

/** Pide permiso para avisar (una sola vez lo pregunta Android). false si no lo dio. */
export async function askReminderPermission() {
  // Android 13+ exige el canal antes de pedir el permiso.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Pagos por hacer',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || !current.canAskAgain) return current.granted;
  return (await Notifications.requestPermissionsAsync()).granted;
}

type Reminder = {
  name: string;
  amountMinor: bigint;
  dueDate: string;
  walletName: string;
  currency: 'COP' | 'USD';
  leftMinor: bigint;
};

/** El texto del aviso: si alcanza, cuánto queda; si no, cuánto falta. */
export function reminderText(p: Reminder) {
  const money = (v: bigint) => formatMoney(v, p.currency);
  return {
    title: `Mañana pagas ${p.name} (${money(p.amountMinor)})`,
    body:
      p.leftMinor >= 0n
        ? `Te alcanza: en ${p.walletName} te quedarían ${money(p.leftMinor)}.`
        : `No te alcanza: te faltan ${money(-p.leftMinor)} en ${p.walletName}. ¡Cuidado!`,
  };
}

/**
 * Borra los avisos y programa uno por pago, el día antes a las 9 a. m. Se llama cada vez que
 * algo cambia en la app, así el texto siempre trae el saldo de ahora.
 */
export async function scheduleReminders(payments: Reminder[], now = new Date()) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  // Pide permiso y crea el canal también cuando los pagos llegaron por una copia restaurada.
  if (!payments.length || !(await askReminderPermission())) return;
  for (const p of payments) {
    const date = new Date(`${p.dueDate}T09:00:00`);
    date.setDate(date.getDate() - 1);
    if (date <= now) continue;
    await Notifications.scheduleNotificationAsync({
      content: reminderText(p),
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL },
    });
  }
}
