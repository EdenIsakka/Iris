import { Link } from 'expo-router';
import { Pressable, ScrollView } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { BudgetsSummary } from '@/features/budgets/components/budgets-summary';
import { InvestmentsSummary } from '@/features/investments/components/investment-totals';
import { PaymentsSummary } from '@/features/payments/components/payments-summary';
import { MonthSummary } from '@/features/transactions/components/month-summary';
import { MonthlyChart } from '@/features/transactions/components/monthly-chart';
import { WalletsSummary } from '@/features/wallets/components/wallets-summary';
import { bankNotifications } from '../../modules/bank-notifications';

export default function DashboardScreen() {
  return (
    <Screen title="Resumen">
      <ScrollView className="-mx-4" contentContainerClassName="gap-6 px-4 pb-4">
        <WalletsSummary />
        <PaymentsSummary />
        <MonthSummary />
        <MonthlyChart />
        <BudgetsSummary />
        <InvestmentsSummary />
        {bankNotifications ? (
          <Link href="/bank" asChild>
            <Pressable
              className="min-h-[44px] items-center justify-center"
              accessibilityRole="button"
            >
              <Text className="text-[15px] text-accent">Notificaciones del banco (prueba)</Text>
            </Pressable>
          </Link>
        ) : null}
        <Link href="/backup" asChild>
          <Pressable
            className="min-h-[44px] items-center justify-center"
            accessibilityRole="button"
          >
            <Text className="text-[15px] text-accent">Copia de seguridad</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </Screen>
  );
}
