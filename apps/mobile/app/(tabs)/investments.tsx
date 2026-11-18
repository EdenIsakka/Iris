import type { InvestmentPeriod } from '@finanzas/shared';
import { useState } from 'react';
import { LinkButton } from '@/components/ui/link-button';
import { Screen } from '@/components/ui/screen';
import { InvestmentList } from '@/features/investments/components/investment-list';
import { PeriodChips } from '@/features/investments/components/period-chips';

export default function InvestmentsScreen() {
  const [period, setPeriod] = useState<InvestmentPeriod>('month');
  return (
    <Screen title="Inversiones">
      <LinkButton href="/investments/new" label="Nueva inversión" />
      <PeriodChips value={period} onChange={setPeriod} />
      <InvestmentList period={period} />
    </Screen>
  );
}
