import { Alert } from 'react-native';
import { Button } from '@/components/ui/form';
import { Text } from '@/components/ui/text';
import { useDeleteWallet, useWallets } from '../api';
import { WalletForm } from './wallet-form';

type Props = { id: string; onDone: () => void };

export function EditWallet({ id, onDone }: Props) {
  const { data, isLoading, error } = useWallets();
  const remove = useDeleteWallet();

  if (isLoading) return <Text className="p-4 text-secondary">Cargando…</Text>;
  if (error) return <Text className="p-4">{error.message}</Text>;
  const wallet = data?.find((w) => w.id === id);
  if (!wallet) return <Text className="p-4">No encontramos esta billetera.</Text>;

  function confirmDelete() {
    Alert.alert('¿Borrar esta billetera?', 'No se puede deshacer.', [
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
    <WalletForm
      wallet={wallet}
      onSaved={onDone}
      footer={
        <Button
          destructive
          label={remove.isPending ? 'Borrando…' : 'Borrar billetera'}
          onPress={confirmDelete}
          disabled={remove.isPending}
        />
      }
    />
  );
}
