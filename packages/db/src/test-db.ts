import { drizzle } from 'drizzle-orm/sql-js';
import initSqlJs from 'sql.js';
import { drizzleConfig } from './db';
import { migrate } from './migrations';

const SQL = await initSqlJs();

/** Base nueva en memoria, migrada y con los datos por defecto, como la de un celular recién instalado. */
export function testDb() {
  const db = drizzle(new SQL.Database(), drizzleConfig);
  migrate(db);
  return db;
}
