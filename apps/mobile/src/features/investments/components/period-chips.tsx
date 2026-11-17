import { type InvestmentPeriod, investmentPeriod } from '@finanzas/shared';
import { StyleSheet, View } from 'react-native';
import { Chip } from '@/components/ui/chip';
import { PERIOD_LABELS } from '../format';

type Props = { value: InvestmentPeriod; onChange: (period: InvestmentPeriod) => void };

export function PeriodChips({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {investmentPeriod.options.map((p) => (
        <Chip key={p} label={PERIOD_LABELS[p]} selected={p === value} onPress={() => onChange(p)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
