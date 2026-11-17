import { formatMoney } from '@finanzas/shared';
import { matchFont } from '@shopify/react-native-skia';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { BarGroup, CartesianChart } from 'victory-native';
import { useMonthlyTotals } from '../api';

const INCOME = '#1b5e20';
const EXPENSE = '#b00020';
// Fuente del sistema: no hace falta empacar un .ttf para los ejes.
const font = matchFont({
  fontFamily: Platform.select({ ios: 'Helvetica', default: 'sans-serif' }),
  fontSize: 11,
});
const monthName = (key: string) =>
  new Date(`${key}-15T12:00:00Z`).toLocaleDateString('es-CO', { month: 'short' });
// 1.200.000 → "1,2 M": los ejes no tienen espacio para el monto completo.
const compact = new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 });

/** Barras de ingresos y gastos de los últimos 6 meses. Va en Resumen. */
export function MonthlyChart() {
  const { data, isLoading, error } = useMonthlyTotals();
  if (isLoading) return <Text>Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;
  const months = data ?? [];

  // Number() basta para dibujar; los montos exactos van en el texto de abajo.
  const points = months.map((m) => ({
    month: monthName(m.month),
    income: Number(m.incomeMinor),
    expense: Number(m.expenseMinor),
  }));
  const summary = months
    .map(
      (m) =>
        `${monthName(m.month)}: ingresos ${formatMoney(BigInt(m.incomeMinor))}, gastos ${formatMoney(BigInt(m.expenseMinor))}`,
    )
    .join('. ');

  return (
    <View style={styles.block}>
      <Text style={styles.caption} accessibilityRole="header">
        Ingresos vs gastos (6 meses)
      </Text>
      <View style={styles.legend}>
        <Legend color={INCOME} label="Ingresos" />
        <Legend color={EXPENSE} label="Gastos" />
      </View>
      {/* El lector de pantalla no ve las barras: lee los montos de cada mes. */}
      <View style={styles.chart} accessible accessibilityLabel={summary}>
        <CartesianChart
          data={points}
          xKey="month"
          yKeys={['income', 'expense']}
          domain={{ y: [0] }}
          domainPadding={{ left: 24, right: 24, top: 12 }}
          xAxis={{ font, lineWidth: 0, labelColor: '#555' }}
          yAxis={[
            {
              font,
              labelColor: '#555',
              lineColor: '#e0e0e0',
              formatYLabel: (v) => compact.format(Number(v)),
            },
          ]}
        >
          {({ points: p, chartBounds }) => (
            <BarGroup chartBounds={chartBounds} betweenGroupPadding={0.35} withinGroupPadding={0.1}>
              <BarGroup.Bar points={p.income} color={INCOME} />
              <BarGroup.Bar points={p.expense} color={EXPENSE} />
            </BarGroup>
          )}
        </CartesianChart>
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 8 },
  caption: { color: '#555', fontWeight: '600' },
  legend: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 12, height: 12, borderRadius: 2 },
  chart: { height: 200 },
});
