import { formatMoney, type InvestmentPeriod } from '@finanzas/shared';
import { View } from 'react-native';
import { Row } from '@/components/ui/card';
import { changeClass, formatChange, PERIOD_CHANGE_LABELS } from '../format';

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
