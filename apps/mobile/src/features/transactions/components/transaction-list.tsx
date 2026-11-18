import { formatMoney } from '@finanzas/shared';
import { Link } from 'expo-router';
import { FlatList, Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { type Transaction, useCategories, useTransactions } from '../api';

const dayLabel = (date: Date) =>
  date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

export function TransactionList() {
  const { data, isLoading, error, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useTransactions();
  const categories = useCategories();
  const categoryName = (id: string | null) => categories.data?.find((c) => c.id === id)?.name;

  if (isLoading) return <Text className="text-secondary">Cargando…</Text>;
  if (error && !data) return <Text>{error.message}</Text>;
  const items = data?.pages.flat() ?? [];

  return (
    <FlatList
      className="-mx-4"
      contentContainerClassName="px-4 pb-6"
      data={items}
      keyExtractor={(t) => t.id}
      ListEmptyComponent={
        <Text className="py-8 text-center text-secondary">Aún no tienes movimientos.</Text>
      }
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
      }}
      ListFooterComponent={
        isFetchingNextPage ? (
          <Text className="py-4 text-center text-secondary">Cargando más…</Text>
        ) : error ? (
          <Text className="py-4 text-negative" accessibilityRole="alert">
            {error.message}
          </Text>
        ) : undefined
      }
      // Agrupa por día: cada fila sabe si abre o cierra su grupo para redondear la tarjeta.
      renderItem={({ item, index }) => {
        const day = dayLabel(item.occurredAt);
        const prev = items[index - 1];
        const next = items[index + 1];
        const first = !prev || dayLabel(prev.occurredAt) !== day;
        const last = !next || dayLabel(next.occurredAt) !== day;
        return (
          <>
            {first ? (
              <Text
                className="px-4 pb-2 pt-5 text-[13px] font-medium uppercase tracking-wide text-secondary"
                accessibilityRole="header"
              >
                {day}
              </Text>
            ) : null}
            <TransactionRow
              item={item}
              category={categoryName(item.categoryId)}
              first={first}
              last={last}
            />
          </>
        );
      }}
    />
  );
}

type RowProps = { item: Transaction; category: string | undefined; first: boolean; last: boolean };

function TransactionRow({ item, category, first, last }: RowProps) {
  const income = item.kind === 'income';
  const fallback = income ? 'Ingreso' : 'Gasto';
  // Con nota: la nota arriba y la categoría abajo. Sin nota: la categoría es el título.
  const title = item.note ?? category ?? fallback;
  const subtitle = item.note ? (category ?? fallback) : null;
  return (
    <Link href={{ pathname: '/transactions/[id]', params: { id: item.id } }} asChild>
      <Pressable
        className={`min-h-[56px] flex-row items-center justify-between bg-card px-4 py-2 active:opacity-60 ${
          first ? 'rounded-t-2xl' : 'border-t border-separator'
        } ${last ? 'rounded-b-2xl' : ''}`}
        accessibilityRole="button"
        accessibilityHint="Abre el movimiento para editarlo o borrarlo"
      >
        <View className="flex-1 pr-3">
          <Text className="text-[17px]" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-[13px] text-secondary" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Text className={`text-[17px] font-medium ${income ? 'text-positive' : ''}`}>
          {income ? '+' : '−'}
          {formatMoney(item.amountMinor)}
        </Text>
      </Pressable>
    </Link>
  );
}
