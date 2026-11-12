import { router, useLocalSearchParams } from 'expo-router';
import { EditTransaction } from '@/features/transactions/components/edit-transaction';

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditTransaction id={id} onDone={() => router.back()} />;
}
