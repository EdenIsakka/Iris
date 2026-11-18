import { CURRENCIES } from '@finanzas/shared';
import { sql } from 'drizzle-orm';
import { customType, index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

/**
 * Dinero en unidad mínima (ADR-0004): INTEGER en SQLite, bigint en JS.
 * El driver entrega number, exacto hasta 2^53; los esquemas de shared limitan los montos a 15 dígitos.
 */
const money = customType<{ data: bigint; driverData: number }>({
  dataType: () => 'integer',
  toDriver: (value) => Number(value),
  fromDriver: (value) => BigInt(value),
});

const id = () => text().primaryKey().default(sql`(lower(hex(randomblob(16))))`);
const createdAt = () =>
  integer({ mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date());
const currency = () => text({ enum: CURRENCIES }).notNull().default('COP');
const kind = () => text({ enum: ['income', 'expense'] }).notNull();

export const wallets = sqliteTable('wallets', {
  id: id(),
  name: text().notNull(),
  type: text({ enum: ['cash', 'bank', 'card'] }).notNull(),
  /** Lo que tenía antes de empezar a registrar movimientos. */
  openingBalanceMinor: money().notNull().default(0n),
  currency: currency(),
  createdAt: createdAt(),
});

export const categories = sqliteTable('categories', {
  id: id(),
  name: text().notNull(),
  kind: kind(),
  createdAt: createdAt(),
});

export const transactions = sqliteTable(
  'transactions',
  {
    id: id(),
    // No se borra una billetera con movimientos.
    walletId: text()
      .notNull()
      .references(() => wallets.id),
    categoryId: text().references(() => categories.id, { onDelete: 'set null' }),
    kind: kind(),
    amountMinor: money().notNull(),
    currency: currency(),
    occurredAt: integer({ mode: 'timestamp_ms' }).notNull(),
    note: text(),
    createdAt: createdAt(),
  },
  (t) => [
    index('transactions_occurred_idx').on(t.occurredAt),
    index('transactions_wallet_idx').on(t.walletId),
  ],
);

/** Tope de gasto por categoría y mes (period = 'YYYY-MM-01'). */
export const budgets = sqliteTable(
  'budgets',
  {
    id: id(),
    categoryId: text()
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    period: text().notNull(),
    limitMinor: money().notNull(),
    createdAt: createdAt(),
  },
  (t) => [unique('budgets_category_period').on(t.categoryId, t.period)],
);

export const goals = sqliteTable('goals', {
  id: id(),
  name: text().notNull(),
  targetMinor: money().notNull(),
  currency: currency(),
  deadline: text(),
  status: text({ enum: ['active', 'completed'] })
    .notNull()
    .default('active'),
  createdAt: createdAt(),
});

export const goalContributions = sqliteTable('goal_contributions', {
  id: id(),
  goalId: text()
    .notNull()
    .references(() => goals.id, { onDelete: 'cascade' }),
  amountMinor: money().notNull(),
  createdAt: createdAt(),
});

export const investments = sqliteTable('investments', {
  id: id(),
  name: text().notNull(),
  kind: text({ enum: ['crypto', 'stocks', 'fund', 'cdt', 'other'] }).notNull(),
  currency: currency(),
  /** Tasa efectiva anual en centésimas de % (CDT, cajita de Nu); null si el valor se registra a mano. */
  rateBps: integer(),
  createdAt: createdAt(),
});

const investmentId = () =>
  text()
    .notNull()
    .references(() => investments.id, { onDelete: 'cascade' });
const occurredAt = () =>
  integer({ mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date());

/** Plata que la persona metió a la inversión. */
export const investmentContributions = sqliteTable(
  'investment_contributions',
  {
    id: id(),
    investmentId: investmentId(),
    amountMinor: money().notNull(),
    occurredAt: occurredAt(),
  },
  (t) => [index('investment_contributions_idx').on(t.investmentId, t.occurredAt)],
);

/** Cuánto valía la inversión completa en ese momento; la última es el valor actual. */
export const investmentValuations = sqliteTable(
  'investment_valuations',
  {
    id: id(),
    investmentId: investmentId(),
    valueMinor: money().notNull(),
    occurredAt: occurredAt(),
  },
  (t) => [index('investment_valuations_idx').on(t.investmentId, t.occurredAt)],
);

/** TRM de cada día publicado (date = 'YYYY-MM-DD'), en centavos de peso por dólar. */
export const trm = sqliteTable('trm', {
  date: text().primaryKey(),
  rateMinor: money().notNull(),
});
