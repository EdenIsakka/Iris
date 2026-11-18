import { describe, expect, it } from 'vitest';
import { investmentStats, periodStart } from './investment-stats';

const day = (d: string) => new Date(`${d}T12:00:00Z`);

describe('investmentStats', () => {
  const contributions = [
    { amountMinor: 1_000_000n, occurredAt: day('2026-01-10') },
    { amountMinor: 500_000n, occurredAt: day('2026-11-10') },
  ];
  const valuations = [
    { valueMinor: 1_000_000n, occurredAt: day('2026-01-10') },
    { valueMinor: 1_200_000n, occurredAt: day('2026-10-01') },
    { valueMinor: 1_700_000n, occurredAt: day('2026-11-10') },
    { valueMinor: 1_800_000n, occurredAt: day('2026-11-15') },
  ];

  it('no cuenta lo aportado en el periodo como ganancia', () => {
    const s = investmentStats(contributions, valuations, day('2026-10-17'));
    expect(s).toEqual({
      investedMinor: 1_500_000n,
      valueMinor: 1_800_000n,
      gainMinor: 300_000n,
      periodGainMinor: 100_000n, // 1.800.000 - 1.200.000 - 500.000
      periodBaseMinor: 1_700_000n,
    });
  });

  it('una inversión creada dentro del periodo parte de cero', () => {
    const s = investmentStats(contributions, valuations, day('2025-11-17'));
    expect(s.periodGainMinor).toBe(300_000n);
    expect(s.periodBaseMinor).toBe(1_500_000n);
  });

  it('sin movimientos todo es cero', () => {
    expect(investmentStats([], [], day('2026-11-10')).periodBaseMinor).toBe(0n);
  });
});

describe('periodStart', () => {
  const now = day('2026-03-31');
  it('resta una semana, un mes o un año', () => {
    expect(periodStart('week', now).toISOString().slice(0, 10)).toBe('2026-03-24');
    expect(periodStart('year', now).toISOString().slice(0, 10)).toBe('2025-03-31');
  });

  it('a fin de mes no se pasa al mes siguiente', () => {
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    expect(iso(periodStart('month', now))).toBe('2026-02-28');
    expect(iso(periodStart('month', day('2028-03-31')))).toBe('2028-02-29');
    expect(iso(periodStart('month', day('2026-05-31')))).toBe('2026-04-30');
    expect(iso(periodStart('year', day('2028-02-29')))).toBe('2027-02-28');
    expect(iso(periodStart('month', day('2026-01-15')))).toBe('2025-12-15');
  });
});
