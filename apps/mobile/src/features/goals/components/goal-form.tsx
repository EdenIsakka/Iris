import { createGoalSchema } from '@finanzas/shared';
import DateTimePicker from '@react-native-community/datetimepicker';
import { type ReactNode, useState } from 'react';
import { View } from 'react-native';
import { AmountInput } from '@/components/ui/amount-input';
import { Chip } from '@/components/ui/chip';
import { Button, FieldLabel, Form, FormError, inputClassName } from '@/components/ui/form';
import { TextInput } from '@/components/ui/text';
import { formatDate, isoDate } from '@/lib/format-date';
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
  const [target, setTarget] = useState(goal?.targetMinor.toString() ?? '');
  const [deadline, setDeadline] = useState(() =>
    goal?.deadline ? new Date(`${goal.deadline}T12:00:00`) : null,
  );
  const [pickingDate, setPickingDate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const parsed = createGoalSchema.safeParse({
      name,
      targetMinor: target,
      deadline: deadline ? isoDate(deadline) : undefined,
    });
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

      <FieldLabel>¿Para cuándo? (opcional)</FieldLabel>
      <View className="flex-row flex-wrap gap-2">
        <Chip
          label={deadline ? formatDate(deadline) : 'Elegir fecha'}
          selected={!!deadline}
          onPress={() => setPickingDate(true)}
        />
        {deadline ? (
          <Chip label="Sin fecha" selected={false} onPress={() => setDeadline(null)} />
        ) : null}
      </View>
      {pickingDate ? (
        <DateTimePicker
          value={deadline ?? new Date()}
          mode="date"
          minimumDate={new Date()}
          onChange={(event, picked) => {
            setPickingDate(false);
            if (event.type === 'set' && picked) setDeadline(picked);
          }}
        />
      ) : null}

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
