import { sql } from 'drizzle-orm';
import { bigint, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import { currency, id, timestamps } from './_shared';
import { ownerId } from './auth';

export const walletType = pgEnum('wallet_type', ['cash', 'bank', 'card']);

export const wallets = pgTable('wallets', {
  id: id(),
  userId: ownerId(),
  name: text().notNull(),
  type: walletType().notNull(),
  /** Lo que tenía antes de empezar a registrar movimientos. */
  openingBalanceMinor: bigint({ mode: 'bigint' }).notNull().default(sql`0`),
  currency: currency(),
  ...timestamps,
});
