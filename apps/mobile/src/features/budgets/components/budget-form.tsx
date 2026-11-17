import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { AmountInput } from '@/components/ui/amount-input';
import { useCategories } from '@/features/transactions/api';
import { useBudgets, useDeleteBudget, useSaveBudget } from '../api';

type Props = { categoryId: string; onDone: () => void };

export function BudgetForm({ categoryId, onDone }: Props) {
  const categories = useCategories();
  const budgets = useBudgets();

  if (categories.isLoading || budgets.isLoading) return <Text style={styles.pad}>Cargando…</Text>;
  const category = categories.data?.find((c) => c.id === categoryId);
  if (!category) return <Text style={styles.pad}>No encontramos esta categoría.</Text>;
  const current = budgets.data?.find((b) => b.categoryId === categoryId)?.limitMinor;

  // key: el estado del monto arranca con el tope ya cargado.
  return (
    <Form key={current ?? 'sin-tope'} {...{ categoryId, onDone, current }} name={category.name} />
  );
}

function Form({
  categoryId,
  onDone,
  current,
  name,
}: Props & { current: string | undefined; name: string }) {
  const save = useSaveBudget(categoryId);
  const remove = useDeleteBudget(categoryId);
  const [limit, setLimit] = useState(current ?? '');
  const [error, setError] = useState<string | null>(null);
  const busy = save.isPending || remove.isPending;

  function submit() {
    if (!limit) return setError('Escribe cuánto quieres gastar como máximo.');
    setError(null);
    save.mutate(limit, { onSuccess: onDone });
  }

  const message = error ?? save.error?.message ?? remove.error?.message;
  return (
    <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
      <Text style={styles.title} accessibilityRole="header">
        {name}
      </Text>
      <AmountInput
        label="Máximo a gastar al mes (COP)"
        value={limit}
        onChangeValue={setLimit}
        autoFocus
      />
      <Text style={styles.hint}>Vale desde este mes hasta que lo cambies.</Text>

      {message ? (
        <Text style={styles.error} accessibilityRole="alert">
          {message}
        </Text>
      ) : null}

      <Pressable
        style={[styles.button, busy && styles.disabled]}
        onPress={submit}
        disabled={busy}
        accessibilityRole="button"
        accessibilityState={{ disabled: busy }}
      >
        <Text style={styles.buttonText}>{save.isPending ? 'Guardando…' : 'Guardar tope'}</Text>
      </Pressable>
      {current ? (
        <Pressable
          style={[styles.remove, busy && styles.disabled]}
          onPress={() => remove.mutate(undefined, { onSuccess: onDone })}
          disabled={busy}
          accessibilityRole="button"
          accessibilityState={{ disabled: busy }}
        >
          <Text style={styles.removeText}>{remove.isPending ? 'Quitando…' : 'Quitar tope'}</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16 },
  form: { padding: 16, gap: 8 },
  title: { fontSize: 18, fontWeight: '700' },
  hint: { color: '#555' },
  error: { color: '#b00020' },
  button: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#1b5e20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  remove: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b00020',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: '#b00020', fontWeight: '700', fontSize: 16 },
});
