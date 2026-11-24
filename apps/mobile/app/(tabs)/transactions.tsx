import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { Pressable } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { TransactionList } from '@/features/transactions/components/transaction-list';

export default function TransactionsScreen() {
  return (
    <Screen title="Movimientos">
      <TransactionList />
      <Link href="/transactions/new" asChild>
        <Pressable
          className="absolute bottom-5 right-5 h-14 w-14 items-center justify-center rounded-2xl bg-hero active:opacity-80"
          accessibilityRole="button"
          accessibilityLabel="Agregar movimiento"
        >
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </Pressable>
      </Link>
    </Screen>
  );
}
