import { Fab } from '@/components/ui/fab';
import { Screen } from '@/components/ui/screen';
import { PaymentList } from '@/features/payments/components/payment-list';

export default function PaymentsScreen() {
  return (
    <Screen title="Pagos">
      <PaymentList />
      <Fab href="/payments/new" label="Agregar pago" />
    </Screen>
  );
}
