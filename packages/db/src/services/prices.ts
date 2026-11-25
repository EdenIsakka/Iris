import { PRICED, type PriceSymbol, usdToCop } from '@finanzas/shared';
import { and, eq, gte, isNotNull } from 'drizzle-orm';
import type { Db } from '../db';
import { BOGOTA_OFFSET_MS } from '../month';
import { investmentContributions, investments, investmentValuations } from '../schema';
import { parseRate, trmService } from './trm';

type Fetch = (url: string) => Promise<Response>;

const DAY_MS = 86_400_000;

const twelveDataUrl = (symbol: string, key: string) =>
  `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${encodeURIComponent(key)}`;
const twelveDataPrice = async (res: Response) =>
  parseRate(((await res.json()) as { price?: unknown }).price);

/** Inicio del día de hoy en Colombia. */
const todayStart = (now: Date) =>
  new Date(Math.floor((now.getTime() - BOGOTA_OFFSET_MS) / DAY_MS) * DAY_MS + BOGOTA_OFFSET_MS);

/** Valor en pesos de unas unidades (en cienmillonésimas) a un precio por unidad, redondeado. */
export const unitsValue = (quantityE8: bigint, priceMinor: bigint) =>
  (quantityE8 * priceMinor + 50_000_000n) / 100_000_000n;

/** Precio de 1 unidad en pesos, o null si no se pudo traer. */
async function priceInCop(
  symbol: PriceSymbol,
  fetchFn: Fetch,
  twelveDataKey: string | null,
  trmMinor: bigint | null,
) {
  if (symbol === 'BTC') {
    const res = await fetchFn(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=cop',
    );
    const body = (await res.json()) as { bitcoin?: { cop?: unknown } };
    const cop = body.bitcoin?.cop;
    return typeof cop === 'number' && cop > 0 ? BigInt(Math.round(cop)) : null;
  }
  // Los fondos cotizan en dólares: sin llave o sin TRM no hay cómo ponerles precio.
  if (!twelveDataKey || !trmMinor) return null;
  const usdCents = await twelveDataPrice(await fetchFn(twelveDataUrl(symbol, twelveDataKey)));
  return usdCents ? usdToCop(usdCents, trmMinor) : null;
}

export function pricesService(db: Db, fetchFn: Fetch = (url) => fetch(url)) {
  return {
    /** true si Twelve Data da un precio con esta llave. Sin red, lanza el error. */
    async checkKey(key: string) {
      return (await twelveDataPrice(await fetchFn(twelveDataUrl('VOO', key)))) !== null;
    },

    /** Precio de hoy de 1 unidad en pesos; null sin red, sin llave o (fondos) sin TRM guardada. */
    async quote(symbol: PriceSymbol, twelveDataKey: string | null) {
      const trm =
        PRICED[symbol].kind === 'fund'
          ? (trmService(db, fetchFn).latest()?.rateMinor ?? null)
          : null;
      return priceInCop(symbol, fetchFn, twelveDataKey, trm).catch(() => null);
    },

    /**
     * Pone el valor de hoy (unidades × precio) a cada inversión con precio automático. Deja un
     * solo valor automático por día: reemplaza el anterior de hoy. Si un precio falla, esa
     * inversión se queda como estaba. Devuelve cuántas cambiaron.
     */
    async refresh(twelveDataKey: string | null, now = new Date()) {
      const priced = db
        .select({ id: investments.id, symbol: investments.symbol })
        .from(investments)
        .where(isNotNull(investments.symbol))
        .all();
      if (!priced.length) return 0;
      const needsTrm = priced.some((p) => p.symbol && PRICED[p.symbol].kind === 'fund');
      const trm = needsTrm ? ((await trmService(db, fetchFn).refresh())?.rateMinor ?? null) : null;

      const prices = new Map<PriceSymbol, bigint | null>();
      for (const symbol of new Set(priced.flatMap((p) => (p.symbol ? [p.symbol] : [])))) {
        prices.set(symbol, await priceInCop(symbol, fetchFn, twelveDataKey, trm).catch(() => null));
      }

      let changed = 0;
      for (const { id, symbol } of priced) {
        const price = symbol ? prices.get(symbol) : null;
        if (!price) continue;
        const quantityE8 = db
          .select({ q: investmentContributions.quantityE8 })
          .from(investmentContributions)
          .where(eq(investmentContributions.investmentId, id))
          .all()
          .reduce((acc, c) => acc + (c.q ?? 0n), 0n);
        const valueMinor = unitsValue(quantityE8, price);
        db.transaction((tx) => {
          tx.delete(investmentValuations)
            .where(
              and(
                eq(investmentValuations.investmentId, id),
                eq(investmentValuations.auto, true),
                gte(investmentValuations.occurredAt, todayStart(now)),
              ),
            )
            .run();
          tx.insert(investmentValuations)
            .values({ investmentId: id, valueMinor, auto: true, occurredAt: now })
            .run();
        });
        changed++;
      }
      return changed;
    },
  };
}
