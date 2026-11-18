import { desc, type SQL, sql } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import type { Db } from '../db';
import { trm } from '../schema';

const TRM_URL =
  'https://www.datos.gov.co/resource/32sa-8pi3.json?$order=vigenciadesde%20DESC&$limit=1';

/** '4123.45' → 412345n (centavos de peso). null si no es un número positivo. */
export function parseRate(valor: unknown) {
  const match = typeof valor === 'string' ? /^(\d+)(?:\.(\d*))?$/.exec(valor) : null;
  if (!match) return null;
  const rate = BigInt(`${match[1]}${(match[2] ?? '').slice(0, 2).padEnd(2, '0')}`);
  return rate > 0n ? rate : null;
}

/**
 * Un monto en pesos: si está en USD lo pasa con la última TRM guardada (0 si nunca hubo).
 * Mismo redondeo que `usdToCop` de shared; los montos de movimientos siempre son positivos.
 * shortcut: usa la TRM de hoy también para movimientos viejos; guardar la TRM en cada
 * movimiento si algún día se necesita el valor exacto del día.
 */
export const inCop = (amount: SQLiteColumn, currency: SQLiteColumn): SQL =>
  sql`case when ${currency} = 'USD' then (${amount} * coalesce((select rate_minor from trm order by date desc limit 1), 0) + 5000) / 10000 else ${amount} end`;

export function trmService(
  db: Db,
  fetchFn: (url: string) => Promise<Response> = (url) => fetch(url),
) {
  const latest = () => db.select().from(trm).orderBy(desc(trm.date)).limit(1).get() ?? null;

  return {
    latest,

    /**
     * Trae la TRM vigente de datos.gov.co y la guarda. Sin red o con una respuesta rara,
     * se queda con la última guardada. null si nunca se ha podido traer.
     */
    async refresh() {
      try {
        const res = await fetchFn(TRM_URL);
        if (res.ok) {
          const [row] = (await res.json()) as { valor?: unknown; vigenciadesde?: unknown }[];
          const rateMinor = parseRate(row?.valor);
          const date = typeof row?.vigenciadesde === 'string' ? row.vigenciadesde.slice(0, 10) : '';
          if (rateMinor && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            db.insert(trm).values({ date, rateMinor }).onConflictDoNothing().run();
          }
        }
      } catch {
        // Sin red: sirve la guardada.
      }
      return latest();
    },
  };
}
