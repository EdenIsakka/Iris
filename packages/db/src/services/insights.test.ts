import { describe, expect, it } from 'vitest';
import { testDb } from '../test-db';
import { budgetsService } from './budgets';
import { categoriesService } from './categories';
import { insightsService } from './insights';
import { transactionsService } from './transactions';
import { walletsService } from './wallets';

// 10 de noviembre al mediodía en Colombia: van 10 de 30 días.
const NOW = new Date('2026-11-10T17:00:00Z');

function setup() {
  const db = testDb();
  const categories = categoriesService(db);
  const food = categories.create({ name: 'Comida', kind: 'expense' }).id;
  const fun = categories.create({ name: 'Cine', kind: 'expense' }).id;
  const wallet = walletsService(db).list()[0]?.id ?? '';
  const spend = (categoryId: string, amountMinor: string, occurredAt: string) =>
    transactionsService(db).create({
      walletId: wallet,
      categoryId,
      kind: 'expense',
      amountMinor,
      occurredAt,
    });
  return { db, food, fun, spend, insights: () => insightsService(db).list(NOW) };
}

describe('insightsService', () => {
  it('avisa la categoría que ya supera en 30 % todo el mes pasado, y no la que no', () => {
    const { food, fun, spend, insights } = setup();
    spend(food, '100000', '2026-10-05T17:00:00Z');
    spend(food, '150000', '2026-11-03T17:00:00Z');
    spend(fun, '100000', '2026-10-05T17:00:00Z');
    spend(fun, '120000', '2026-11-03T17:00:00Z');
    expect(insights()).toEqual([
      { tone: 'warning', text: 'Ya gastaste 50% más en Comida que en todo el mes pasado.' },
    ]);
  });

  it('proyecta el tope al ritmo de hoy y dice cuánto queda por día', () => {
    const { db, food, spend, insights } = setup();
    budgetsService(db).set(food, '300000', NOW);
    // 120.000 en 10 días → 360.000 en 30: se pasa de 300.000.
    spend(food, '120000', '2026-11-02T17:00:00Z');
    expect(insights()).toEqual([
      { tone: 'warning', text: 'A este ritmo te pasas del tope de Comida.' },
    ]);
    // Quedan 180.000 para 21 días contando hoy.
    expect(budgetsService(db).list(NOW)[0]?.perDayMinor).toBe(8571n);
  });

  it('los primeros días no proyecta: una compra grande no es un ritmo', () => {
    const { db, food, spend } = setup();
    const day3 = new Date('2026-11-03T17:00:00Z');
    budgetsService(db).set(food, '300000', day3);
    spend(food, '50000', '2026-11-01T17:00:00Z');
    expect(insightsService(db).list(day3)).toEqual([
      { tone: 'good', text: 'Vas bien con todos tus topes este mes.' },
    ]);
  });

  it('con topes y sin alertas dice que va bien', () => {
    const { db, food, spend, insights } = setup();
    budgetsService(db).set(food, '300000', NOW);
    spend(food, '50000', '2026-11-02T17:00:00Z');
    expect(insights()).toEqual([{ tone: 'good', text: 'Vas bien con todos tus topes este mes.' }]);
  });
});
