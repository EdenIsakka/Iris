import { sql } from 'drizzle-orm';
import type { Db } from './db';
import { categories, wallets } from './schema';

const id = 'text primary key default (lower(hex(randomblob(16)))) not null';
const money = 'integer not null';

/**
 * Una entrada por versión; nunca se edita una que ya salió, se agrega otra al final.
 * Debe coincidir con schema.ts (ADR-0008).
 */
const MIGRATIONS: string[][] = [
  [
    `create table wallets (
      id ${id},
      name text not null,
      type text not null,
      opening_balance_minor integer not null default 0,
      currency text not null default 'COP',
      created_at integer not null
    )`,
    `create table categories (
      id ${id},
      name text not null,
      kind text not null,
      created_at integer not null
    )`,
    `create table transactions (
      id ${id},
      wallet_id text not null references wallets(id),
      category_id text references categories(id) on delete set null,
      kind text not null,
      amount_minor ${money},
      currency text not null default 'COP',
      occurred_at integer not null,
      note text,
      created_at integer not null
    )`,
    'create index transactions_occurred_idx on transactions (occurred_at)',
    'create index transactions_wallet_idx on transactions (wallet_id)',
    `create table budgets (
      id ${id},
      category_id text not null references categories(id) on delete cascade,
      period text not null,
      limit_minor ${money},
      created_at integer not null,
      constraint budgets_category_period unique (category_id, period)
    )`,
    `create table goals (
      id ${id},
      name text not null,
      target_minor ${money},
      currency text not null default 'COP',
      deadline text,
      status text not null default 'active',
      created_at integer not null
    )`,
    `create table goal_contributions (
      id ${id},
      goal_id text not null references goals(id) on delete cascade,
      amount_minor ${money},
      created_at integer not null
    )`,
    `create table investments (
      id ${id},
      name text not null,
      kind text not null,
      currency text not null default 'COP',
      created_at integer not null
    )`,
    `create table investment_contributions (
      id ${id},
      investment_id text not null references investments(id) on delete cascade,
      amount_minor ${money},
      occurred_at integer not null
    )`,
    'create index investment_contributions_idx on investment_contributions (investment_id, occurred_at)',
    `create table investment_valuations (
      id ${id},
      investment_id text not null references investments(id) on delete cascade,
      value_minor ${money},
      occurred_at integer not null
    )`,
    'create index investment_valuations_idx on investment_valuations (investment_id, occurred_at)',
  ],
  [`create table trm (date text primary key not null, rate_minor ${money})`],
  ['alter table investments add column rate_bps integer'],
  [
    'alter table investments add column symbol text',
    'alter table investment_contributions add column quantity_e8 integer',
    'alter table investment_valuations add column auto integer not null default 0',
  ],
  [
    `create table scheduled_payments (
      id ${id},
      name text not null,
      amount_minor ${money},
      wallet_id text not null references wallets(id) on delete cascade,
      category_id text references categories(id) on delete set null,
      due_date text not null,
      day_of_month integer not null,
      repeat text not null,
      created_at integer not null
    )`,
  ],
];

/** Versión de la base; va en las copias para no importar una de una app más nueva. */
export const SCHEMA_VERSION = MIGRATIONS.length;

const DEFAULT_CATEGORIES = {
  expense: [
    'Mercado',
    'Transporte',
    'Arriendo',
    'Servicios',
    'Salud',
    'Restaurantes',
    'Entretenimiento',
    'Educación',
    'Ropa',
    'Deudas',
    'Otros gastos',
  ],
  income: ['Salario', 'Trabajo extra', 'Ventas', 'Regalos', 'Otros ingresos'],
};

/** Billetera y categorías con las que arranca la app la primera vez. */
function createDefaults(db: Db) {
  db.insert(wallets).values({ name: 'Cuenta de ahorros', type: 'bank' }).run();
  db.insert(categories)
    .values(
      (['expense', 'income'] as const).flatMap((kind) =>
        DEFAULT_CATEGORIES[kind].map((name) => ({ name, kind })),
      ),
    )
    .run();
}

/** Lleva la base a la última versión. Se llama cada vez que se abre. */
export function migrate(db: Db) {
  // SQLite no revisa las llaves foráneas si no se activa en cada conexión.
  db.run(sql`pragma foreign_keys = on`);
  const from = db.get<{ user_version: number }>(sql`pragma user_version`)?.user_version ?? 0;
  if (from >= MIGRATIONS.length) return;
  db.transaction((tx) => {
    for (const statements of MIGRATIONS.slice(from)) {
      for (const statement of statements) tx.run(sql.raw(statement));
    }
    if (from === 0) createDefaults(tx);
    tx.run(sql.raw(`pragma user_version = ${MIGRATIONS.length}`));
  });
}
