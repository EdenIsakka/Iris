import { formatMoney, type InvestmentPeriod } from '@finanzas/shared';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useInvestments } from '../api';
import { changeColor, formatChange, PERIOD_CHANGE_LABELS } from '../format';
import { PeriodChips } from './period-chips';

type Stats = {
  investedMinor: string;
  valueMinor: string;
  gainMinor: string;
  periodGainMinor: string;
  periodBaseMinor: string;
};

/** Valor, lo invertido y cómo le fue en el periodo: para el total o para una inversión. */
export function StatsBlock({ stats, period }: { stats: Stats; period: InvestmentPeriod }) {
  return (
    <View style={styles.block}>
      <Row label="Vale hoy" value={formatMoney(BigInt(stats.valueMinor))} bold />
      <Row label="Invertiste" value={formatMoney(BigInt(stats.investedMinor))} />
      <Row
        label="Ganancia total"
        value={formatChange(stats.gainMinor, stats.investedMinor)}
        color={changeColor(stats.gainMinor)}
      />
      <Row
        label={PERIOD_CHANGE_LABELS[period]}
        value={formatChange(stats.periodGainMinor, stats.periodBaseMinor)}
        color={changeColor(stats.periodGainMinor)}
      />
    </View>
  );
}

/** Totales de todas las inversiones; se usa en Resumen y en la pestaña Inversiones. */
export function InvestmentTotals({ period }: { period: InvestmentPeriod }) {
  const { data, isLoading, error } = useInvestments(period);
  if (isLoading) return <Text>Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;
  if (!data?.items.length) return <Text>Todavía no registras inversiones.</Text>;
  return <StatsBlock stats={data.totals} period={period} />;
}

/** Bloque de Resumen: totales con selector de periodo. */
export function InvestmentsSummary() {
  const [period, setPeriod] = useState<InvestmentPeriod>('month');
  return (
    <View style={styles.block}>
      <Text style={styles.caption} accessibilityRole="header">
        Inversiones
      </Text>
      <PeriodChips value={period} onChange={setPeriod} />
      <InvestmentTotals period={period} />
    </View>
  );
}

function Row({
  label,
  value,
  bold,
  color,
}: {
  label: string;
  value: string;
  bold?: boolean;
  color?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={bold ? styles.bold : undefined}>{label}</Text>
      <Text style={[bold && styles.bold, color ? { color, fontWeight: '600' } : undefined]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 4 },
  caption: { color: '#555', fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, gap: 8 },
  bold: { fontWeight: '700' },
});
