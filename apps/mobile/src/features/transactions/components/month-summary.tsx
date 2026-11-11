import { formatMoney } from '@finanzas/shared';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useMonthSummary } from '../api';

export function MonthSummary() {
  const { data, isLoading, error } = useMonthSummary();

  if (isLoading) return <Text>Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;
  if (!data) return null;

  const income = BigInt(data.incomeMinor);
  const expense = BigInt(data.expenseMinor);
  const balance = income - expense;

  return (
    <FlatList
      data={data.byCategory}
      keyExtractor={(c, i) => `${c.name ?? ''}-${i}`}
      ListHeaderComponent={
        <View style={styles.totals}>
          <Text style={styles.caption}>Este mes</Text>
          <Row label="Ingresos" value={formatMoney(income)} />
          <Row label="Gastos" value={formatMoney(expense)} />
          <Row label="Balance" value={formatMoney(balance)} bold />
          <Text style={[styles.caption, styles.section]} accessibilityRole="header">
            Gastos por categoría
          </Text>
        </View>
      }
      ListEmptyComponent={<Text>Todavía no tienes gastos este mes.</Text>}
      renderItem={({ item }) => (
        <Row label={item.name ?? 'Sin categoría'} value={formatMoney(BigInt(item.amountMinor))} />
      )}
    />
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  const style = bold ? styles.bold : undefined;
  return (
    <View style={styles.row}>
      <Text style={style}>{label}</Text>
      <Text style={style}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  totals: { gap: 4, marginBottom: 4 },
  caption: { color: '#555', fontWeight: '600' },
  section: { marginTop: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  bold: { fontWeight: '700' },
});
