import { View } from 'react-native';
import { Fab } from '@/components/ui/fab';
import { TransactionList } from '@/features/transactions/components/transaction-list';

/** Todos los movimientos con filtros; se abre desde Resumen. */
export default function TransactionsScreen() {
  return (
    <View className="flex-1 bg-background px-4">
      <TransactionList />
      <Fab href="/transactions/new" label="Agregar movimiento" />
    </View>
  );
}
