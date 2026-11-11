import { bigint, pgEnum, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const id = () => uuid().primaryKey().defaultRandom();
/** Dinero en unidad mínima (ADR-0004). mode 'bigint' evita perder precisión. */
export const money = () => bigint({ mode: 'bigint' }).notNull();
export const currency = () => text().notNull().default('COP');
export const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const transactionKind = pgEnum('transaction_kind', ['income', 'expense']);
