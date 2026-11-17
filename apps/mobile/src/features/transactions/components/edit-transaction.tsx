import { Alert } from 'react-native';
import { Button } from '@/components/ui/form';
import { Text } from '@/components/ui/text';
import { useDeleteTransaction, useTransaction } from '../api';
import { TransactionForm } from './transaction-form';

type Props = { id: string; onDone: () => void };

export function EditTransaction({ id, onDone }: Props) {
  const { data: transaction, isLoading, error } = useTransaction(id);
  const remove = useDeleteTransaction();

  if (isLoading) return <Text className="p-4 text-secondary">Cargando…</Text>;
  if (error) return <Text className="p-4">{error.message}</Text>;
  if (!transaction) return <Text className="p-4">No encontramos este movimiento.</Text>;

  function confirmDelete() {
    Alert.alert('¿Borrar este movimiento?', 'No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: () =>
          remove.mutate(id, {
            onSuccess: onDone,
            onError: (e) => Alert.alert('No se pudo borrar', e.message),
          }),
      },
    ]);
  }

  return (
    <TransactionForm
      transaction={transaction}
      onSaved={onDone}
      footer={
        <Button
          destructive
          label={remove.isPending ? 'Borrando…' : 'Borrar movimiento'}
          onPress={confirmDelete}
          disabled={remove.isPending}
        />
      }
    />
  );
}
