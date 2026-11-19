import { sql } from 'drizzle-orm';
import type { Db } from '../db';
import { SCHEMA_VERSION } from '../migrations';

/** En orden de dependencia: cada tabla solo apunta a las de antes. */
const TABLES = [
  'wallets',
  'categories',
  'transactions',
  'budgets',
  'goals',
  'goal_contributions',
  'investments',
  'investment_contributions',
  'investment_valuations',
  'trm',
] as const;

/** Filas tal como las guarda SQLite: montos enteros y fechas en milisegundos. */
type Row = Record<string, string | number | null>;
export type Backup = {
  app: 'finanzas';
  version: number;
  exportedAt: string;
  tables: Record<string, Row[]>;
};

const NOT_A_BACKUP = 'Este archivo no es una copia de Iris, o está dañado.';

export function backupService(db: Db) {
  /** Nombre → tipo ('integer', 'text') de cada columna de la tabla. */
  const columnsOf = (table: string) =>
    new Map(
      db
        .all<{ name: string; type: string }>(sql.raw(`pragma table_info(${table})`))
        .map((c) => [c.name, c.type.toLowerCase()]),
    );

  return {
    /** Todos los datos en un objeto listo para JSON.stringify. */
    exportData(now = new Date()): Backup {
      const tables = Object.fromEntries(
        TABLES.map((table) => [table, db.all<Row>(sql.raw(`select * from ${table}`))]),
      );
      return { app: 'finanzas', version: SCHEMA_VERSION, exportedAt: now.toISOString(), tables };
    },

    /**
     * Reemplaza todos los datos con los de la copia y devuelve cuántas filas cargó. Revisa todo
     * antes de escribir y lo hace en una transacción: si algo falla, lanza un Error en español y
     * los datos quedan como estaban. Una copia de una versión anterior sirve: las columnas
     * nuevas toman su valor por defecto.
     */
    importData(raw: unknown) {
      const backup = raw as Partial<Backup> | null;
      if (
        backup?.app !== 'finanzas' ||
        typeof backup.version !== 'number' ||
        typeof backup.tables !== 'object' ||
        !backup.tables
      ) {
        throw new Error(NOT_A_BACKUP);
      }
      if (backup.version > SCHEMA_VERSION) {
        throw new Error(
          'La copia es de una versión más nueva de la app. Actualiza la app primero.',
        );
      }
      const tables = backup.tables as Record<string, unknown>;
      const plan = TABLES.map((table) => {
        const rows = tables[table] ?? [];
        if (!Array.isArray(rows)) throw new Error(NOT_A_BACKUP);
        // Solo columnas que existen: los nombres van dentro del SQL.
        const columns = columnsOf(table);
        for (const row of rows) {
          if (!row || typeof row !== 'object') throw new Error(NOT_A_BACKUP);
          for (const [key, value] of Object.entries(row)) {
            const type = columns.get(key);
            // Montos y fechas enteros: la app los lee con BigInt, que no acepta decimales.
            const ok =
              value === null ||
              (type === 'integer' ? Number.isSafeInteger(value) : typeof value === 'string');
            if (!type || !ok) throw new Error(NOT_A_BACKUP);
          }
        }
        return { table, rows: rows as Row[] };
      });

      try {
        db.transaction((tx) => {
          for (const table of [...TABLES].reverse()) tx.run(sql.raw(`delete from ${table}`));
          for (const { table, rows } of plan) {
            for (const row of rows) {
              const keys = Object.keys(row);
              if (!keys.length) continue;
              tx.run(
                sql`insert into ${sql.identifier(table)} (${sql.join(
                  keys.map((k) => sql.identifier(k)),
                  sql`, `,
                )}) values (${sql.join(
                  keys.map((k) => sql`${row[k]}`),
                  sql`, `,
                )})`,
              );
            }
          }
        });
      } catch {
        throw new Error(NOT_A_BACKUP);
      }
      return plan.reduce((n, p) => n + p.rows.length, 0);
    },
  };
}
