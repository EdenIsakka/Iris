import { describe, expect, it } from 'vitest';
import { testDb } from '../test-db';
import { backupService } from './backup';
import { investmentsService } from './investments';
import { transactionsService } from './transactions';
import { walletsService } from './wallets';

function withData() {
  const db = testDb();
  const wallet = walletsService(db).create({
    name: 'Dólares',
    type: 'bank',
    currency: 'USD',
    openingBalanceMinor: '999999999999999',
  });
  transactionsService(db).create({
    walletId: wallet.id,
    categoryId: null,
    kind: 'expense',
    amountMinor: '1234',
    occurredAt: '2026-11-10T12:00:00Z',
    note: 'café',
  });
  investmentsService(db).create({
    name: 'Bitcoin',
    kind: 'crypto',
    amountMinor: '100',
    symbol: 'BTC',
    quantity: '0,001',
  });
  return db;
}

describe('backupService', () => {
  it('lo exportado se importa igual en otro celular, pasando por JSON', () => {
    const source = withData();
    const copy = JSON.parse(JSON.stringify(backupService(source).exportData()));
    const target = testDb();
    backupService(target).importData(copy);
    expect(backupService(target).exportData().tables).toEqual(
      backupService(source).exportData().tables,
    );
    expect(
      walletsService(target)
        .list()
        .find((w) => w.currency === 'USD')?.balanceMinor,
    ).toBe(999999999999999n - 1234n);
  });

  it('rechaza archivos raros o de una versión más nueva sin tocar los datos', () => {
    const db = withData();
    const backup = backupService(db);
    const before = backup.exportData().tables;
    const good = backup.exportData();
    expect(() => backup.importData({ hola: 1 })).toThrow('no es una copia');
    expect(() => backup.importData({ ...good, version: 999 })).toThrow('más nueva');
    const injected = { ...good, tables: { wallets: [{ 'id) values (1); drop table x; --': 1 }] } };
    expect(() => backup.importData(injected)).toThrow('no es una copia');
    // La app lee los montos con BigInt: un decimal la rompería después de cargar.
    const wallets = good.tables.wallets?.map((w) => ({ ...w, opening_balance_minor: 1.5 }));
    const decimal = { ...good, tables: { ...good.tables, wallets } };
    expect(() => backup.importData(decimal)).toThrow('no es una copia');
    // Una transacción apunta a una billetera que no está: falla a mitad y se deshace.
    const broken = { ...good, tables: { ...good.tables, wallets: [] } };
    expect(() => backup.importData(broken)).toThrow('no es una copia');
    expect(backup.exportData().tables).toEqual(before);
  });
});
