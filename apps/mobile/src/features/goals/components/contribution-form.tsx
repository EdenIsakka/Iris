import { contributeToGoalSchema, formatMoney } from '@finanzas/shared';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useContribute, useGoals } from '../api';

type Props = { goalId: string; onSaved: () => void };

export function ContributionForm({ goalId, onSaved }: Props) {
  const goals = useGoals();
  const contribute = useContribute(goalId);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (goals.isLoading) return <Text style={styles.pad}>Cargando…</Text>;
  if (goals.error) return <Text style={styles.pad}>{goals.error.message}</Text>;
  const goal = goals.data?.find((g) => g.id === goalId);
  if (!goal) return <Text style={styles.pad}>No encontramos esta meta.</Text>;

  const saved = BigInt(goal.savedMinor);
  const missing = BigInt(goal.targetMinor) - saved;

  function submit() {
    if (!contributeToGoalSchema.safeParse({ amountMinor: amount }).success) {
      setError('Escribe un monto mayor que 0.');
      return;
    }
    setError(null);
    contribute.mutate(amount, { onSuccess: onSaved });
  }

  return (
    <View style={styles.form}>
      <Text style={styles.title}>{goal.name}</Text>
      <Text>
        Llevas {formatMoney(saved)}.{' '}
        {missing > 0n ? `Te faltan ${formatMoney(missing)}.` : '¡Ya cumpliste la meta!'}
      </Text>

      <Text style={styles.label} nativeID="contribution-label">
        ¿Cuánto vas a aportar? (COP)
      </Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={(t) => setAmount(t.replace(/\D/g, '').replace(/^0+/, ''))}
        keyboardType="number-pad"
        maxLength={18}
        placeholder="0"
        accessibilityLabel="Monto del aporte en COP"
        accessibilityLabelledBy="contribution-label"
        autoFocus
      />
      {amount ? <Text style={styles.hint}>{formatMoney(BigInt(amount))}</Text> : null}

      {error || contribute.error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error ?? contribute.error?.message}
        </Text>
      ) : null}

      <Pressable
        style={[styles.button, contribute.isPending && styles.buttonDisabled]}
        onPress={submit}
        disabled={contribute.isPending}
        accessibilityRole="button"
        accessibilityState={{ disabled: contribute.isPending }}
      >
        <Text style={styles.buttonText}>{contribute.isPending ? 'Guardando…' : 'Aportar'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16 },
  form: { padding: 16, gap: 8 },
  title: { fontSize: 20, fontWeight: '700' },
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
