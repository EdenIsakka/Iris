import { date, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { currency, id, money, timestamps } from './_shared';
import { ownerId } from './auth';

export const goalStatus = pgEnum('goal_status', ['active', 'completed']);

export const goals = pgTable('goals', {
  id: id(),
  userId: ownerId(),
  name: text().notNull(),
  targetMinor: money(),
  currency: currency(),
  deadline: date(),
  status: goalStatus().notNull().default('active'),
  ...timestamps,
});

export const goalContributions = pgTable('goal_contributions', {
  id: id(),
  goalId: uuid()
    .notNull()
    .references(() => goals.id, { onDelete: 'cascade' }),
  amountMinor: money(),
  ...timestamps,
});
