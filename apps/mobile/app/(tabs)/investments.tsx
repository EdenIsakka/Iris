import type { InvestmentPeriod } from '@finanzas/shared';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable } from 'react-native';
import { Fab } from '@/components/ui/fab';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { InvestmentList } from '@/features/investments/components/investment-list';
import { PeriodChips } from '@/features/investments/components/period-chips';

export default function InvestmentsScreen() {
  const [period, setPeriod] = useState<InvestmentPeriod>('month');
  return (
    <Screen title="Inversiones">
      <PeriodChips value={period} onChange={setPeriod} />
      <InvestmentList period={period} />
      <Fab href="/investments/new" label="Nueva inversión" />
      <Link href="/price-key" asChild>
        <Pressable className="min-h-[44px] items-center justify-center" accessibilityRole="button">
          <Text className="text-[15px] text-accent">Precios automáticos</Text>
        </Pressable>
      </Link>
    </Screen>
  );
}
