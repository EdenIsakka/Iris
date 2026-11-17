import { formatMoney } from '@finanzas/shared';
import { matchFont } from '@shopify/react-native-skia';
import { Platform, useColorScheme, View } from 'react-native';
import { BarGroup, CartesianChart } from 'victory-native';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { palette } from '@/lib/theme';
import { useMonthlyTotals } from '../api';

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
  // La gráfica se dibuja con Skia, que no lee className: toma los colores del tema directo.
  const c = palette[useColorScheme() === 'dark' ? 'dark' : 'light'];
  if (isLoading) return <Text className="text-secondary">Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;
  const months = data ?? [];

  // Number() basta para dibujar; los montos exactos van en la descripción accesible.
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
    <Card title="Ingresos vs gastos · 6 meses">
      <View className="flex-row gap-4 pt-1">
        <Legend color={c.positive} label="Ingresos" />
        <Legend color={c.negative} label="Gastos" />
      </View>
      {/* El lector de pantalla no ve las barras: lee los montos de cada mes. */}
      <View className="h-[200px]" accessible accessibilityLabel={summary}>
        <CartesianChart
          data={points}
          xKey="month"
          yKeys={['income', 'expense']}
          domain={{ y: [0] }}
          domainPadding={{ left: 24, right: 24, top: 12 }}
          xAxis={{ font, lineWidth: 0, labelColor: c.secondary }}
          yAxis={[
            {
              font,
              labelColor: c.secondary,
              lineColor: c.separator,
              formatYLabel: (v) => compact.format(Number(v)),
            },
          ]}
        >
          {({ points: p, chartBounds }) => (
            <BarGroup
              chartBounds={chartBounds}
              betweenGroupPadding={0.35}
              withinGroupPadding={0.1}
              roundedCorners={{ topLeft: 4, topRight: 4 }}
            >
              <BarGroup.Bar points={p.income} color={c.positive} />
              <BarGroup.Bar points={p.expense} color={c.negative} />
            </BarGroup>
          )}
        </CartesianChart>
      </View>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <Text className="text-[13px] text-secondary">{label}</Text>
    </View>
  );
}
