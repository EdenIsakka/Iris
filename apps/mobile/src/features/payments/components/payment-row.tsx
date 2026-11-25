import { formatMoney } from '@finanzas/shared';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { TintedIcon } from '@/components/ui/tinted-icon';
import { formatDate, isoDate } from '@/lib/format-date';
import type { Payment } from '../api';

/** "Vencido", "Hoy", "Mañana" o la fecha. */
function dueLabel(dueDate: string) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (dueDate < isoDate(today)) return 'Vencido';
  if (dueDate === isoDate(today)) return 'Hoy';
  if (dueDate === isoDate(tomorrow)) return 'Mañana';
  return formatDate(new Date(`${dueDate}T12:00:00`));
}

/** Un pago con su fecha y si alcanza la plata. El texto dice el estado; el color lo refuerza. */
export function PaymentRow({ payment: p }: { payment: Payment }) {
  const label = dueLabel(p.dueDate);
  const money = (v: bigint) => formatMoney(v, p.currency);
  const enough = p.leftMinor >= 0n;
  return (
    <View className="flex-1 flex-row items-center gap-3 py-2">
      <TintedIcon icon="calendar" ramp={enough ? 'purple' : 'red'} />
      <View className="flex-1 gap-0.5">
        <View className="flex-row justify-between gap-2">
          <Text className="flex-1 text-[15px] font-medium" numberOfLines={1}>
            {p.name}
          </Text>
          <Text className="text-[15px]">{money(p.amountMinor)}</Text>
        </View>
        <Text className={`text-[13px] ${label === 'Vencido' ? 'text-negative' : 'text-secondary'}`}>
          {label}
          {p.repeat === 'monthly' ? ' · cada mes' : ''} · {p.walletName}
        </Text>
        <Text className={`text-[13px] font-medium ${enough ? 'text-positive' : 'text-negative'}`}>
          {enough ? `Te quedarían ${money(p.leftMinor)}` : `Te faltan ${money(-p.leftMinor)}`}
        </Text>
      </View>
    </View>
  );
}
