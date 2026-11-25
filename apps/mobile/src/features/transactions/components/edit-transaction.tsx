import { Alert } from 'react-native';
import { Button } from '@/components/ui/form';
import { Text } from '@/components/ui/text';
import { showUndo } from '@/lib/undo';
import {
  removeTransaction,
  restoreTransaction,
  useCreateTransaction,
  useDeleteTransaction,
  useTransaction,
} from '../api';
import { TransactionForm } from './transaction-form';

type Props = { id: string; onDone: () => void };

export function EditTransaction({ id, onDone }: Props) {
  const { data: transaction, isLoading, error } = useTransaction(id);
  const remove = useDeleteTransaction();
  const create = useCreateTransaction();

  if (isLoading) return <Text className="p-4 text-secondary">Cargando…</Text>;
  if (error) return <Text className="p-4">{error.message}</Text>;
  if (!transaction) return <Text className="p-4">No encontramos este movimiento.</Text>;

  // Sin "¿Seguro?": se borra de una y la barra de abajo deja deshacerlo unos segundos.
  function deleteNow() {
    if (!transaction) return;
    const deleted = transaction;
    remove.mutate(id, {
      onSuccess: () => {
        showUndo('Movimiento borrado', () => restoreTransaction(deleted));
        onDone();
      },
      onError: (e) => Alert.alert('No se pudo borrar', e.message),
    });
  }

  // Lo mismo de nuevo con fecha de ahora: el almuerzo, el bus, el café de todos los días.
  function repeatNow() {
    if (!transaction) return;
    create.mutate(
      {
        walletId: transaction.walletId,
        categoryId: transaction.categoryId,
        kind: transaction.kind,
        amountMinor: transaction.amountMinor.toString(),
        occurredAt: new Date().toISOString(),
        note: transaction.note ?? undefined,
      },
      {
        onSuccess: (row) => {
          showUndo('Movimiento repetido hoy', () => removeTransaction(row.id));
          onDone();
        },
        onError: (e) => Alert.alert('No se pudo repetir', e.message),
      },
    );
  }

  const busy = remove.isPending || create.isPending;
  return (
    <TransactionForm
      transaction={transaction}
      onSaved={onDone}
      footer={
        <>
          <Button secondary label="Repetir hoy" onPress={repeatNow} disabled={busy} />
          <Button
            destructive
            label={remove.isPending ? 'Borrando…' : 'Borrar movimiento'}
            onPress={deleteNow}
            disabled={busy}
          />
        </>
      }
    />
  );
}
