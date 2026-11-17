import { router, useLocalSearchParams } from 'expo-router';
import { BudgetForm } from '@/features/budgets/components/budget-form';

export default function BudgetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BudgetForm categoryId={id} onDone={() => router.back()} />;
}
