import { contributeToGoalSchema, formatMoney } from '@finanzas/shared';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AmountInput } from '@/components/ui/amount-input';
import { Button, Form, FormError } from '@/components/ui/form';
import { Text } from '@/components/ui/text';
import { useContribute, useGoals } from '../api';

type Props = { goalId: string; onSaved: () => void };

export function ContributionForm({ goalId, onSaved }: Props) {
  const goals = useGoals();
  const contribute = useContribute(goalId);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (goals.isLoading) return <Text className="p-4 text-secondary">Cargando…</Text>;
  if (goals.error) return <Text className="p-4">{goals.error.message}</Text>;
  const goal = goals.data?.find((g) => g.id === goalId);
  if (!goal) return <Text className="p-4">No encontramos esta meta.</Text>;

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
    <Form>
      <View className="gap-1 rounded-2xl bg-card px-4 py-3">
        <Text className="text-[20px] font-semibold">{goal.name}</Text>
        <Text className="text-[15px] text-secondary">
          Llevas {formatMoney(saved)}.{' '}
          {missing > 0n ? `Te faltan ${formatMoney(missing)}.` : '¡Ya cumpliste la meta!'}
        </Text>
      </View>

      <AmountInput
        label="¿Cuánto vas a aportar? (COP)"
        value={amount}
        onChangeValue={setAmount}
        autoFocus
      />

      <FormError message={error ?? contribute.error?.message} />
      <Button
        label={contribute.isPending ? 'Guardando…' : 'Aportar'}
        onPress={submit}
        disabled={contribute.isPending}
      />

      <Link href={{ pathname: '/goals/[id]/edit', params: { id: goalId } }} asChild>
        <Pressable className="min-h-[44px] items-center justify-center" accessibilityRole="button">
          <Text className="text-[17px] text-accent">Editar o borrar meta</Text>
        </Pressable>
      </Link>
    </Form>
  );
}
