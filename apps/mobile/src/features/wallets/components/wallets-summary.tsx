import { copToUsd, formatMoney, usdToCop } from '@finanzas/shared';
import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Card, CardAction } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { formatDate } from '@/lib/format-date';
import { useTrm, useWallets } from '../api';

/** Saldo total y de cada billetera; tocar una abre su edición. Va en Resumen. */
export function WalletsSummary() {
  const { data, isLoading, error } = useWallets();
  const { data: trm } = useTrm();
  if (isLoading) return <Text className="text-secondary">Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;
  const wallets = data ?? [];
  const sumOf = (currency: string) =>
    wallets.filter((w) => w.currency === currency).reduce((acc, w) => acc + w.balanceMinor, 0n);
  const cop = sumOf('COP');
  const usd = sumOf('USD');
  const hasUsd = wallets.some((w) => w.currency === 'USD');

  return (
    <Card title="Billeteras">
      <View className="pb-2">
        <Text className="text-[13px] text-secondary">Saldo total</Text>
        <Text className="text-[28px] font-bold tracking-tight">
          {formatMoney(trm ? cop + usdToCop(usd, trm.rateMinor) : cop)}
        </Text>
        {/* Sin TRM no hay cómo sumarlos: los dólares van aparte. */}
        {hasUsd && !trm ? (
          <Text className="text-[15px] font-semibold">+ {formatMoney(usd, 'USD')}</Text>
        ) : null}
      </View>
      {wallets.map((w) => (
        <Link key={w.id} href={{ pathname: '/wallets/[id]', params: { id: w.id } }} asChild>
          <Pressable
            className="min-h-[44px] flex-row items-center justify-between gap-2 border-t border-separator py-1 active:opacity-60"
            accessibilityRole="button"
            accessibilityHint="Abre la billetera para editarla o borrarla"
          >
            <Text className="flex-1 text-[15px]" numberOfLines={1}>
              {w.name}
            </Text>
            <View className="items-end">
              <Text className="text-[15px]">{formatMoney(w.balanceMinor, w.currency)}</Text>
              {trm ? (
                <Text className="text-[13px] text-secondary">
                  {w.currency === 'USD'
                    ? formatMoney(usdToCop(w.balanceMinor, trm.rateMinor))
                    : formatMoney(copToUsd(w.balanceMinor, trm.rateMinor), 'USD')}
                </Text>
              ) : null}
            </View>
          </Pressable>
        </Link>
      ))}
      {hasUsd && trm ? (
        <Text className="border-t border-separator pt-2 text-[13px] text-secondary">
          Dólares a {formatMoney(usdToCop(100n, trm.rateMinor))} (TRM vigente desde el{' '}
          {formatDate(new Date(`${trm.date}T12:00:00-05:00`))}). La TRM no cambia los fines de
          semana ni festivos: se usa la última publicada.
        </Text>
      ) : null}
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
