import { describe, expect, it } from 'vitest';
import { formatMoney } from './money';

describe('formatMoney', () => {
  it('formatea pesos colombianos sin decimales', () => {
    expect(formatMoney(500000n)).toMatch(/500\.000/);
    expect(formatMoney(500000n)).not.toMatch(/,\d/);
  });
});
