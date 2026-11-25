import { Link } from 'expo-router';
import { Pressable } from 'react-native';
import { Card, CardAction } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useCategories, useTransactions } from '../api';
import { TransactionRow } from './transaction-list';

/** Los 5 movimientos más recientes y un enlace a la lista completa. Va en Resumen. */
export function RecentTransactions() {
  const { data, isLoading, error } = useTransactions();
  const categories = useCategories();
  if (isLoading) return <Text className="text-secondary">Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;
  const items = (data?.pages[0] ?? []).slice(0, 5);
  const categoryName = (id: string | null) => categories.data?.find((c) => c.id === id)?.name;

  return (
    <Card title="Últimos movimientos">
      {items.length ? (
        items.map((t, i) => (
          <TransactionRow
            key={t.id}
            item={t}
            category={categoryName(t.categoryId)}
            first={i === 0}
            last={i === items.length - 1}
            inCard
          />
        ))
      ) : (
        <Text className="py-1 text-secondary">Registra tu primer gasto o ingreso.</Text>
      )}
      <Link href="/transactions" asChild>
        <Pressable
          className="min-h-[44px] justify-center border-t border-separator"
          accessibilityRole="button"
        >
          <CardAction label="Ver todos" />
        </Pressable>
      </Link>
    </Card>
  );
}
