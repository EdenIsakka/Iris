import { formatMoney } from '@finanzas/shared';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { useDeleteTransaction, useTransactions } from '../api';

export function TransactionList() {
  const { data, isLoading, error } = useTransactions();
  const remove = useDeleteTransaction();

  if (isLoading) return <Text>Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;

  function confirmDelete(id: string, label: string) {
    Alert.alert('¿Borrar este movimiento?', `${label}. No se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: () =>
          remove.mutate(id, { onError: (e) => Alert.alert('No se pudo borrar', e.message) }),
      },
    ]);
  }

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(t) => t.id}
      ListEmptyComponent={<Text>Aún no tienes movimientos.</Text>}
      renderItem={({ item }) => {
        const title = item.note ?? (item.kind === 'income' ? 'Ingreso' : 'Gasto');
        const amount = `${item.kind === 'expense' ? '−' : '+'}${formatMoney(BigInt(item.amountMinor))}`;
        return (
          <Pressable
            onPress={() => confirmDelete(item.id, `${title} ${amount}`)}
            disabled={remove.isPending}
            accessibilityRole="button"
            accessibilityHint="Pide confirmación para borrar este movimiento"
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 8,
              minHeight: 44,
            }}
          >
            <View>
              <Text>{title}</Text>
              <Text style={{ color: '#555', fontSize: 12 }}>
                {new Date(item.occurredAt).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
            </View>
            <Text>{amount}</Text>
          </Pressable>
        );
      }}
    />
  );
}
