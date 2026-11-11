import { Screen } from '@/components/ui/screen';
import { MonthSummary } from '@/features/transactions/components/month-summary';

// TODO(dashboard): saldo total, gastos del mes vs topes y gráfica con Victory Native.
export default function DashboardScreen() {
  return (
    <Screen title="Resumen">
      <MonthSummary />
    </Screen>
  );
}
