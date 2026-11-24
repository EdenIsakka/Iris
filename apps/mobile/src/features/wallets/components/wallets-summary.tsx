import Ionicons from '@expo/vector-icons/Ionicons';
import { copToUsd, formatMoney, usdToCop } from '@finanzas/shared';
import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Card, CardAction } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useMonthSummary } from '@/features/transactions/api';
import { formatDate } from '@/lib/format-date';
import { useTrm, useWallets } from '../api';

/**
 * Tarjeta principal de Resumen (saldo total y lo que entró y salió este mes) y la lista de
 * billeteras; tocar una abre su edición.
 */
export function WalletsSummary() {
  const { data, isLoading, error } = useWallets();
  const { data: trm } = useTrm();
  const month = useMonthSummary();
  if (isLoading) return <Text className="text-secondary">Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;
  const wallets = data ?? [];
  const sumOf = (currency: string) =>
    wallets.filter((w) => w.currency === currency).reduce((acc, w) => acc + w.balanceMinor, 0n);
  const cop = sumOf('COP');
  const usd = sumOf('USD');
  const hasUsd = wallets.some((w) => w.currency === 'USD');

  return (
    <>
      <View className="gap-3 rounded-3xl bg-hero p-5">
        <View>
          <Text className="text-[13px] text-on-hero-muted">Saldo total</Text>
          <Text className="text-[34px] font-bold tracking-tight text-on-hero" style={tabular}>
            {formatMoney(trm ? cop + usdToCop(usd, trm.rateMinor) : cop)}
          </Text>
          {/* Sin TRM no hay cómo sumarlos: los dólares van aparte. */}
          {hasUsd && !trm ? (
            <Text className="text-[15px] font-semibold text-on-hero">
              + {formatMoney(usd, 'USD')}
            </Text>
          ) : null}
        </View>
        {month.data ? (
          <View className="flex-row gap-2">
            <Tile icon="arrow-down" label="Entró este mes" value={month.data.incomeMinor} />
            <Tile icon="arrow-up" label="Salió este mes" value={month.data.expenseMinor} />
          </View>
        ) : null}
      </View>
      <Card title="Billeteras">
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
    </>
  );
}

const tabular = { fontVariant: ['tabular-nums' as const] };

function Tile({
  icon,
  label,
  value,
}: {
  icon: 'arrow-down' | 'arrow-up';
  label: string;
  value: bigint;
}) {
  return (
    <View className="flex-1 gap-0.5 rounded-2xl bg-hero-tile px-3 py-2">
      <View className="flex-row items-center gap-1">
        <Ionicons name={icon} size={12} color="#CECBF6" />
        <Text className="text-[12px] text-on-hero-muted">{label}</Text>
      </View>
      <Text
        className="text-[17px] font-semibold text-on-hero"
        style={tabular}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {formatMoney(value)}
      </Text>
    </View>
  );
}
