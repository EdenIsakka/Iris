import { describe, expect, it } from 'vitest';
import { testDb } from '../test-db';
import { investmentsService } from './investments';
import { pricesService } from './prices';

/** fetch falso: responde según la URL, sin internet. */
const fakeFetch = (routes: Record<string, unknown>) => async (url: string) => {
  const match = Object.keys(routes).find((key) => url.includes(key));
  if (!match) throw new Error(`sin red: ${url}`);
  return new Response(JSON.stringify(routes[match]));
};

const setup = () => {
  const db = testDb();
  const investments = investmentsService(db);
  const btc = investments.create({
    name: 'Bitcoin',
    kind: 'crypto',
    amountMinor: '1000000',
    symbol: 'BTC',
    quantity: '0,005',
  }).id;
  const voo = investments.create({
    name: 'VOO',
    kind: 'fund',
    amountMinor: '2000000',
    symbol: 'VOO',
    quantity: '1,5',
  }).id;
  const itemOf = (id: string) => investments.list('month').items.find((i) => i.id === id);
  return { db, investments, btc, voo, itemOf };
};

const routes = {
  coingecko: { bitcoin: { cop: 400_000_000 } },
  twelvedata: { price: '500.10' },
  'datos.gov.co': [{ valor: '4000.00', vigenciadesde: '2026-11-18T00:00:00.000' }],
};

describe('pricesService', () => {
  it('el valor es unidades × precio; los fondos pasan de dólares con la TRM', async () => {
    const { db, btc, voo, itemOf } = setup();
    expect(await pricesService(db, fakeFetch(routes)).refresh('llave')).toBe(2);
    expect(itemOf(btc)).toMatchObject({ quantityE8: 500_000n, valueMinor: 2_000_000n });
    // 1,5 × US$500,10 × 4.000 = 3.000.600
    expect(itemOf(voo)?.valueMinor).toBe(3_000_600n);
  });

  it('sin llave solo actualiza Bitcoin; si falla la red, nada cambia', async () => {
    const { db, btc, voo, itemOf } = setup();
    expect(await pricesService(db, fakeFetch(routes)).refresh(null)).toBe(1);
    expect(itemOf(voo)?.valueMinor).toBe(2_000_000n);
    expect(await pricesService(db, fakeFetch({})).refresh('llave')).toBe(0);
    expect(itemOf(btc)?.valueMinor).toBe(2_000_000n);
  });

  it('deja un solo valor automático por día', async () => {
    const { db, investments, btc } = setup();
    const prices = pricesService(db, fakeFetch(routes));
    const now = new Date();
    await prices.refresh(null, now);
    await prices.refresh(null, new Date(now.getTime() + 1000));
    expect(investments.history(btc, 'week')?.length).toBe(2); // el inicio y el de hoy
  });

  it('aportar a una con precio pide las unidades y las suma', () => {
    const { investments, btc, itemOf } = setup();
    expect(() => investments.contribute(btc, { amountMinor: '100' })).toThrow();
    investments.contribute(btc, { amountMinor: '100', quantity: '0.001' });
    expect(itemOf(btc)?.quantityE8).toBe(600_000n);
  });
});

describe('checkKey', () => {
  it('dice si Twelve Data acepta la llave', async () => {
    const db = testDb();
    expect(await pricesService(db, fakeFetch(routes)).checkKey('llave')).toBe(true);
    const rejected = fakeFetch({ twelvedata: { code: 401, status: 'error' } });
    expect(await pricesService(db, rejected).checkKey('mala')).toBe(false);
  });
});
