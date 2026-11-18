import { describe, expect, it } from 'vitest';
import { testDb } from '../test-db';
import { transactionsService } from './transactions';
import { walletsService } from './wallets';

describe('walletsService', () => {
  const setup = () => {
    const db = testDb();
    return { wallets: walletsService(db), moves: transactionsService(db) };
  };
  const move = (walletId: string, kind: 'income' | 'expense', amountMinor: string) => ({
    walletId,
    categoryId: null,
    kind,
    amountMinor,
    occurredAt: new Date().toISOString(),
  });

  it('el saldo es el inicial más ingresos menos gastos', () => {
    const { wallets, moves } = setup();
    const { id } = wallets.create({ name: 'Efectivo', type: 'cash', openingBalanceMinor: '50000' });
    moves.create(move(id, 'income', '20000'));
    moves.create(move(id, 'expense', '5000'));
    expect(wallets.list().find((w) => w.id === id)?.balanceMinor).toBe(65000n);
  });

  it('no borra una billetera con movimientos ni la única', () => {
    const { wallets, moves } = setup();
    const [only] = wallets.list();
    expect(wallets.remove(only?.id ?? '')).toBe('last');
    const { id } = wallets.create({ name: 'Efectivo', type: 'cash', openingBalanceMinor: '0' });
    moves.create(move(id, 'expense', '100'));
    expect(wallets.remove(id)).toBe('has-transactions');
  });

  it('edita y borra una billetera vacía', () => {
    const { wallets } = setup();
    const { id } = wallets.create({ name: 'Tarjeta', type: 'card', openingBalanceMinor: '0' });
    expect(wallets.update(id, { name: 'Visa', type: 'card', openingBalanceMinor: '0' })?.name).toBe(
      'Visa',
    );
    expect(wallets.remove(id)).toBe('deleted');
    expect(wallets.remove(id)).toBe('not-found');
  });

  it('la moneda se elige al crear y no cambia al editar', () => {
    const { wallets } = setup();
    const { id, currency } = wallets.create({ name: 'Dólares', type: 'bank', currency: 'USD' });
    expect(currency).toBe('USD');
    expect(wallets.update(id, { name: 'USD', type: 'bank', currency: 'COP' })?.currency).toBe(
      'USD',
    );
  });

  it('rechaza un saldo inicial negativo o de más de 15 dígitos', () => {
    const { wallets } = setup();
    expect(() => wallets.create({ name: 'X', type: 'bank', openingBalanceMinor: '-1' })).toThrow();
    expect(() =>
      wallets.create({ name: 'X', type: 'bank', openingBalanceMinor: '1000000000000000' }),
    ).toThrow();
  });

  it('guarda el monto más grande permitido sin perder precisión', () => {
    const { wallets } = setup();
    const { id } = wallets.create({
      name: 'Grande',
      type: 'bank',
      openingBalanceMinor: '999999999999999',
    });
    expect(wallets.list().find((w) => w.id === id)?.balanceMinor).toBe(999999999999999n);
  });
});
