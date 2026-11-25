import { and, eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { budgets } from '../schema';
import { testDb } from '../test-db';
import { budgetsService } from './budgets';
import { categoriesService } from './categories';
import { transactionsService } from './transactions';
import { walletsService } from './wallets';

describe('budgetsService', () => {
  const now = new Date('2026-11-15T12:00:00Z');

  function setup() {
    const db = testDb();
    const categories = categoriesService(db);
    const food = categories.create({ name: 'Comida', kind: 'expense' }).id;
    const salary = categories.create({ name: 'Sueldo', kind: 'income' }).id;
    const wallet = walletsService(db).list()[0]?.id ?? '';
    const spend = (amountMinor: string, occurredAt: string) =>
      transactionsService(db).create({
        walletId: wallet,
        categoryId: food,
        kind: 'expense',
        amountMinor,
        occurredAt,
      });
    return { db, service: budgetsService(db), food, salary, spend };
  }

  it('un tope de un mes pasado sigue valiendo y cuenta solo lo gastado este mes', () => {
    const { db, service, food, spend } = setup();
    db.insert(budgets).values({ categoryId: food, period: '2020-01-01', limitMinor: 80000n }).run();
    spend('30000', '2026-11-10T12:00:00Z');
    spend('99000', '2020-01-15T12:00:00Z');
    expect(service.list(now)).toEqual([
      // Quedan 50.000 para los 16 días del 15 al 30 de noviembre.
      {
        categoryId: food,
        name: 'Comida',
        limitMinor: 80000n,
        spentMinor: 30000n,
        perDayMinor: 3125n,
      },
    ]);
  });

  it('cambiar el tope vale desde este mes y no toca el pasado; quitarlo lo saca', () => {
    const { db, service, food } = setup();
    db.insert(budgets).values({ categoryId: food, period: '2020-01-01', limitMinor: 80000n }).run();
    service.set(food, '50000', now);
    expect(service.list(now)[0]?.limitMinor).toBe(50000n);
    const old = db
      .select({ limitMinor: budgets.limitMinor })
      .from(budgets)
      .where(and(eq(budgets.categoryId, food), eq(budgets.period, '2020-01-01')))
      .get();
    expect(old?.limitMinor).toBe(80000n);
    expect(service.remove(food, now)).toBe(true);
    expect(service.list(now)).toEqual([]);
  });

  it('solo acepta categorías de gasto y montos positivos', () => {
    const { service, food, salary } = setup();
    expect(service.set(salary, '1000', now)).toBeNull();
    expect(() => service.set(food, '0', now)).toThrow();
  });
});
