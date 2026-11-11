import { formatMoney } from '@finanzas/shared';
import { Link } from 'expo-router';
import { FlatList, Pressable, Text } from 'react-native';
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
          <Link href={{ pathname: '/goals/[id]/contribute', params: { id: item.id } }} asChild>
            <Pressable
              style={{ paddingVertical: 12, gap: 4, minHeight: 44 }}
              accessibilityRole="button"
              accessibilityHint="Abre el formulario para aportar a esta meta"
            >
              <Text style={{ fontWeight: '600' }}>{item.name}</Text>
              <Text>
                {formatMoney(saved)} de {formatMoney(target)} ({pct}%)
              </Text>
              <Text style={{ color: '#1b5e20', fontWeight: '600' }}>
                {item.status === 'completed' ? '✓ Meta cumplida · + Aportar' : '+ Aportar'}
              </Text>
            </Pressable>
          </Link>
        );
      }}
    />
  );
}
