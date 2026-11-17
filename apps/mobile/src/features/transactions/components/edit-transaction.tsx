import { Alert, Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { useDeleteTransaction, useTransaction } from '../api';
import { TransactionForm } from './transaction-form';

type Props = { id: string; onDone: () => void };

export function EditTransaction({ id, onDone }: Props) {
  const { data: transaction, isLoading, error } = useTransaction(id);
  const remove = useDeleteTransaction();

  if (isLoading) return <Text style={styles.pad}>Cargando…</Text>;
  if (error) return <Text style={styles.pad}>{error.message}</Text>;
  if (!transaction) return <Text style={styles.pad}>No encontramos este movimiento.</Text>;

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
        <Pressable
          style={styles.delete}
          onPress={confirmDelete}
          disabled={remove.isPending}
          accessibilityRole="button"
          accessibilityState={{ disabled: remove.isPending }}
        >
          <Text style={styles.deleteText}>
            {remove.isPending ? 'Borrando…' : 'Borrar movimiento'}
          </Text>
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16 },
  delete: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b00020',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { color: '#b00020', fontWeight: '700', fontSize: 16 },
});
