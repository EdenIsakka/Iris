import { index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { currency, id, money, timestamps } from './_shared';

export const investmentKind = pgEnum('investment_kind', [
  'crypto',
  'stocks',
  'fund',
  'cdt',
  'other',
]);

export const investments = pgTable('investments', {
  id: id(),
  userId: text().notNull(),
  name: text().notNull(),
  kind: investmentKind().notNull(),
  currency: currency(),
  ...timestamps,
});

const investmentId = () =>
  uuid()
    .notNull()
    .references(() => investments.id, { onDelete: 'cascade' });
const occurredAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();

/** Plata que la persona metió a la inversión. */
export const investmentContributions = pgTable(
  'investment_contributions',
  {
    id: id(),
    investmentId: investmentId(),
    amountMinor: money(),
    occurredAt: occurredAt(),
    ...timestamps,
  },
  (t) => [index().on(t.investmentId, t.occurredAt)],
);

/** Cuánto valía la inversión completa en ese momento; la última es el valor actual. */
export const investmentValuations = pgTable(
  'investment_valuations',
  {
    id: id(),
    investmentId: investmentId(),
    valueMinor: money(),
    occurredAt: occurredAt(),
    ...timestamps,
  },
  (t) => [index().on(t.investmentId, t.occurredAt)],
);
