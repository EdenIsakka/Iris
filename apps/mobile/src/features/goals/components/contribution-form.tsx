import { contributeToGoalSchema, formatMoney } from '@finanzas/shared';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AmountInput } from '@/components/ui/amount-input';
import { Text } from '@/components/ui/text';
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

      <AmountInput
        label="¿Cuánto vas a aportar? (COP)"
        value={amount}
        onChangeValue={setAmount}
        autoFocus
      />

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

      <Link href={{ pathname: '/goals/[id]/edit', params: { id: goalId } }} asChild>
        <Pressable style={styles.link} accessibilityRole="button">
          <Text style={styles.linkText}>Editar o borrar meta</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16 },
  form: { padding: 16, gap: 8 },
  title: { fontSize: 20, fontWeight: '700' },
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
  link: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  linkText: { color: '#1b5e20', fontWeight: '600' },
});
