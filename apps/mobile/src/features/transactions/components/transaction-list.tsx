import Ionicons from '@expo/vector-icons/Ionicons';
import { formatMoney } from '@finanzas/shared';
import { Link } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, useColorScheme, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useMonthTransfers } from '@/features/transfers/api';
import { TransferRow } from '@/features/transfers/components/transfer-row';
import { palette } from '@/lib/theme';
import { type Transaction, useCategories, useMonthSummary, useMonthTransactions } from '../api';
import { CategoryIcon } from './category-icon';

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const dayLabel = (date: Date) =>
  capitalize(date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }));

const monthLabel = (back: number) => {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() - back, 1);
  return capitalize(first.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }));
};

/** Los movimientos de un mes, agrupados por día; las flechas pasan a otros meses. */
export function TransactionList() {
  const [back, setBack] = useState(0);
  const { data, isLoading, error } = useMonthTransactions(back);
  const summary = useMonthSummary(back).data;
  const categories = useCategories();
  const categoryName = (id: string | null) => categories.data?.find((c) => c.id === id)?.name;
  const colors = palette[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const transfers = useMonthTransfers(back).data;
  // Movimientos y transferencias juntos, del más nuevo al más viejo.
  const items = [...(data ?? []), ...(transfers ?? [])].sort(
    (a, b) => b.occurredAt.getTime() - a.occurredAt.getTime(),
  );

  // step 1 = un mes atrás; -1 = un mes adelante, que no existe estando en el actual.
  const arrow = (step: 1 | -1) => {
    const disabled = step === -1 && back === 0;
    return (
      <Pressable
        className="min-h-[44px] min-w-[44px] items-center justify-center active:opacity-60"
        disabled={disabled}
        onPress={() => setBack(back + step)}
        accessibilityRole="button"
        accessibilityLabel={step === 1 ? 'Mes anterior' : 'Mes siguiente'}
        accessibilityState={{ disabled }}
      >
        <Ionicons
          name={step === 1 ? 'chevron-back' : 'chevron-forward'}
          size={24}
          color={disabled ? colors.separator : colors.accent}
        />
      </Pressable>
    );
  };

  return (
    <FlatList
      className="-mx-4"
      contentContainerClassName="px-4 pb-24"
      data={items}
      keyExtractor={(t) => t.id}
      ListHeaderComponent={
        <View className="pt-2">
          <View className="flex-row items-center justify-between">
            {arrow(1)}
            <Text className="text-[17px] font-semibold" accessibilityRole="header">
              {monthLabel(back)}
            </Text>
            {arrow(-1)}
          </View>
          {summary ? (
            <Text className="text-center text-[15px]" style={{ fontVariant: ['tabular-nums'] }}>
              <Text className="text-positive">Entró {formatMoney(summary.incomeMinor)}</Text>
              <Text className="text-secondary"> · </Text>
              <Text className="text-negative">Salió {formatMoney(summary.expenseMinor)}</Text>
            </Text>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <Text className="py-8 text-center text-secondary">
          {isLoading ? 'Cargando…' : error ? error.message : 'No hay movimientos en este mes.'}
        </Text>
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
            {'fromWalletId' in item ? (
              <TransferRow item={item} first={first} last={last} />
            ) : (
              <TransactionRow
                item={item}
                category={categoryName(item.categoryId)}
                first={first}
                last={last}
              />
            )}
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
          className={`text-[17px] font-medium ${income ? 'text-positive' : 'text-negative'}`}
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {income ? '+' : '−'}
          {formatMoney(item.amountMinor, item.currency)}
        </Text>
      </Pressable>
    </Link>
  );
}
