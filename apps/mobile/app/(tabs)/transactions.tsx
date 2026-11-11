import { Screen } from '@/components/ui/screen';
import { AddTransactionButton } from '@/features/transactions/components/add-transaction-button';
import { TransactionList } from '@/features/transactions/components/transaction-list';

export default function TransactionsScreen() {
  return (
    <Screen title="Movimientos">
      <AddTransactionButton />
      <TransactionList />
    </Screen>
  );
}
