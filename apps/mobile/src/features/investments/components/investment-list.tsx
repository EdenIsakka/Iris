import { formatMoney, type InvestmentPeriod } from '@finanzas/shared';
import { Link } from 'expo-router';
import { FlatList, Pressable, View } from 'react-native';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { type Investment, useInvestments } from '../api';
import { changeClass, formatChange, KIND_LABELS } from '../format';
import { StatsBlock } from './investment-totals';

export function InvestmentList({ period }: { period: InvestmentPeriod }) {
  const { data, isLoading, error } = useInvestments(period);

  if (isLoading) return <Text className="text-secondary">Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;
  const items = data?.items ?? [];

  return (
    <FlatList
      className="-mx-4"
      contentContainerClassName="px-4 pb-6 pt-2"
      data={items}
      keyExtractor={(i) => i.id}
      ListHeaderComponent={
        data && items.length ? (
          <View className="gap-5 pb-2">
            <Card title="Total">
              <StatsBlock stats={data.totals} period={period} />
            </Card>
            <Text
              className="px-4 text-[13px] font-medium uppercase tracking-wide text-secondary"
              accessibilityRole="header"
            >
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
  return (
    <Link href={{ pathname: '/investments/[id]', params: { id: item.id, period } }} asChild>
      <Pressable
        className={`min-h-[56px] flex-row items-center justify-between bg-card px-4 py-2 active:opacity-60 ${
          first ? 'rounded-t-2xl' : 'border-t border-separator'
        } ${last ? 'rounded-b-2xl' : ''}`}
        accessibilityRole="button"
        accessibilityHint="Abre el detalle para actualizar el valor o aportar"
      >
        <View className="flex-1 pr-3">
          <Text className="text-[17px]" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="text-[13px] text-secondary">{KIND_LABELS[item.kind]}</Text>
        </View>
        <View className="items-end">
          <Text className="text-[17px] font-medium">{formatMoney(item.valueMinor)}</Text>
          <Text className={`text-[13px] ${changeClass(item.periodGainMinor)}`}>
            {formatChange(item.periodGainMinor, item.periodBaseMinor)}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}
