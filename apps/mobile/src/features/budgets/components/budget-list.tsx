import { formatMoney } from '@finanzas/shared';
import { Link } from 'expo-router';
import { FlatList, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { useCategories } from '@/features/transactions/api';
import { useBudgets } from '../api';

/** Categorías de gasto con su tope; tocar una lo fija o lo quita. */
export function BudgetList() {
  const categories = useCategories();
  const budgets = useBudgets();

  if (categories.isLoading || budgets.isLoading) {
    return <Text className="p-4 text-secondary">Cargando…</Text>;
  }
  const error = categories.error ?? budgets.error;
  if (error) return <Text className="p-4">{error.message}</Text>;
  const expenses = (categories.data ?? []).filter((c) => c.kind === 'expense');

  return (
    <FlatList
      className="flex-1 bg-background"
      contentContainerClassName="p-4 pb-8"
      data={expenses}
      keyExtractor={(c) => c.id}
      ListHeaderComponent={
        <Text className="px-4 pb-3 text-[15px] text-secondary">
          Un tope vale cada mes hasta que lo cambies.
        </Text>
      }
      ListEmptyComponent={
        <Text className="py-8 text-center text-secondary">No tienes categorías de gasto.</Text>
      }
      renderItem={({ item, index }) => {
        const budget = budgets.data?.find((b) => b.categoryId === item.id);
        return (
          <Link href={{ pathname: '/budgets/[id]', params: { id: item.id } }} asChild>
            <Pressable
              className={`min-h-[48px] flex-row items-center justify-between gap-2 bg-card px-4 active:opacity-60 ${
                index === 0 ? 'rounded-t-2xl' : 'border-t border-separator'
              } ${index === expenses.length - 1 ? 'rounded-b-2xl' : ''}`}
              accessibilityRole="button"
              accessibilityHint="Abre la categoría para fijar o quitar su tope"
            >
              <Text className="flex-1 text-[17px]" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className={`text-[17px] ${budget ? '' : 'text-secondary'}`}>
                {budget ? formatMoney(BigInt(budget.limitMinor)) : 'Sin tope'}
              </Text>
            </Pressable>
          </Link>
        );
      }}
    />
  );
}
