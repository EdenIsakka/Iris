import { formatMoney } from '@finanzas/shared';
import { FlatList, Text, View } from 'react-native';
import { useTransactions } from '../api';

export function TransactionList() {
  const { data, isLoading, error } = useTransactions();

  if (isLoading) return <Text>Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(t) => t.id}
      ListEmptyComponent={<Text>Aún no tienes movimientos.</Text>}
      renderItem={({ item }) => (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
          <Text>{item.note ?? (item.kind === 'income' ? 'Ingreso' : 'Gasto')}</Text>
          <Text>
            {item.kind === 'expense' ? '−' : '+'}
            {formatMoney(BigInt(item.amountMinor), 'COP')}
          </Text>
        </View>
      )}
    />
  );
}
