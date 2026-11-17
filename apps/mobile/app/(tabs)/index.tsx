import { Screen } from '@/components/ui/screen';
import { SignOutButton } from '@/features/auth/components/sign-out-button';
import { MonthSummary } from '@/features/transactions/components/month-summary';

// TODO(dashboard): saldo total, gastos del mes vs topes y gráfica con Victory Native.
export default function DashboardScreen() {
  return (
    <Screen title="Resumen">
      <MonthSummary />
      <SignOutButton />
    </Screen>
  );
}
