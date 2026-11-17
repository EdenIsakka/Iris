import { formatMoney, type InvestmentPeriod } from '@finanzas/shared';
import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { useInvestments } from '../api';
import { changeClass, formatChange, KIND_LABELS, PERIOD_CHANGE_LABELS } from '../format';
import { StatsBlock } from './investment-totals';

export function InvestmentList({ period }: { period: InvestmentPeriod }) {
  const { data, isLoading, error } = useInvestments(period);

  if (isLoading) return <Text>Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;

  return (
    <FlatList
      data={data?.items ?? []}
      keyExtractor={(i) => i.id}
      ListHeaderComponent={
        data?.items.length ? (
          <>
            <Text style={styles.caption}>Total</Text>
            <StatsBlock stats={data.totals} period={period} />
          </>
        ) : undefined
      }
      ListEmptyComponent={
        <Text>Registra lo que tienes en cripto, acciones, fondos o CDT para ver cómo va.</Text>
      }
      renderItem={({ item }) => (
        <Link href={{ pathname: '/investments/[id]', params: { id: item.id, period } }} asChild>
          <Pressable
            style={styles.item}
            accessibilityRole="button"
            accessibilityHint="Abre el detalle para actualizar el valor o aportar"
          >
            <Text style={styles.name}>
              {item.name} · {KIND_LABELS[item.kind]}
            </Text>
            <Text>Vale {formatMoney(BigInt(item.valueMinor))}</Text>
            <Text className={changeClass(item.periodGainMinor)}>
              {PERIOD_CHANGE_LABELS[period]}:{' '}
              {formatChange(item.periodGainMinor, item.periodBaseMinor)}
            </Text>
          </Pressable>
        </Link>
      )}
    />
  );
}

const styles = StyleSheet.create({
  caption: { color: '#555', fontWeight: '600' },
  item: { paddingVertical: 12, gap: 4, minHeight: 44 },
  name: { fontWeight: '600' },
});
