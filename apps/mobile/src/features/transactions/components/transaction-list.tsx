import { formatMoney } from '@finanzas/shared';
import { Link } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useTransactions } from '../api';

export function TransactionList() {
  const { data, isLoading, error, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useTransactions();

  if (isLoading) return <Text>Cargando…</Text>;
  if (error && !data) return <Text>{error.message}</Text>;

  return (
    <FlatList
      data={data?.pages.flat() ?? []}
      keyExtractor={(t) => t.id}
      ListEmptyComponent={<Text>Aún no tienes movimientos.</Text>}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
      }}
      ListFooterComponent={
        isFetchingNextPage ? (
          <Text>Cargando más…</Text>
        ) : error ? (
          <Text accessibilityRole="alert">{error.message}</Text>
        ) : undefined
      }
      renderItem={({ item }) => (
        <Link href={{ pathname: '/transactions/[id]', params: { id: item.id } }} asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityHint="Abre el movimiento para editarlo o borrarlo"
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 8,
              minHeight: 44,
            }}
          >
            <View>
              <Text>{item.note ?? (item.kind === 'income' ? 'Ingreso' : 'Gasto')}</Text>
              <Text style={{ color: '#555', fontSize: 12 }}>
                {new Date(item.occurredAt).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
            </View>
            <Text>
              {item.kind === 'expense' ? '−' : '+'}
              {formatMoney(BigInt(item.amountMinor))}
            </Text>
          </Pressable>
        </Link>
      )}
    />
  );
}
