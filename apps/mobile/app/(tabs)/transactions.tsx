import { Screen } from '@/components/ui/screen';
import { TransactionList } from '@/features/transactions/components/transaction-list';

export default function TransactionsScreen() {
  return (
    <Screen title="Movimientos">
      <TransactionList />
    </Screen>
  );
}
