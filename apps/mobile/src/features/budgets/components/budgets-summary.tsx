import { formatMoney } from '@finanzas/shared';
import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Card, CardAction } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { type Budget, useBudgets } from '../api';

/** Gastado contra el tope de cada categoría este mes. Va en Resumen. */
export function BudgetsSummary() {
  const { data, isLoading, error } = useBudgets();
  if (isLoading) return <Text className="text-secondary">Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;
  const budgets = data ?? [];

  return (
    <Card title="Topes del mes">
      {budgets.length ? (
        budgets.map((b) => <BudgetRow key={b.categoryId} budget={b} />)
      ) : (
        <Text className="py-1 text-secondary">Aún no tienes topes de gasto.</Text>
      )}
      <Link href="/budgets" asChild>
        <Pressable
          className="min-h-[44px] justify-center border-t border-separator"
          accessibilityRole="button"
        >
          <CardAction label="Editar topes" />
        </Pressable>
      </Link>
    </Card>
  );
}

// Clases completas: Tailwind no ve las que se arman por partes (`bg-${x}`).
const TONES = {
  ok: { bar: 'bg-positive', text: 'text-positive' },
  near: { bar: 'bg-warning', text: 'text-warning' },
  over: { bar: 'bg-negative', text: 'text-negative' },
};

function BudgetRow({ budget }: { budget: Budget }) {
  const spent = budget.spentMinor;
  const limit = budget.limitMinor;
  const pct = Number((spent * 100n) / limit);
  const tone = TONES[pct > 100 ? 'over' : pct >= 80 ? 'near' : 'ok'];
  // El texto dice el estado; el color solo lo refuerza.
  const status =
    spent > limit
      ? `Te pasaste por ${formatMoney(spent - limit)}`
      : `Quedan ${formatMoney(limit - spent)}`;

  return (
    <View className="gap-1.5 py-2">
      <View className="flex-row justify-between">
        <Text className="text-[15px] font-medium">{budget.name}</Text>
        <Text className="text-[15px] text-secondary">
          {formatMoney(spent)} de {formatMoney(limit)}
        </Text>
      </View>
      <View
        className="h-1.5 overflow-hidden rounded-full bg-fill"
        accessibilityRole="progressbar"
        accessibilityLabel={`${budget.name}: ${status}`}
        accessibilityValue={{ min: 0, max: 100, now: Math.min(pct, 100) }}
      >
        <View className={`h-1.5 ${tone.bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </View>
      <Text className={`text-[13px] font-medium ${tone.text}`}>{status}</Text>
    </View>
  );
}
