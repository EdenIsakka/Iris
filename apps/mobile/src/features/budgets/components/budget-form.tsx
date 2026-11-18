import { useState } from 'react';
import { AmountInput } from '@/components/ui/amount-input';
import { Button, Form, FormError } from '@/components/ui/form';
import { Text } from '@/components/ui/text';
import { useCategories } from '@/features/transactions/api';
import { useBudgets, useDeleteBudget, useSaveBudget } from '../api';

type Props = { categoryId: string; onDone: () => void };

export function BudgetForm({ categoryId, onDone }: Props) {
  const categories = useCategories();
  const budgets = useBudgets();

  if (categories.isLoading || budgets.isLoading) {
    return <Text className="p-4 text-secondary">Cargando…</Text>;
  }
  const category = categories.data?.find((c) => c.id === categoryId);
  if (!category) return <Text className="p-4">No encontramos esta categoría.</Text>;
  const current = budgets.data?.find((b) => b.categoryId === categoryId)?.limitMinor;

  // key: el estado del monto arranca con el tope ya cargado.
  return (
    <LimitForm
      key={current ?? 'sin-tope'}
      {...{ categoryId, onDone, current }}
      name={category.name}
    />
  );
}

function LimitForm({
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

  return (
    <Form>
      <Text className="px-1 pb-2 text-[28px] font-bold tracking-tight" accessibilityRole="header">
        {name}
      </Text>
      <AmountInput
        label="Máximo a gastar al mes (COP)"
        value={limit}
        onChangeValue={setLimit}
        autoFocus
      />
      <Text className="text-[13px] text-secondary">Vale desde este mes hasta que lo cambies.</Text>

      <FormError message={error ?? save.error?.message ?? remove.error?.message} />
      <Button
        label={save.isPending ? 'Guardando…' : 'Guardar tope'}
        onPress={submit}
        disabled={busy}
      />
      {current ? (
        <Button
          destructive
          label={remove.isPending ? 'Quitando…' : 'Quitar tope'}
          onPress={() => remove.mutate(undefined, { onSuccess: onDone })}
          disabled={busy}
        />
      ) : null}
    </Form>
  );
}
