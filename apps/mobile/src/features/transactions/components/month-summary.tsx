import { formatMoney } from '@finanzas/shared';
import { View } from 'react-native';
import { Card, Row } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useMonthSummary } from '../api';

export function MonthSummary() {
  const { data, isLoading, error } = useMonthSummary();

  if (isLoading) return <Text className="text-secondary">Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;
  if (!data) return null;

  const income = data.incomeMinor;
  const expense = data.expenseMinor;
  const balance = income - expense;

  // Lista simple (no FlatList): son pocas categorías y Resumen ya hace scroll.
  return (
    <>
      <Card title="Este mes">
        <View className="flex-row gap-4 py-1">
          <Figure label="Ingresos" value={formatMoney(income)} className="text-positive" />
          <Figure label="Gastos" value={formatMoney(expense)} className="text-negative" />
        </View>
        <View className="border-t border-separator pt-1">
          <Row label="Balance" value={formatMoney(balance)} strong />
        </View>
      </Card>
      <Card title="Gastos por categoría">
        {data.byCategory.length ? (
          data.byCategory.map((c) => (
            <Row
              key={c.id ?? 'sin-categoria'}
              label={c.name ?? 'Sin categoría'}
              value={formatMoney(c.amountMinor)}
            />
          ))
        ) : (
          <Text className="py-1 text-secondary">Todavía no tienes gastos este mes.</Text>
        )}
      </Card>
    </>
  );
}

function Figure({ label, value, className }: { label: string; value: string; className: string }) {
  return (
    <View className="flex-1">
      <Text className="text-[13px] text-secondary">{label}</Text>
      <Text className={`text-[22px] font-semibold ${className}`}>{value}</Text>
    </View>
  );
}
