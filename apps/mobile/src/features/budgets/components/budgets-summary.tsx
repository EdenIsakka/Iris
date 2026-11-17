import { formatMoney } from '@finanzas/shared';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { type Budget, useBudgets } from '../api';

/** Gastado contra el tope de cada categoría este mes. Va en Resumen. */
export function BudgetsSummary() {
  const { data, isLoading, error } = useBudgets();
  if (isLoading) return <Text>Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;
  const budgets = data ?? [];

  return (
    <View style={styles.block}>
      <Text style={styles.caption} accessibilityRole="header">
        Topes del mes
      </Text>
      {budgets.length ? (
        budgets.map((b) => <BudgetRow key={b.categoryId} budget={b} />)
      ) : (
        <Text>Aún no tienes topes de gasto.</Text>
      )}
      <Link href="/budgets" asChild>
        <Pressable style={styles.link} accessibilityRole="button">
          <Text style={styles.linkText}>Editar topes</Text>
        </Pressable>
      </Link>
    </View>
  );
}

function BudgetRow({ budget }: { budget: Budget }) {
  const spent = BigInt(budget.spentMinor);
  const limit = BigInt(budget.limitMinor);
  const pct = Number((spent * 100n) / limit);
  const color = pct > 100 ? '#b00020' : pct >= 80 ? '#b26a00' : '#1b5e20';
  // El texto dice el estado; el color solo lo refuerza.
  const status =
    spent > limit
      ? `Te pasaste por ${formatMoney(spent - limit)}`
      : `Quedan ${formatMoney(limit - spent)}`;

  return (
    <View style={styles.row}>
      <View style={styles.line}>
        <Text style={styles.name}>{budget.name}</Text>
        <Text>
          {formatMoney(spent)} de {formatMoney(limit)}
        </Text>
      </View>
      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityLabel={`${budget.name}: ${status}`}
        accessibilityValue={{ min: 0, max: 100, now: Math.min(pct, 100) }}
      >
        <View style={[styles.fill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.status, { color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 8 },
  caption: { color: '#555', fontWeight: '600' },
  row: { gap: 4 },
  line: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontWeight: '600' },
  track: { height: 8, borderRadius: 4, backgroundColor: '#e0e0e0', overflow: 'hidden' },
  fill: { height: 8 },
  status: { fontSize: 13, fontWeight: '600' },
  link: { minHeight: 44, justifyContent: 'center' },
  linkText: { color: '#1b5e20', fontWeight: '600' },
});
