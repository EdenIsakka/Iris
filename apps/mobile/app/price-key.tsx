import { router } from 'expo-router';
import { PriceKeyForm } from '@/features/investments/components/price-key-form';

export default function PriceKeyScreen() {
  return <PriceKeyForm onDone={() => router.back()} />;
}
