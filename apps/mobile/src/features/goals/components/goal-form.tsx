import { createGoalSchema } from '@finanzas/shared';
import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AmountInput } from '@/components/ui/amount-input';
import { Text, TextInput } from '@/components/ui/text';
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
    <View style={styles.form}>
      <Text style={styles.label} nativeID="goal-name-label">
        Nombre
      </Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Ej. Viaje, fondo de emergencia"
        maxLength={80}
        accessibilityLabel="Nombre de la meta"
        accessibilityLabelledBy="goal-name-label"
        autoFocus={!goal}
      />

      <AmountInput
        label="¿Cuánto quieres ahorrar? (COP)"
        value={target}
        onChangeValue={setTarget}
      />

      {error || save.error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error ?? save.error?.message}
        </Text>
      ) : null}

      <Pressable
        style={[styles.button, save.isPending && styles.buttonDisabled]}
        onPress={submit}
        disabled={save.isPending}
        accessibilityRole="button"
        accessibilityState={{ disabled: save.isPending }}
      >
        <Text style={styles.buttonText}>
          {save.isPending ? 'Guardando…' : goal ? 'Guardar' : 'Crear meta'}
        </Text>
      </Pressable>
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { padding: 16, gap: 8 },
  label: { fontWeight: '600', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#999', borderRadius: 8, padding: 12, fontSize: 18 },
  error: { color: '#b00020' },
  button: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#1b5e20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
