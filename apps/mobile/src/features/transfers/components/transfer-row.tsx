import { formatMoney } from '@finanzas/shared';
import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { TintedIcon } from '@/components/ui/tinted-icon';
import { useWallets } from '@/features/wallets/api';
import type { Transfer } from '../api';

type Props = { item: Transfer; first: boolean; last: boolean };

/** Fila de la lista del mes: no es ingreso ni gasto, así que va sin signo y en gris. */
export function TransferRow({ item, first, last }: Props) {
  const wallets = useWallets().data ?? [];
  const from = wallets.find((w) => w.id === item.fromWalletId);
  const to = wallets.find((w) => w.id === item.toWalletId);
  return (
    <Link href={{ pathname: '/transfers/[id]', params: { id: item.id } }} asChild>
      <Pressable
        className={`min-h-[56px] flex-row items-center justify-between bg-card px-4 py-2 active:opacity-60 ${
          first ? 'rounded-t-3xl' : 'border-t border-separator'
        } ${last ? 'rounded-b-3xl' : ''}`}
        accessibilityRole="button"
        accessibilityHint="Abre la transferencia para verla o borrarla"
      >
        <TintedIcon icon="swap-horizontal" ramp="purple" />
        <View className="flex-1 px-3">
          <Text className="text-[17px]" numberOfLines={1}>
            {item.note ?? 'Transferencia'}
          </Text>
          <Text className="text-[13px] text-secondary" numberOfLines={1}>
            {from?.name ?? '?'} → {to?.name ?? '?'}
          </Text>
        </View>
        <Text
          className="text-[17px] font-medium text-secondary"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {formatMoney(item.amountMinor, from?.currency)}
        </Text>
      </Pressable>
    </Link>
  );
}
