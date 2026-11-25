import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { QuickActions } from '@/components/quick-actions';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { InsightsCard } from '@/features/insights/insights-card';
import { MonthSummary } from '@/features/transactions/components/month-summary';
import { MonthlyChart } from '@/features/transactions/components/monthly-chart';
import { RecentTransactions } from '@/features/transactions/components/recent-transactions';
import { BalanceHero, WalletsSummary } from '@/features/wallets/components/wallets-summary';

const month = () => {
  const text = new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/** Saludo según la hora del teléfono. */
const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
};

// Solo lo del día a día. Pagos, topes, metas e inversiones tienen su propia pantalla.
export default function DashboardScreen() {
  const [chart, setChart] = useState(false);
  return (
    <Screen title="Resumen" greeting={greeting()} eyebrow={month()}>
      <ScrollView className="-mx-4" contentContainerClassName="gap-6 px-4 pb-4">
        <BalanceHero />
        <QuickActions />
        <InsightsCard />
        <WalletsSummary />
        <RecentTransactions />
        <MonthSummary />
        {chart ? (
          <MonthlyChart />
        ) : (
          <Pressable
            className="min-h-[48px] items-center justify-center rounded-2xl bg-card active:opacity-60"
            onPress={() => setChart(true)}
            accessibilityRole="button"
          >
            <Text className="text-[15px] font-medium text-accent">Ver ingresos vs gastos</Text>
          </Pressable>
        )}
        <Link href="/backup" asChild>
          <Pressable
            className="min-h-[44px] items-center justify-center"
            accessibilityRole="button"
          >
            <Text className="text-[15px] text-accent">Copia y seguridad</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </Screen>
  );
}
