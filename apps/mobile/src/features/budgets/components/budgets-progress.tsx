import { formatMoney } from '@finanzas/shared';
import { View } from 'react-native';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { CategoryIcon } from '@/features/transactions/components/category-icon';
import { type Budget, useBudgets } from '../api';

/** Gastado contra el tope de cada categoría este mes. Va arriba en la pantalla de topes. */
export function BudgetsProgress() {
  const { data, isLoading, error } = useBudgets();
  if (isLoading) return <Text className="text-secondary">Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;
  const budgets = data ?? [];

  if (!budgets.length) return null;

  return (
    <Card title="Este mes">
      {budgets.map((b) => (
        <BudgetRow key={b.categoryId} budget={b} />
      ))}
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
    <View className="flex-row items-center gap-3 py-2">
      <CategoryIcon name={budget.name} />
      <View className="flex-1 gap-1.5">
        <View className="flex-row justify-between gap-2">
          <Text className="flex-1 text-[15px] font-medium" numberOfLines={1}>
            {budget.name}
          </Text>
          <Text className="text-[15px] text-secondary">
            {formatMoney(spent)} de {formatMoney(limit)}
          </Text>
        </View>
        <View
          className="h-2 overflow-hidden rounded-full bg-fill"
          accessibilityRole="progressbar"
          accessibilityLabel={`${budget.name}: ${status}`}
          accessibilityValue={{ min: 0, max: 100, now: Math.min(pct, 100) }}
        >
          <View
            className={`h-2 rounded-full ${tone.bar}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </View>
        <Text className={`text-[13px] font-medium ${tone.text}`}>{status}</Text>
      </View>
    </View>
  );
}
