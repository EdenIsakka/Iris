import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { currency, id, money, timestamps, transactionKind } from './_shared';
import { categories } from './categories';
import { wallets } from './wallets';

export const transactions = pgTable(
  'transactions',
  {
    id: id(),
    userId: text().notNull(),
    walletId: uuid()
      .notNull()
      .references(() => wallets.id, { onDelete: 'cascade' }),
    categoryId: uuid().references(() => categories.id, { onDelete: 'set null' }),
    kind: transactionKind().notNull(),
    amountMinor: money(),
    currency: currency(),
    occurredAt: timestamp({ withTimezone: true }).notNull(),
    note: text(),
    ...timestamps,
  },
  (t) => [index('transactions_user_occurred_idx').on(t.userId, t.occurredAt)],
);
