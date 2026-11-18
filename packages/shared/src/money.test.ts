import { describe, expect, it } from 'vitest';
import { copToUsd, formatMoney, usdToCop } from './money';
import { toQuantityE8 } from './schemas/investment';

describe('formatMoney', () => {
  it('formatea pesos colombianos sin decimales', () => {
    expect(formatMoney(500000n)).toMatch(/500\.000/);
    expect(formatMoney(500000n)).not.toMatch(/,\d/);
  });

  it('formatea dólares desde centavos con dos decimales', () => {
    expect(formatMoney(123456n, 'USD')).toMatch(/1\.234,56/);
  });
});

describe('conversión con la TRM', () => {
  const trm = 412345n; // 4.123,45 pesos por dólar

  it('pasa dólares a pesos redondeando al peso', () => {
    expect(usdToCop(100n, trm)).toBe(4123n); // 4.123,45 → 4.123
    expect(usdToCop(1000n, trm)).toBe(41235n); // 41.234,5 → 41.235
    expect(usdToCop(-1000n, trm)).toBe(-41235n);
  });

  it('pasa pesos a centavos de dólar', () => {
    expect(copToUsd(4123n, trm)).toBe(100n);
    expect(copToUsd(-41235n, trm)).toBe(-1000n);
  });
});

describe('toQuantityE8', () => {
  it('lee unidades con coma o punto sin perder decimales', () => {
    expect(toQuantityE8('0,0015')).toBe(150_000n);
    expect(toQuantityE8('3')).toBe(300_000_000n);
    expect(toQuantityE8('1.12345678')).toBe(112_345_678n);
  });
});
