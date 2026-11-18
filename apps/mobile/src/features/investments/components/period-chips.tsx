import { type InvestmentPeriod, investmentPeriod } from '@finanzas/shared';
import { Segmented } from '@/components/ui/form';
import { PERIOD_LABELS } from '../format';

type Props = { value: InvestmentPeriod; onChange: (period: InvestmentPeriod) => void };

const OPTIONS = investmentPeriod.options.map((p) => ({ value: p, label: PERIOD_LABELS[p] }));

export function PeriodChips({ value, onChange }: Props) {
  return <Segmented options={OPTIONS} value={value} onChange={onChange} />;
}
