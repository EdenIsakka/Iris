import { formatMoney } from '@finanzas/shared';
import { FlatList, Text, View } from 'react-native';
import { useGoals } from '../api';

export function GoalList() {
  const { data, isLoading, error } = useGoals();

  if (isLoading) return <Text>Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(g) => g.id}
      ListEmptyComponent={<Text>Crea tu primera meta de ahorro.</Text>}
      renderItem={({ item }) => {
        const saved = BigInt(item.savedMinor);
        const target = BigInt(item.targetMinor);
        const pct = target > 0n ? Number((saved * 100n) / target) : 0;
        return (
          <View style={{ paddingVertical: 8, gap: 4 }}>
            <Text style={{ fontWeight: '600' }}>{item.name}</Text>
            <Text>
              {formatMoney(saved, 'COP')} de {formatMoney(target, 'COP')} ({pct}%)
            </Text>
          </View>
        );
      }}
    />
  );
}
