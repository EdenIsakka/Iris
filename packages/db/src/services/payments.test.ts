import { describe, expect, it } from 'vitest';
import { testDb } from '../test-db';
import { categoriesService } from './categories';
import { nextMonth, paymentsService } from './payments';
import { transactionsService } from './transactions';
import { walletsService } from './wallets';

function setup() {
  const db = testDb();
  const wallets = walletsService(db);
  const wallet = wallets.create({ name: 'Nómina', type: 'bank', openingBalanceMinor: '1000000' });
  const payments = paymentsService(db);
  const base = {
    amountMinor: '400000',
    walletId: wallet.id,
    categoryId: null,
    repeat: 'monthly' as const,
  };
  return { db, wallet, wallets, payments, base };
}

describe('nextMonth', () => {
  it('mismo día el mes siguiente, o el último si no existe, y vuelve al original', () => {
    expect(nextMonth('2026-01-15', 15)).toBe('2026-02-15');
    expect(nextMonth('2026-01-31', 31)).toBe('2026-02-28');
    expect(nextMonth('2026-02-28', 31)).toBe('2026-03-31');
    expect(nextMonth('2028-01-31', 31)).toBe('2028-02-29');
    expect(nextMonth('2026-12-31', 31)).toBe('2027-01-31');
  });
});

describe('paymentsService', () => {
  it('dice cuánto queda tras cada pago, descontando los anteriores de la misma billetera', () => {
    const { payments, base } = setup();
    payments.create({ ...base, name: 'Servicios', dueDate: '2026-12-10' });
    payments.create({ ...base, name: 'Arriendo', dueDate: '2026-12-01' });
    payments.create({ ...base, name: 'Tarjeta', dueDate: '2026-12-20' });
    expect(payments.list().map((p) => [p.name, p.leftMinor])).toEqual([
      ['Arriendo', 600000n],
      ['Servicios', 200000n],
      ['Tarjeta', -200000n],
    ]);
  });

  it('pagar uno mensual crea el gasto y lo pasa al mes siguiente', () => {
    const { db, payments, base, wallets } = setup();
    const p = payments.create({ ...base, name: 'Arriendo', dueDate: '2026-01-31' });
    expect(p).not.toBeNull();
    expect(payments.pay(p?.id ?? '', new Date('2026-01-30T15:00:00Z'))).toBe(true);
    expect(payments.list()[0]?.dueDate).toBe('2026-02-28');
    const [tx] = transactionsService(db).list();
    expect(tx).toMatchObject({ kind: 'expense', amountMinor: 400000n, note: 'Arriendo' });
    expect(wallets.list().find((w) => w.name === 'Nómina')?.balanceMinor).toBe(600000n);
    // El siguiente pago vuelve al 31 en marzo.
    payments.pay(p?.id ?? '');
    expect(payments.list()[0]?.dueDate).toBe('2026-03-31');
  });

  it('pagar uno de una sola vez lo quita de la lista', () => {
    const { payments, base } = setup();
    const p = payments.create({
      ...base,
      name: 'Matrícula',
      dueDate: '2026-12-01',
      repeat: 'once',
    });
    payments.pay(p?.id ?? '');
    expect(payments.list()).toEqual([]);
  });

  it('rechaza billeteras que no existen y categorías de ingreso', () => {
    const { db, payments, base } = setup();
    const income = categoriesService(db)
      .list()
      .find((c) => c.kind === 'income');
    expect(
      payments.create({ ...base, name: 'X', dueDate: '2026-12-01', walletId: 'no' }),
    ).toBeNull();
    expect(
      payments.create({ ...base, name: 'X', dueDate: '2026-12-01', categoryId: income?.id ?? '' }),
    ).toBeNull();
    expect(payments.pay('no-existe')).toBe(false);
  });
});
