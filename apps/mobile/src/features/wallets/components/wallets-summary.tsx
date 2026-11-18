import { formatMoney } from '@finanzas/shared';
import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Card, CardAction } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useWallets } from '../api';

/** Saldo total y de cada billetera; tocar una abre su edición. Va en Resumen. */
export function WalletsSummary() {
  const { data, isLoading, error } = useWallets();
  if (isLoading) return <Text className="text-secondary">Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;
  const wallets = data ?? [];
  const total = wallets.reduce((acc, w) => acc + BigInt(w.balanceMinor), 0n);

  return (
    <Card title="Billeteras">
      <View className="pb-2">
        <Text className="text-[13px] text-secondary">Saldo total</Text>
        <Text className="text-[28px] font-bold tracking-tight">{formatMoney(total)}</Text>
      </View>
      {wallets.map((w) => (
        <Link key={w.id} href={{ pathname: '/wallets/[id]', params: { id: w.id } }} asChild>
          <Pressable
            className="min-h-[44px] flex-row items-center justify-between gap-2 border-t border-separator active:opacity-60"
            accessibilityRole="button"
            accessibilityHint="Abre la billetera para editarla o borrarla"
          >
            <Text className="flex-1 text-[15px]" numberOfLines={1}>
              {w.name}
            </Text>
            <Text className="text-[15px]">{formatMoney(BigInt(w.balanceMinor))}</Text>
          </Pressable>
        </Link>
      ))}
      <Link href="/wallets/new" asChild>
        <Pressable
          className="min-h-[44px] justify-center border-t border-separator"
          accessibilityRole="button"
        >
          <CardAction label="Nueva billetera" />
        </Pressable>
      </Link>
    </Card>
  );
}
