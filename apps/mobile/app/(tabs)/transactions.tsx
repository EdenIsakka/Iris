import { LinkButton } from '@/components/ui/link-button';
import { Screen } from '@/components/ui/screen';
import { TransactionList } from '@/features/transactions/components/transaction-list';

export default function TransactionsScreen() {
  return (
    <Screen title="Movimientos">
      <LinkButton href="/transactions/new" label="Agregar movimiento" />
      <TransactionList />
    </Screen>
  );
}
