import { pgTable, text } from 'drizzle-orm/pg-core';
import { id, timestamps, transactionKind } from './_shared';

export const categories = pgTable('categories', {
  id: id(),
  userId: text().notNull(),
  name: text().notNull(),
  kind: transactionKind().notNull(),
  icon: text(),
  ...timestamps,
});
