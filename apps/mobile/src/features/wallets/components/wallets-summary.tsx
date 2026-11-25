import { copToUsd, formatMoney, usdToCop } from '@finanzas/shared';
import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Card, CardAction } from '@/components/ui/card';
import { Hero, HeroTile } from '@/components/ui/hero';
import { Text } from '@/components/ui/text';
import { TintedIcon } from '@/components/ui/tinted-icon';
import { useMonthSummary } from '@/features/transactions/api';
import { formatDate } from '@/lib/format-date';
import { useTrm, useWallets } from '../api';

/** Tarjeta principal de Resumen: saldo total y lo que entró y salió este mes. */
export function BalanceHero() {
  const { data } = useWallets();
  const { data: trm } = useTrm();
  const month = useMonthSummary();
  const wallets = data ?? [];
  const sumOf = (currency: string) =>
    wallets.filter((w) => w.currency === currency).reduce((acc, w) => acc + w.balanceMinor, 0n);
  const cop = sumOf('COP');
  const usd = sumOf('USD');

  return (
    <Hero label="Saldo total" value={formatMoney(trm ? cop + usdToCop(usd, trm.rateMinor) : cop)}>
      {/* Sin TRM no hay cómo sumarlos: los dólares van aparte. */}
      {usd !== 0n && !trm ? (
        <Text className="-mt-3 text-[15px] font-semibold text-on-hero">
          + {formatMoney(usd, 'USD')}
        </Text>
      ) : null}
      {month.data ? (
        <View className="flex-row gap-2">
          <HeroTile icon="arrow-down" label="Entró" value={formatMoney(month.data.incomeMinor)} />
          <HeroTile icon="arrow-up" label="Salió" value={formatMoney(month.data.expenseMinor)} />
        </View>
      ) : null}
    </Hero>
  );
}

/** Lista de billeteras con su saldo; tocar una abre su edición. */
export function WalletsSummary() {
  const { data, isLoading, error } = useWallets();
  const { data: trm } = useTrm();
  if (isLoading) return <Text className="text-secondary">Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;
  const wallets = data ?? [];
  const hasUsd = wallets.some((w) => w.currency === 'USD');

  return (
    <Card title="Billeteras">
      {wallets.map((w, i) => (
        <Link key={w.id} href={{ pathname: '/wallets/[id]', params: { id: w.id } }} asChild>
          <Pressable
            className={`min-h-[52px] flex-row items-center gap-3 py-1 active:opacity-60 ${
              i ? 'border-t border-separator' : ''
            }`}
            accessibilityRole="button"
            accessibilityHint="Abre la billetera para editarla o borrarla"
          >
            <TintedIcon
              icon={w.currency === 'USD' ? 'logo-usd' : w.type === 'cash' ? 'cash' : 'wallet'}
              ramp={w.currency === 'USD' ? 'green' : 'purple'}
            />
            <Text className="flex-1 text-[15px]" numberOfLines={1}>
              {w.name}
            </Text>
            <View className="items-end">
              <Text className="text-[15px] font-medium" style={{ fontVariant: ['tabular-nums'] }}>
                {formatMoney(w.balanceMinor, w.currency)}
              </Text>
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
          US$1 = {formatMoney(usdToCop(100n, trm.rateMinor))} · TRM del{' '}
          {formatDate(new Date(`${trm.date}T12:00:00-05:00`))}
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
