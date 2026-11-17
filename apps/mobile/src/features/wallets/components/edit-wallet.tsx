import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { useDeleteWallet, useWallets } from '../api';
import { WalletForm } from './wallet-form';

type Props = { id: string; onDone: () => void };

export function EditWallet({ id, onDone }: Props) {
  const { data, isLoading, error } = useWallets();
  const remove = useDeleteWallet();

  if (isLoading) return <Text style={styles.pad}>Cargando…</Text>;
  if (error) return <Text style={styles.pad}>{error.message}</Text>;
  const wallet = data?.find((w) => w.id === id);
  if (!wallet) return <Text style={styles.pad}>No encontramos esta billetera.</Text>;

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
        <Pressable
          style={styles.delete}
          onPress={confirmDelete}
          disabled={remove.isPending}
          accessibilityRole="button"
          accessibilityState={{ disabled: remove.isPending }}
        >
          <Text style={styles.deleteText}>
            {remove.isPending ? 'Borrando…' : 'Borrar billetera'}
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
