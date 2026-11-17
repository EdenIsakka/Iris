import { Alert, Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { useDeleteInvestment, useInvestments } from '../api';
import { InvestmentForm } from './investment-form';

type Props = { id: string; onSaved: () => void; onDeleted: () => void };

export function EditInvestment({ id, onSaved, onDeleted }: Props) {
  const { data, isLoading, error } = useInvestments('month');
  const remove = useDeleteInvestment();

  if (isLoading) return <Text style={styles.pad}>Cargando…</Text>;
  if (error) return <Text style={styles.pad}>{error.message}</Text>;
  const investment = data?.items.find((i) => i.id === id);
  if (!investment) return <Text style={styles.pad}>No encontramos esta inversión.</Text>;

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
        <Pressable
          style={styles.delete}
          onPress={confirmDelete}
          disabled={remove.isPending}
          accessibilityRole="button"
          accessibilityState={{ disabled: remove.isPending }}
        >
          <Text style={styles.deleteText}>
            {remove.isPending ? 'Borrando…' : 'Borrar inversión'}
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
