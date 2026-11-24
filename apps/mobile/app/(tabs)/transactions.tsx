import { Fab } from '@/components/ui/fab';
import { Screen } from '@/components/ui/screen';
import { TransactionList } from '@/features/transactions/components/transaction-list';

export default function TransactionsScreen() {
  return (
    <Screen title="Movimientos">
      <TransactionList />
      <Fab href="/transactions/new" label="Agregar movimiento" />
    </Screen>
  );
}
