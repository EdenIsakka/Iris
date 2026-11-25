import { formatMoney } from '@finanzas/shared';
import { Link } from 'expo-router';
import { FlatList, Linking, Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useCanRemind, usePayments } from '../api';
import { PaymentRow } from './payment-row';

/** Todos los pagos por fecha; tocar uno lo abre. */
export function PaymentList() {
  const { data, isLoading, error } = usePayments();
  const canRemind = useCanRemind();
  if (isLoading) return <Text className="text-secondary">Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;
  const payments = data ?? [];
  // Sin TRM de por medio: los pagos en dólares se suman aparte.
  const monthly = (currency: string) =>
    payments
      .filter((p) => p.repeat === 'monthly' && p.currency === currency)
      .reduce((acc, p) => acc + p.amountMinor, 0n);
  const fixed = [
    monthly('COP') ? formatMoney(monthly('COP')) : '',
    monthly('USD') ? formatMoney(monthly('USD'), 'USD') : '',
  ].filter(Boolean);

  return (
    <FlatList
      className="-mx-4"
      contentContainerClassName="px-4 pb-24"
      data={payments}
      keyExtractor={(p) => p.id}
      ListHeaderComponent={
        <View>
          {fixed.length ? (
            <Text
              className="px-1 pb-1 text-[17px] font-semibold"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              Pagos fijos: {fixed.join(' + ')} al mes
            </Text>
          ) : null}
          {canRemind.data === false ? (
            <Pressable
              className="px-1 pb-3"
              onPress={Linking.openSettings}
              accessibilityRole="button"
            >
              <Text className="text-[15px] text-negative">
                Las notificaciones de Iris están apagadas: no te puedo avisar.
              </Text>
              <Text className="text-[15px] font-medium text-accent">Activarlas en Ajustes</Text>
            </Pressable>
          ) : (
            <Text className="px-1 pb-3 text-[15px] text-secondary">
              Te aviso un día antes a las 9 a. m. con lo que te quedaría.
            </Text>
          )}
        </View>
      }
      ListEmptyComponent={
        <Text className="py-8 text-center text-secondary">Aún no tienes pagos por hacer.</Text>
      }
      renderItem={({ item, index }) => (
        <Link href={{ pathname: '/payments/[id]', params: { id: item.id } }} asChild>
          <Pressable
            className={`bg-card px-4 active:opacity-60 ${
              index === 0 ? 'rounded-t-3xl' : 'border-t border-separator'
            } ${index === payments.length - 1 ? 'rounded-b-3xl' : ''}`}
            accessibilityRole="button"
          >
            <PaymentRow payment={item} />
          </Pressable>
        </Link>
      )}
    />
  );
}
