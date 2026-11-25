import { formatMoney } from '@finanzas/shared';
import { Link } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { type Transaction, useCategories, useTransactions } from '../api';
import { CategoryIcon } from './category-icon';

const FILTERS = [
  { value: 'all', label: 'Todo' },
  { value: 'expense', label: 'Gastos' },
  { value: 'income', label: 'Ingresos' },
] as const;

const dayLabel = (date: Date) => {
  const text = date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export function TransactionList() {
  const { data, isLoading, error, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useTransactions();
  const categories = useCategories();
  const categoryName = (id: string | null) => categories.data?.find((c) => c.id === id)?.name;
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['value']>('all');

  if (isLoading) return <Text className="text-secondary">Cargando…</Text>;
  if (error && !data) return <Text>{error.message}</Text>;
  // shortcut: filtra lo ya cargado y la lista pide más páginas al llegar al final; si filtrar
  // se vuelve lento con miles de movimientos, pasar el tipo a la consulta.
  const items = (data?.pages.flat() ?? []).filter((t) => filter === 'all' || t.kind === filter);

  return (
    <FlatList
      className="-mx-4"
      contentContainerClassName="px-4 pb-24"
      data={items}
      keyExtractor={(t) => t.id}
      ListHeaderComponent={
        <View className="flex-row gap-2">
          {FILTERS.map((f) => (
            <Chip
              key={f.value}
              label={f.label}
              selected={filter === f.value}
              onPress={() => setFilter(f.value)}
            />
          ))}
        </View>
      }
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
                className="px-1 pb-2 pt-5 text-[15px] font-semibold text-secondary"
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

type RowProps = {
  item: Transaction;
  category: string | undefined;
  first: boolean;
  last: boolean;
  /** Dentro de una Card (Resumen): sin fondo ni bordes redondeados propios. */
  inCard?: boolean;
};

export function TransactionRow({ item, category, first, last, inCard }: RowProps) {
  const income = item.kind === 'income';
  const fallback = income ? 'Ingreso' : 'Gasto';
  // Con nota: la nota arriba y la categoría abajo. Sin nota: la categoría es el título.
  const title = item.note ?? category ?? fallback;
  const subtitle = item.note ? (category ?? fallback) : null;
  return (
    <Link href={{ pathname: '/transactions/[id]', params: { id: item.id } }} asChild>
      <Pressable
        className={`min-h-[56px] flex-row items-center justify-between py-2 active:opacity-60 ${
          first ? '' : 'border-t border-separator'
        } ${inCard ? '' : `bg-card px-4 ${first ? 'rounded-t-3xl' : ''} ${last ? 'rounded-b-3xl' : ''}`}`}
        accessibilityRole="button"
        accessibilityHint="Abre el movimiento para editarlo o borrarlo"
      >
        <CategoryIcon name={category} income={income} />
        <View className="flex-1 px-3">
          <Text className="text-[17px]" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-[13px] text-secondary" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Text
          className={`text-[17px] font-medium ${income ? 'text-positive' : ''}`}
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {income ? '+' : '−'}
          {formatMoney(item.amountMinor, item.currency)}
        </Text>
      </Pressable>
    </Link>
  );
}
