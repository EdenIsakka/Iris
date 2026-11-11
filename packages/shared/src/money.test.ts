import { describe, expect, it } from 'vitest';
import { formatMoney, toMinor } from './money';

describe('money', () => {
  it('convierte pesos a unidad mínima sin decimales', () => {
    expect(toMinor(500000, 'COP')).toBe(500000n);
  });

  it('convierte dólares a centavos', () => {
    expect(toMinor(12.34, 'USD')).toBe(1234n);
  });

  it('formatea pesos colombianos', () => {
    expect(formatMoney(500000n, 'COP')).toMatch(/500\.000/);
  });
});
