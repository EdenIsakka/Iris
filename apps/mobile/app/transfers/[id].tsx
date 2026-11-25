import { router, useLocalSearchParams } from 'expo-router';
import { TransferDetail } from '@/features/transfers/components/transfer-detail';

export default function TransferScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TransferDetail id={id} onDone={() => router.back()} />;
}
