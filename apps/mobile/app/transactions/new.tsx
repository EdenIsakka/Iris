import { router } from 'expo-router';
import { TransactionForm } from '@/features/transactions/components/transaction-form';

export default function NewTransactionScreen() {
  return <TransactionForm onSaved={() => router.back()} />;
}
