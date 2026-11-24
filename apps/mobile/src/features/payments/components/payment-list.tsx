import { Link } from 'expo-router';
import { FlatList, Linking, Pressable, View } from 'react-native';
import { LinkButton } from '@/components/ui/link-button';
import { Text } from '@/components/ui/text';
import { useCanRemind, usePayments } from '../api';
import { PaymentRow } from './payment-row';

/** Todos los pagos por fecha; tocar uno lo abre. */
export function PaymentList() {
  const { data, isLoading, error } = usePayments();
  const canRemind = useCanRemind();
  if (isLoading) return <Text className="p-4 text-secondary">Cargando…</Text>;
  if (error) return <Text className="p-4">{error.message}</Text>;
  const payments = data ?? [];

  return (
    <FlatList
      className="flex-1 bg-background"
      contentContainerClassName="p-4 pb-8"
      data={payments}
      keyExtractor={(p) => p.id}
      ListHeaderComponent={
        canRemind.data === false ? (
          <Pressable
            className="px-4 pb-3"
            onPress={Linking.openSettings}
            accessibilityRole="button"
          >
            <Text className="text-[15px] text-negative">
              Las notificaciones de Iris están apagadas: no te puedo avisar.
            </Text>
            <Text className="text-[15px] font-medium text-accent">Activarlas en Ajustes</Text>
          </Pressable>
        ) : (
          <Text className="px-4 pb-3 text-[15px] text-secondary">
            Te aviso un día antes a las 9 a. m. con lo que te quedaría.
          </Text>
        )
      }
      ListEmptyComponent={
        <Text className="py-8 text-center text-secondary">Aún no tienes pagos por hacer.</Text>
      }
      renderItem={({ item, index }) => (
        <Link href={{ pathname: '/payments/[id]', params: { id: item.id } }} asChild>
          <Pressable
            className={`bg-card px-4 active:opacity-60 ${
              index === 0 ? 'rounded-t-2xl' : 'border-t border-separator'
            } ${index === payments.length - 1 ? 'rounded-b-2xl' : ''}`}
            accessibilityRole="button"
          >
            <PaymentRow payment={item} />
          </Pressable>
        </Link>
      )}
      ListFooterComponent={
        <View className="mt-4">
          <LinkButton href="/payments/new" label="Agregar pago" />
        </View>
      }
    />
  );
}
