import { formatMoney } from '@finanzas/shared';
import { Link } from 'expo-router';
import { FlatList, Pressable, View } from 'react-native';
import { tabular } from '@/components/ui/hero';
import { Text } from '@/components/ui/text';
import { TintedIcon } from '@/components/ui/tinted-icon';
import { type Goal, useGoals } from '../api';

export function GoalList() {
  const { data, isLoading, error } = useGoals();

  if (isLoading) return <Text className="text-secondary">Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;

  return (
    <FlatList
      className="-mx-4"
      contentContainerClassName="gap-3 px-4 pb-24 pt-2"
      data={data ?? []}
      keyExtractor={(g) => g.id}
      ListEmptyComponent={
        <Text className="py-8 text-center text-secondary">Crea tu primera meta de ahorro.</Text>
      }
      renderItem={({ item }) => <GoalRow item={item} />}
    />
  );
}

/** "2027-03-15" → "marzo de 2027". */
const monthLabel = (iso: string | null) =>
  iso
    ? new Date(`${iso}T12:00:00`).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    : '';

function GoalRow({ item }: { item: Goal }) {
  const saved = item.savedMinor;
  const target = item.targetMinor;
  const pct = Math.min(target > 0n ? Number((saved * 100n) / target) : 0, 100);
  const done = item.status === 'completed' || saved >= target;
  return (
    <Link href={{ pathname: '/goals/[id]/contribute', params: { id: item.id } }} asChild>
      <Pressable
        className="gap-3 rounded-3xl bg-card p-4 active:opacity-60"
        accessibilityRole="button"
        accessibilityHint="Abre el formulario para aportar a esta meta"
      >
        <View className="flex-row items-center gap-3">
          <TintedIcon icon={done ? 'trophy' : 'flag'} ramp={done ? 'green' : 'purple'} />
          <View className="flex-1">
            <Text className="text-[17px] font-semibold" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-[13px] text-secondary">
              {done ? 'Cumplida' : `Te faltan ${formatMoney(target - saved)}`}
            </Text>
          </View>
          <Text className={`text-[20px] font-bold ${done ? 'text-positive' : 'text-accent'}`}>
            {pct}%
          </Text>
        </View>
        <View
          className="h-2.5 overflow-hidden rounded-full bg-fill"
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: pct }}
        >
          <View
            className={`h-full rounded-full ${done ? 'bg-positive' : 'bg-accent'}`}
            style={{ width: `${pct}%` }}
          />
        </View>
        <Text className="text-[13px] text-secondary" style={tabular}>
          {formatMoney(saved)} de {formatMoney(target)}
        </Text>
        {item.perMonthMinor !== null ? (
          <Text className="text-[13px] font-medium text-accent" style={tabular}>
            Ahorra {formatMoney(item.perMonthMinor)} al mes para llegar en{' '}
            {monthLabel(item.deadline)}
          </Text>
        ) : item.late ? (
          <Text className="text-[13px] font-medium text-negative">
            Se pasó la fecha: {monthLabel(item.deadline)}
          </Text>
        ) : null}
      </Pressable>
    </Link>
  );
}
