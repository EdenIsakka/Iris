import { pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import { currency, id, timestamps } from './_shared';

export const walletType = pgEnum('wallet_type', ['cash', 'bank', 'card']);

export const wallets = pgTable('wallets', {
  id: id(),
  // TODO(auth): referenciar user.id cuando se agregue Better Auth.
  userId: text().notNull(),
  name: text().notNull(),
  type: walletType().notNull(),
  currency: currency(),
  ...timestamps,
});
