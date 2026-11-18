import { formatMoney, type InvestmentPeriod } from '@finanzas/shared';
import { useState } from 'react';
import { View } from 'react-native';
import { Card, Row } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useInvestments } from '../api';
import { changeClass, formatChange, PERIOD_CHANGE_LABELS } from '../format';
import { PeriodChips } from './period-chips';

type Stats = {
  investedMinor: bigint;
  valueMinor: bigint;
  gainMinor: bigint;
  periodGainMinor: bigint;
  periodBaseMinor: bigint;
};

/** Valor, lo invertido y cómo le fue en el periodo: para el total o para una inversión. */
export function StatsBlock({ stats, period }: { stats: Stats; period: InvestmentPeriod }) {
  return (
    <View>
      <Row label="Vale hoy" value={formatMoney(stats.valueMinor)} strong />
      <Row label="Invertiste" value={formatMoney(stats.investedMinor)} />
      <Row
        label="Ganancia total"
        value={formatChange(stats.gainMinor, stats.investedMinor)}
        valueClassName={`font-medium ${changeClass(stats.gainMinor)}`}
      />
      <Row
        label={PERIOD_CHANGE_LABELS[period]}
        value={formatChange(stats.periodGainMinor, stats.periodBaseMinor)}
        valueClassName={`font-medium ${changeClass(stats.periodGainMinor)}`}
      />
    </View>
  );
}

/** Totales de todas las inversiones; se usa en Resumen y en la pestaña Inversiones. */
export function InvestmentTotals({ period }: { period: InvestmentPeriod }) {
  const { data, isLoading, error } = useInvestments(period);
  if (isLoading) return <Text className="text-secondary">Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;
  if (!data?.items.length) {
    return <Text className="py-1 text-secondary">Todavía no registras inversiones.</Text>;
  }
  return <StatsBlock stats={data.totals} period={period} />;
}

/** Bloque de Resumen: totales con selector de periodo. */
export function InvestmentsSummary() {
  const [period, setPeriod] = useState<InvestmentPeriod>('month');
  return (
    <Card title="Inversiones">
      <View className="pb-1 pt-1">
        <PeriodChips value={period} onChange={setPeriod} />
      </View>
      <InvestmentTotals period={period} />
    </Card>
  );
}
