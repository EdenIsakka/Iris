import { router } from 'expo-router';
import { WalletForm } from '@/features/wallets/components/wallet-form';

export default function NewWalletScreen() {
  return <WalletForm onSaved={() => router.back()} />;
}
