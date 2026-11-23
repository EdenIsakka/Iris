import { Link } from 'expo-router';
import { Pressable } from 'react-native';
import { Card, CardAction } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { usePayments } from '../api';
import { PaymentRow } from './payment-row';

/** Los 3 pagos más cercanos. Va en Resumen. */
export function PaymentsSummary() {
  const { data, isLoading, error } = usePayments();
  if (isLoading) return <Text className="text-secondary">Cargando…</Text>;
  if (error) return <Text>{error.message}</Text>;
  const payments = data ?? [];

  return (
    <Card title="Próximos pagos">
      {payments.length ? (
        payments.slice(0, 3).map((p) => (
          <Link key={p.id} href={{ pathname: '/payments/[id]', params: { id: p.id } }} asChild>
            <Pressable
              className="active:opacity-60"
              accessibilityRole="button"
              accessibilityHint="Abre el pago para marcarlo como pagado o editarlo"
            >
              <PaymentRow payment={p} />
            </Pressable>
          </Link>
        ))
      ) : (
        <Text className="py-1 text-secondary">
          Agrega el arriendo, los servicios o la tarjeta y te aviso un día antes.
        </Text>
      )}
      <Link href={payments.length ? '/payments' : '/payments/new'} asChild>
        <Pressable
          className="min-h-[44px] justify-center border-t border-separator"
          accessibilityRole="button"
        >
          <CardAction label={payments.length ? 'Ver todos' : 'Agregar pago'} />
        </Pressable>
      </Link>
    </Card>
  );
}
