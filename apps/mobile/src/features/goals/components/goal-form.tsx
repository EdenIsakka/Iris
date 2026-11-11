import { createGoalSchema, formatMoney } from '@finanzas/shared';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useCreateGoal } from '../api';

type Props = { onSaved: () => void };

export function GoalForm({ onSaved }: Props) {
  const createGoal = useCreateGoal();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const parsed = createGoalSchema.safeParse({ name, targetMinor: target });
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0];
      setError(field === 'name' ? 'Escribe un nombre.' : 'Escribe una meta mayor que 0.');
      return;
    }
    setError(null);
    createGoal.mutate(parsed.data, { onSuccess: onSaved });
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
        autoFocus
      />

      <Text style={styles.label} nativeID="goal-target-label">
        ¿Cuánto quieres ahorrar? (COP)
      </Text>
      <TextInput
        style={styles.input}
        value={target}
        onChangeText={(t) => setTarget(t.replace(/\D/g, '').replace(/^0+/, ''))}
        keyboardType="number-pad"
        maxLength={18}
        placeholder="0"
        accessibilityLabel="Monto de la meta en COP"
        accessibilityLabelledBy="goal-target-label"
      />
      {target ? <Text style={styles.hint}>{formatMoney(BigInt(target))}</Text> : null}

      {error || createGoal.error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error ?? createGoal.error?.message}
        </Text>
      ) : null}

      <Pressable
        style={[styles.button, createGoal.isPending && styles.buttonDisabled]}
        onPress={submit}
        disabled={createGoal.isPending}
        accessibilityRole="button"
        accessibilityState={{ disabled: createGoal.isPending }}
      >
        <Text style={styles.buttonText}>{createGoal.isPending ? 'Guardando…' : 'Crear meta'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { padding: 16, gap: 8 },
  label: { fontWeight: '600', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#999', borderRadius: 8, padding: 12, fontSize: 18 },
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
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
