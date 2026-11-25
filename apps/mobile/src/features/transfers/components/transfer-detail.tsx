import { formatMoney } from '@finanzas/shared';
import { Alert } from 'react-native';
import { Button, Form } from '@/components/ui/form';
import { Text } from '@/components/ui/text';
import { useWallets } from '@/features/wallets/api';
import { formatDate } from '@/lib/format-date';
import { showUndo } from '@/lib/undo';
import { restoreTransfer, useDeleteTransfer, useTransfer } from '../api';

type Props = { id: string; onDone: () => void };

/**
 * Ver o borrar una transferencia.
 * shortcut: no se edita; para corregirla se borra y se hace otra. Agregar edición si molesta.
 */
export function TransferDetail({ id, onDone }: Props) {
  const { data: transfer, isLoading, error } = useTransfer(id);
  const wallets = useWallets().data ?? [];
  const remove = useDeleteTransfer();

  if (isLoading) return <Text className="p-4 text-secondary">Cargando…</Text>;
  if (error) return <Text className="p-4">{error.message}</Text>;
  if (!transfer) return <Text className="p-4">No encontramos esta transferencia.</Text>;

  const from = wallets.find((w) => w.id === transfer.fromWalletId);
  const to = wallets.find((w) => w.id === transfer.toWalletId);
  const crossCurrency = from && to && from.currency !== to.currency;

  // Como los movimientos: se borra de una y la barra de abajo deja deshacerlo.
  function deleteNow() {
    if (!transfer) return;
    const deleted = transfer;
    remove.mutate(id, {
      onSuccess: () => {
        showUndo('Transferencia borrada', () => restoreTransfer(deleted));
        onDone();
      },
      onError: (e) => Alert.alert('No se pudo borrar', e.message),
    });
  }

  return (
    <Form>
      <Text className="text-center text-[34px] font-bold" style={{ fontVariant: ['tabular-nums'] }}>
        {formatMoney(transfer.amountMinor, from?.currency)}
      </Text>
      <Text className="text-center text-[17px]">
        {from?.name ?? '?'} → {to?.name ?? '?'}
      </Text>
      {crossCurrency ? (
        <Text className="text-center text-[15px] text-secondary">
          Llegaron {formatMoney(transfer.toAmountMinor, to?.currency)}
        </Text>
      ) : null}
      <Text className="text-center text-[15px] text-secondary">
        {formatDate(transfer.occurredAt)}
        {transfer.note ? ` · ${transfer.note}` : ''}
      </Text>
      <Button
        destructive
        label={remove.isPending ? 'Borrando…' : 'Borrar transferencia'}
        onPress={deleteNow}
        disabled={remove.isPending}
      />
    </Form>
  );
}
