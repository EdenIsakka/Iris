import { date, pgTable, unique, uuid } from 'drizzle-orm/pg-core';
import { currency, id, money, timestamps } from './_shared';
import { ownerId } from './auth';
import { categories } from './categories';

/** Tope de gasto por categoría y mes (period = primer día del mes). */
export const budgets = pgTable(
  'budgets',
  {
    id: id(),
    userId: ownerId(),
    categoryId: uuid()
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    period: date().notNull(),
    limitMinor: money(),
    currency: currency(),
    ...timestamps,
  },
  (t) => [unique().on(t.userId, t.categoryId, t.period)],
);
