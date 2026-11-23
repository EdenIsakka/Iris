import { router, useLocalSearchParams } from 'expo-router';
import { EditPayment } from '@/features/payments/components/payment-form';

export default function PaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditPayment id={id} onDone={() => router.back()} />;
}
