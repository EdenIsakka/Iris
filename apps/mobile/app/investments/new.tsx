import { router } from 'expo-router';
import { InvestmentForm } from '@/features/investments/components/investment-form';

export default function NewInvestmentScreen() {
  return <InvestmentForm onSaved={() => router.back()} />;
}
