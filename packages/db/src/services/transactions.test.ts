import { describe, expect, it } from 'vitest';
import { testDb } from '../test-db';
import { categoriesService } from './categories';
import { transactionsService } from './transactions';
import { walletsService } from './wallets';

function setup() {
  const db = testDb();
  const moves = transactionsService(db);
  const categories = categoriesService(db);
  const wallet = walletsService(db).list()[0]?.id ?? '';
  const food = categories.create({ name: 'Comida', kind: 'expense' }).id;
  const add = (
    amountMinor: string,
    occurredAt: string,
    kind: 'income' | 'expense' = 'expense',
    categoryId: string | null = null,
  ) => moves.create({ walletId: wallet, categoryId, kind, amountMinor, occurredAt });
  return { db, moves, categories, wallet, food, add };
}

describe('transactionsService', () => {
  it('toma la moneda de la billetera', () => {
    const { add } = setup();
    expect(add('100', '2026-11-10T12:00:00Z')?.currency).toBe('COP');
  });

  it('rechaza una billetera que no existe o una categoría de otro tipo', () => {
    const { moves, add, food } = setup();
    const input = {
      walletId: 'no-existe',
      categoryId: null,
      kind: 'expense' as const,
      amountMinor: '100',
      occurredAt: '2026-11-10T12:00:00Z',
    };
    expect(moves.create(input)).toBeNull();
    expect(add('100', '2026-11-10T12:00:00Z', 'income', food)).toBeNull();
  });

  it('pagina sin saltarse movimientos de la misma hora', () => {
    const { moves, add } = setup();
    for (let i = 0; i < 5; i++) add(String(i + 1), '2026-11-10T12:00:00Z');
    const first = moves.list(undefined, 2);
    const last = first.at(-1);
    const rest = moves.list(last && { before: last.occurredAt, beforeId: last.id }, 10);
    const ids = [...first, ...rest].map((t) => t.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('el resumen cuenta solo el mes de Colombia en curso', () => {
    const { moves, add, food } = setup();
    const now = new Date('2026-11-15T12:00:00Z');
    add('1000', '2026-11-10T12:00:00Z', 'income');
    add('300', '2026-11-10T12:00:00Z', 'expense', food);
    // 1 nov a las 03:00 UTC aún es 31 oct en Colombia.
    add('999', '2026-11-01T03:00:00Z', 'expense', food);
    expect(moves.monthSummary(now)).toEqual({
      incomeMinor: 1000n,
      expenseMinor: 300n,
      byCategory: [{ id: expect.any(String), name: 'Comida', amountMinor: 300n }],
    });
  });

  it('da 6 meses, del más viejo al actual, con 0 en los vacíos', () => {
    const { moves, add } = setup();
    const now = new Date('2026-03-15T12:00:00Z');
    add('1000', '2026-03-10T12:00:00Z', 'income');
    add('50', '2026-03-01T03:00:00Z'); // 28 feb en Colombia
    add('9999', '2025-09-15T12:00:00Z'); // fuera de los 6 meses
    const months = moves.monthly(6, now);
    expect(months.map((m) => m.month)).toEqual([
      '2025-10',
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02',
      '2026-03',
    ]);
    expect(months.at(-1)).toEqual({ month: '2026-03', incomeMinor: 1000n, expenseMinor: 0n });
    expect(months.at(-2)?.expenseMinor).toBe(50n);
  });

  it('borrar una categoría deja sus movimientos sin categoría', () => {
    const { moves, categories, add, food } = setup();
    const t = add('100', '2026-11-10T12:00:00Z', 'expense', food);
    expect(categories.remove(food)).toBe(true);
    expect(moves.get(t?.id ?? '')?.categoryId).toBeNull();
  });
});

describe('categoriesService', () => {
  it('no duplica ni deja renombrar a un nombre que ya existe', () => {
    const { categories, food } = setup();
    expect(categories.create({ name: 'comida', kind: 'expense' }).id).toBe(food);
    const other = categories.create({ name: 'Cine', kind: 'expense' }).id;
    expect(categories.rename(other, 'COMIDA')).toBe('duplicate');
    expect(categories.rename('no-existe', 'X')).toBe('not-found');
  });
});
