import { pgTable, text } from 'drizzle-orm/pg-core';
import { id, timestamps, transactionKind } from './_shared';
import { ownerId } from './auth';

export const categories = pgTable('categories', {
  id: id(),
  userId: ownerId(),
  name: text().notNull(),
  kind: transactionKind().notNull(),
  icon: text(),
  ...timestamps,
});
