import { router, useLocalSearchParams } from 'expo-router';
import { TransactionForm } from '@/features/transactions/components/transaction-form';

export default function NewTransactionScreen() {
  // Los atajos de Resumen abren el formulario ya en gasto o en ingreso.
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  return (
    <TransactionForm
      onSaved={() => router.back()}
      kind={kind === 'income' ? 'income' : 'expense'}
    />
  );
}
