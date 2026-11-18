import { Alert } from 'react-native';
import { Button } from '@/components/ui/form';
import { Text } from '@/components/ui/text';
import { useDeleteGoal, useGoals } from '../api';
import { GoalForm } from './goal-form';

type Props = { id: string; onSaved: () => void; onDeleted: () => void };

export function EditGoal({ id, onSaved, onDeleted }: Props) {
  const { data, isLoading, error } = useGoals();
  const remove = useDeleteGoal();

  if (isLoading) return <Text className="p-4 text-secondary">Cargando…</Text>;
  if (error) return <Text className="p-4">{error.message}</Text>;
  const goal = data?.find((g) => g.id === id);
  if (!goal) return <Text className="p-4">No encontramos esta meta.</Text>;

  function confirmDelete() {
    Alert.alert('¿Borrar esta meta?', 'También se borran sus aportes. No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: () =>
          remove.mutate(id, {
            onSuccess: onDeleted,
            onError: (e) => Alert.alert('No se pudo borrar', e.message),
          }),
      },
    ]);
  }

  return (
    <GoalForm
      goal={goal}
      onSaved={onSaved}
      footer={
        <Button
          destructive
          label={remove.isPending ? 'Borrando…' : 'Borrar meta'}
          onPress={confirmDelete}
          disabled={remove.isPending}
        />
      }
    />
  );
}
