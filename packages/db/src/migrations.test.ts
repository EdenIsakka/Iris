import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { migrate } from './migrations';
import { categoriesService } from './services/categories';
import { walletsService } from './services/wallets';
import { testDb } from './test-db';

describe('migrate', () => {
  it('la primera vez crea una billetera y las categorías por defecto', () => {
    const db = testDb();
    expect(walletsService(db).list()).toHaveLength(1);
    expect(categoriesService(db).list().length).toBeGreaterThan(10);
  });

  it('abrir la base otra vez no repite nada', () => {
    const db = testDb();
    migrate(db);
    expect(walletsService(db).list()).toHaveLength(1);
  });

  it('deja activas las llaves foráneas', () => {
    expect(testDb().get<{ foreign_keys: number }>(sql`pragma foreign_keys`)?.foreign_keys).toBe(1);
  });
});
