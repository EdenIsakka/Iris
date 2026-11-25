import { describe, expect, it } from 'vitest';
import { testDb } from '../test-db';
import { backupService } from './backup';
import { transactionsService } from './transactions';
import { transfersService } from './transfers';
import { walletsService } from './wallets';

const NOW = new Date('2026-11-20T15:00:00Z');

function setup() {
  const db = testDb();
  const wallets = walletsService(db);
  const bank = wallets.create({ name: 'Banco', type: 'bank', openingBalanceMinor: '100000' });
  const cash = wallets.create({ name: 'Efectivo', type: 'cash', openingBalanceMinor: '0' });
  const usd = wallets.create({
    name: 'Dólares',
    type: 'bank',
    currency: 'USD',
    openingBalanceMinor: '0',
  });
  return { db, wallets, transfers: transfersService(db), bank, cash, usd };
}

const move = (fromWalletId: string, toWalletId: string, amountMinor: string, to?: string) => ({
  fromWalletId,
  toWalletId,
  amountMinor,
  toAmountMinor: to,
  occurredAt: NOW.toISOString(),
});

const balance = (s: ReturnType<typeof setup>, id: string) =>
  s.wallets.list().find((w) => w.id === id)?.balanceMinor;

describe('transfersService', () => {
  it('saca de una billetera y mete en la otra', () => {
    const s = setup();
    s.transfers.create(move(s.bank.id, s.cash.id, '30000'));
    expect(balance(s, s.bank.id)).toBe(70000n);
    expect(balance(s, s.cash.id)).toBe(30000n);
  });

  it('entre monedas llega lo que se dice, y sin ese dato no se guarda', () => {
    const s = setup();
    expect(s.transfers.create(move(s.bank.id, s.usd.id, '40000'))).toBeNull();
    s.transfers.create(move(s.bank.id, s.usd.id, '40000', '1000'));
    expect(balance(s, s.bank.id)).toBe(60000n);
    expect(balance(s, s.usd.id)).toBe(1000n);
  });

  it('no es ingreso ni gasto: el resumen del mes no cambia', () => {
    const s = setup();
    transactionsService(s.db).create({
      walletId: s.bank.id,
      categoryId: null,
      kind: 'expense',
      amountMinor: '500',
      occurredAt: NOW.toISOString(),
    });
    s.transfers.create(move(s.bank.id, s.cash.id, '30000'));
    const summary = transactionsService(s.db).monthSummary(NOW);
    expect(summary.incomeMinor).toBe(0n);
    expect(summary.expenseMinor).toBe(500n);
    // Con movimientos y transferencias a la vez, cada uno cuenta una sola vez.
    expect(balance(s, s.bank.id)).toBe(69500n);
  });

  it('rechaza la misma billetera y no deja borrar una billetera con transferencias', () => {
    const s = setup();
    expect(() => s.transfers.create(move(s.bank.id, s.bank.id, '1'))).toThrow();
    const t = s.transfers.create(move(s.bank.id, s.cash.id, '1'));
    expect(s.wallets.remove(s.cash.id)).toBe('has-transactions');
    expect(s.transfers.remove(t?.id ?? '')).toBe(true);
    expect(s.wallets.remove(s.cash.id)).toBe('deleted');
  });

  it('las del mes y la copia de seguridad las incluyen', () => {
    const s = setup();
    s.transfers.create(move(s.bank.id, s.cash.id, '30000'));
    expect(s.transfers.month(0, NOW)).toHaveLength(1);
    expect(s.transfers.month(1, NOW)).toHaveLength(0);
    const copy = JSON.parse(JSON.stringify(backupService(s.db).exportData()));
    const target = testDb();
    backupService(target).importData(copy);
    expect(transfersService(target).month(0, NOW)).toHaveLength(1);
  });
});
