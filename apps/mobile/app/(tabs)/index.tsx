import { ScrollView } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { SignOutButton } from '@/features/auth/components/sign-out-button';
import { InvestmentsSummary } from '@/features/investments/components/investment-totals';
import { MonthSummary } from '@/features/transactions/components/month-summary';

// TODO(dashboard): saldo total, gastos del mes vs topes y gráfica con Victory Native.
export default function DashboardScreen() {
  return (
    <Screen title="Resumen">
      <ScrollView contentContainerStyle={{ gap: 24, paddingBottom: 16 }}>
        <MonthSummary />
        <InvestmentsSummary />
        <SignOutButton />
      </ScrollView>
    </Screen>
  );
}
