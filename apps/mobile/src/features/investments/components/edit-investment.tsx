import { Alert } from 'react-native';
import { Button } from '@/components/ui/form';
import { Text } from '@/components/ui/text';
import { useDeleteInvestment, useInvestments } from '../api';
import { InvestmentForm } from './investment-form';

type Props = { id: string; onSaved: () => void; onDeleted: () => void };

export function EditInvestment({ id, onSaved, onDeleted }: Props) {
  const { data, isLoading, error } = useInvestments('month');
  const remove = useDeleteInvestment();

  if (isLoading) return <Text className="p-4 text-secondary">Cargando…</Text>;
  if (error) return <Text className="p-4">{error.message}</Text>;
  const investment = data?.items.find((i) => i.id === id);
  if (!investment) return <Text className="p-4">No encontramos esta inversión.</Text>;

  function confirmDelete() {
    Alert.alert(
      '¿Borrar esta inversión?',
      'También se borra todo su historial. No se puede deshacer.',
      [
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
      ],
    );
  }

  return (
    <InvestmentForm
      investment={investment}
      onSaved={onSaved}
      footer={
        <Button
          destructive
          label={remove.isPending ? 'Borrando…' : 'Borrar inversión'}
          onPress={confirmDelete}
          disabled={remove.isPending}
        />
      }
    />
  );
}
