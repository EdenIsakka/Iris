import { describe, expect, it } from 'vitest';
import { amountMinor } from './transaction';

describe('amountMinor', () => {
  it.each(['1', '500000', '999999999999999999'])('acepta %s', (v) => {
    expect(amountMinor.safeParse(v).success).toBe(true);
  });

  it.each(['0', '007', '-5', '1.5', '', '9999999999999999999'])('rechaza %s', (v) => {
    expect(amountMinor.safeParse(v).success).toBe(false);
  });
});
