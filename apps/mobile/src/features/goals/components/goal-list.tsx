import { formatMoney } from '@finanzas/shared';
import { Link } from 'expo-router';
import { FlatList, Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { type Goal, useGoals } from '../api';

export function GoalList() {
  const { data, isLoading, error } = useGoals();

  if (isLoading) return <Text className="text-secondary">Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;
  const goals = data ?? [];

  return (
    <FlatList
      className="-mx-4"
      contentContainerClassName="px-4 pb-6 pt-5"
      data={goals}
      keyExtractor={(g) => g.id}
      ListEmptyComponent={
        <Text className="py-8 text-center text-secondary">Crea tu primera meta de ahorro.</Text>
      }
      renderItem={({ item, index }) => (
        <GoalRow item={item} first={index === 0} last={index === goals.length - 1} />
      )}
    />
  );
}

function GoalRow({ item, first, last }: { item: Goal; first: boolean; last: boolean }) {
  const saved = item.savedMinor;
  const target = item.targetMinor;
  const pct = target > 0n ? Number((saved * 100n) / target) : 0;
  const done = item.status === 'completed';
  return (
    <Link href={{ pathname: '/goals/[id]/contribute', params: { id: item.id } }} asChild>
      <Pressable
        className={`gap-2 bg-card px-4 py-3 active:opacity-60 ${
          first ? 'rounded-t-2xl' : 'border-t border-separator'
        } ${last ? 'rounded-b-2xl' : ''}`}
        accessibilityRole="button"
        accessibilityHint="Abre el formulario para aportar a esta meta"
      >
        <View className="flex-row items-baseline justify-between">
          <Text className="flex-1 pr-3 text-[17px] font-medium" numberOfLines={1}>
            {item.name}
          </Text>
          <Text
            className={`text-[15px] ${done ? 'font-semibold text-positive' : 'text-secondary'}`}
          >
            {done ? 'Cumplida' : `${pct}%`}
          </Text>
        </View>
        <View
          className="h-1.5 overflow-hidden rounded-full bg-fill"
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: Math.min(pct, 100) }}
        >
          <View
            className="h-full rounded-full bg-accent"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </View>
        <Text className="text-[13px] text-secondary">
          {formatMoney(saved)} de {formatMoney(target)}
        </Text>
      </Pressable>
    </Link>
  );
}
