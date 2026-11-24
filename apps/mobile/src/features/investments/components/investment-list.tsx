import Ionicons from '@expo/vector-icons/Ionicons';
import { formatMoney, type InvestmentKind, type InvestmentPeriod } from '@finanzas/shared';
import { Link } from 'expo-router';
import type { ComponentProps } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { Hero, HeroTile, tabular } from '@/components/ui/hero';
import { Text } from '@/components/ui/text';
import { type Investment, useInvestments } from '../api';
import { changeClass, formatChange, KIND_LABELS, PERIOD_CHANGE_LABELS } from '../format';

const KIND_STYLES: Record<InvestmentKind, [ComponentProps<typeof Ionicons>['name'], string]> = {
  crypto: ['logo-bitcoin', '#BA7517'],
  stocks: ['trending-up', '#378ADD'],
  fund: ['pie-chart', '#1D9E75'],
  cdt: ['lock-closed', '#534AB7'],
  other: ['briefcase', '#888780'],
};

const arrow = (gain: bigint) => (gain < 0n ? 'arrow-down' : 'arrow-up');

export function InvestmentList({ period }: { period: InvestmentPeriod }) {
  const { data, isLoading, error } = useInvestments(period);

  if (isLoading) return <Text className="text-secondary">Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;
  const items = data?.items ?? [];
  const totals = data?.totals;

  return (
    <FlatList
      className="-mx-4"
      contentContainerClassName="px-4 pb-24 pt-2"
      data={items}
      keyExtractor={(i) => i.id}
      ListHeaderComponent={
        totals && items.length ? (
          <View className="gap-2 pb-2">
            <Hero label="Vale hoy" value={formatMoney(totals.valueMinor)}>
              <Text className="-mt-3 text-[13px] text-on-hero-muted" style={tabular}>
                Invertiste {formatMoney(totals.investedMinor)}
              </Text>
              <View className="flex-row gap-2">
                <HeroTile
                  icon={arrow(totals.gainMinor)}
                  label="Ganancia total"
                  value={formatChange(totals.gainMinor, totals.investedMinor)}
                />
                <HeroTile
                  icon={arrow(totals.periodGainMinor)}
                  label={PERIOD_CHANGE_LABELS[period]}
                  value={formatChange(totals.periodGainMinor, totals.periodBaseMinor)}
                />
              </View>
            </Hero>
            <Text className="px-1 pt-4 text-[20px] font-semibold" accessibilityRole="header">
              Mis inversiones
            </Text>
          </View>
        ) : undefined
      }
      ListEmptyComponent={
        <Text className="py-8 text-center text-secondary">
          Registra lo que tienes en cripto, acciones, fondos o CDT para ver cómo va.
        </Text>
      }
      renderItem={({ item, index }) => (
        <InvestmentRow
          item={item}
          period={period}
          first={index === 0}
          last={index === items.length - 1}
        />
      )}
    />
  );
}

type RowProps = { item: Investment; period: InvestmentPeriod; first: boolean; last: boolean };

function InvestmentRow({ item, period, first, last }: RowProps) {
  const [icon, color] = KIND_STYLES[item.kind];
  return (
    <Link href={{ pathname: '/investments/[id]', params: { id: item.id, period } }} asChild>
      <Pressable
        className={`min-h-[60px] flex-row items-center gap-3 bg-card px-4 py-2 active:opacity-60 ${
          first ? 'rounded-t-3xl' : 'border-t border-separator'
        } ${last ? 'rounded-b-3xl' : ''}`}
        accessibilityRole="button"
        accessibilityHint="Abre el detalle para actualizar el valor o aportar"
      >
        <View
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: color }}
        >
          <Ionicons name={icon} size={18} color="#FFFFFF" />
        </View>
        <View className="flex-1">
          <Text className="text-[17px]" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="text-[13px] text-secondary">{KIND_LABELS[item.kind]}</Text>
        </View>
        <View className="items-end">
          <Text className="text-[17px] font-medium" style={tabular}>
            {formatMoney(item.valueMinor)}
          </Text>
          <Text className={`text-[13px] ${changeClass(item.periodGainMinor)}`} style={tabular}>
            {formatChange(item.periodGainMinor, item.periodBaseMinor)}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}
