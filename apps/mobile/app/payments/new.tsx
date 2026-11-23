import { router } from 'expo-router';
import { PaymentForm } from '@/features/payments/components/payment-form';

export default function NewPaymentScreen() {
  return <PaymentForm onDone={() => router.back()} />;
}
