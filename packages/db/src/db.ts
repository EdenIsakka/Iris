import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

/** Cualquier SQLite síncrono: expo-sqlite en la app, sql.js en las pruebas. */
export type Db = BaseSQLiteDatabase<'sync', unknown>;

/** Opciones con las que se crea el cliente de Drizzle en la app y en las pruebas. */
export const drizzleConfig = { casing: 'snake_case' } as const;
