import { router, useLocalSearchParams } from 'expo-router';
import { EditWallet } from '@/features/wallets/components/edit-wallet';

export default function EditWalletScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditWallet id={id} onDone={() => router.back()} />;
}
