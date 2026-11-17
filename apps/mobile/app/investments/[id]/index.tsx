import { type InvestmentPeriod, investmentPeriod } from '@finanzas/shared';
import { useLocalSearchParams } from 'expo-router';
import { InvestmentDetail } from '@/features/investments/components/investment-detail';

export default function InvestmentScreen() {
  const { id, period } = useLocalSearchParams<{ id: string; period?: InvestmentPeriod }>();
  const initial = investmentPeriod.safeParse(period).data;
  return <InvestmentDetail id={id} initialPeriod={initial} />;
}
