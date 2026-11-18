import { ScrollView } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BudgetsSummary } from '@/features/budgets/components/budgets-summary';
import { InvestmentsSummary } from '@/features/investments/components/investment-totals';
import { MonthSummary } from '@/features/transactions/components/month-summary';
import { MonthlyChart } from '@/features/transactions/components/monthly-chart';
import { WalletsSummary } from '@/features/wallets/components/wallets-summary';

export default function DashboardScreen() {
  return (
    <Screen title="Resumen">
      <ScrollView className="-mx-4" contentContainerClassName="gap-6 px-4 pb-4">
        <WalletsSummary />
        <MonthSummary />
        <MonthlyChart />
        <BudgetsSummary />
        <InvestmentsSummary />
      </ScrollView>
    </Screen>
  );
}
