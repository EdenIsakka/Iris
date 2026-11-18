import { createGoalSchema } from '@finanzas/shared';
import { type ReactNode, useState } from 'react';
import { AmountInput } from '@/components/ui/amount-input';
import { Button, FieldLabel, Form, FormError, inputClassName } from '@/components/ui/form';
import { TextInput } from '@/components/ui/text';
import { type Goal, useCreateGoal, useUpdateGoal } from '../api';

type Props = {
  onSaved: () => void;
  /** Si viene, el formulario edita esta meta en vez de crear una nueva. */
  goal?: Goal;
  footer?: ReactNode;
};

export function GoalForm({ onSaved, goal, footer }: Props) {
  const create = useCreateGoal();
  const update = useUpdateGoal(goal?.id ?? '');
  const save = goal ? update : create;
  const [name, setName] = useState(goal?.name ?? '');
  const [target, setTarget] = useState(goal?.targetMinor ?? '');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const parsed = createGoalSchema.safeParse({ name, targetMinor: target });
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0];
      setError(field === 'name' ? 'Escribe un nombre.' : 'Escribe una meta mayor que 0.');
      return;
    }
    setError(null);
    save.mutate(parsed.data, { onSuccess: onSaved });
  }

  return (
    <Form>
      <FieldLabel nativeID="goal-name-label">Nombre</FieldLabel>
      <TextInput
        className={`${inputClassName} text-[17px]`}
        value={name}
        onChangeText={setName}
        placeholder="Ej. Viaje, fondo de emergencia"
        maxLength={80}
        accessibilityLabelledBy="goal-name-label"
        autoFocus={!goal}
      />

      <AmountInput
        label="¿Cuánto quieres ahorrar? (COP)"
        value={target}
        onChangeValue={setTarget}
      />

      <FormError message={error ?? save.error?.message} />
      <Button
        label={save.isPending ? 'Guardando…' : goal ? 'Guardar' : 'Crear meta'}
        onPress={submit}
        disabled={save.isPending}
      />
      {footer}
    </Form>
  );
}
