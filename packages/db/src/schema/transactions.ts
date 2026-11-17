import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { currency, id, money, timestamps, transactionKind } from './_shared';
import { ownerId } from './auth';
import { categories } from './categories';
import { wallets } from './wallets';

export const transactions = pgTable(
  'transactions',
  {
    id: id(),
    userId: ownerId(),
    walletId: uuid()
      .notNull()
      // No se borra una billetera con movimientos. "no action" y no "restrict": revisa al final
      // de la sentencia, así borrar el usuario se lleva billeteras y movimientos en cascada.
      .references(() => wallets.id, { onDelete: 'no action' }),
    categoryId: uuid().references(() => categories.id, { onDelete: 'set null' }),
    kind: transactionKind().notNull(),
    amountMinor: money(),
    currency: currency(),
    occurredAt: timestamp({ withTimezone: true }).notNull(),
    note: text(),
    ...timestamps,
  },
  (t) => [
    index('transactions_user_occurred_idx').on(t.userId, t.occurredAt),
    // Postgres no indexa solo las llaves foráneas; el saldo de billeteras une por aquí.
    index('transactions_wallet_idx').on(t.walletId),
  ],
);
