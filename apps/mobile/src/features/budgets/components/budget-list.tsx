import { formatMoney } from '@finanzas/shared';
import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { useCategories } from '@/features/transactions/api';
import { useBudgets } from '../api';

/** Categorías de gasto con su tope; tocar una lo fija o lo quita. */
export function BudgetList() {
  const categories = useCategories();
  const budgets = useBudgets();

  if (categories.isLoading || budgets.isLoading) return <Text style={styles.pad}>Cargando…</Text>;
  const error = categories.error ?? budgets.error;
  if (error) return <Text style={styles.pad}>{error.message}</Text>;
  const expenses = (categories.data ?? []).filter((c) => c.kind === 'expense');

  return (
    <FlatList
      contentContainerStyle={styles.pad}
      data={expenses}
      keyExtractor={(c) => c.id}
      ListHeaderComponent={
        <Text style={styles.hint}>Un tope vale cada mes hasta que lo cambies.</Text>
      }
      ListEmptyComponent={<Text>No tienes categorías de gasto.</Text>}
      renderItem={({ item }) => {
        const budget = budgets.data?.find((b) => b.categoryId === item.id);
        return (
          <Link href={{ pathname: '/budgets/[id]', params: { id: item.id } }} asChild>
            <Pressable
              style={styles.row}
              accessibilityRole="button"
              accessibilityHint="Abre la categoría para fijar o quitar su tope"
            >
              <Text>{item.name}</Text>
              <Text style={budget ? undefined : styles.none}>
                {budget ? formatMoney(BigInt(budget.limitMinor)) : 'Sin tope'}
              </Text>
            </Pressable>
          </Link>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16 },
  hint: { color: '#555', marginBottom: 8 },
  row: {
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  none: { color: '#555' },
});
