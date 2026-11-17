import { ScrollView } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { SignOutButton } from '@/features/auth/components/sign-out-button';
import { BudgetsSummary } from '@/features/budgets/components/budgets-summary';
import { InvestmentsSummary } from '@/features/investments/components/investment-totals';
import { MonthSummary } from '@/features/transactions/components/month-summary';
import { MonthlyChart } from '@/features/transactions/components/monthly-chart';
import { WalletsSummary } from '@/features/wallets/components/wallets-summary';

export default function DashboardScreen() {
  return (
    <Screen title="Resumen">
      <ScrollView contentContainerStyle={{ gap: 24, paddingBottom: 16 }}>
        <WalletsSummary />
        <MonthSummary />
        <MonthlyChart />
        <BudgetsSummary />
        <InvestmentsSummary />
        <SignOutButton />
      </ScrollView>
    </Screen>
  );
}
