import { describe, expect, it } from 'vitest';
import { testDb } from '../test-db';
import { investmentsService } from './investments';

describe('investmentsService', () => {
  it('el valor de hoy le gana al inicial aunque se guarden en el mismo milisegundo', () => {
    const service = investmentsService(testDb());
    service.create({
      name: 'BTC',
      kind: 'crypto',
      amountMinor: '1000',
      currentValueMinor: '1500',
    });
    expect(service.list('month').items[0]).toMatchObject({
      investedMinor: 1000n,
      valueMinor: 1500n,
      gainMinor: 500n,
    });
  });

  it('con tasa crece solo; cambiar la tasa guarda lo que vale hoy', () => {
    const service = investmentsService(testDb());
    const twoYearsAgo = new Date(Date.now() - 730 * 86_400_000).toISOString().slice(0, 10);
    const { id } = service.create({
      name: 'Cajita Nu',
      kind: 'other',
      amountMinor: '1000000',
      startedAt: twoYearsAgo,
      rateBps: 1000,
    });
    const grown = service.list('month').items[0]?.valueMinor ?? 0n;
    expect(grown).toBeGreaterThan(1_200_000n); // ~1,1² = 1,21
    expect(grown).toBeLessThan(1_220_000n);

    service.update(id, { name: 'Cajita Nu', kind: 'other', rateBps: 900 });
    expect(service.list('month').items[0]).toMatchObject({ rateBps: 900, valueMinor: grown });
    expect(service.history(id, 'week')?.at(-1)?.valueMinor).toBe(grown);

    service.contribute(id, { amountMinor: '100000' });
    expect(service.list('month').items[0]?.valueMinor).toBe(grown + 100_000n);
  });

  it('aportar sube el valor en lo mismo y no cuenta como ganancia', () => {
    const service = investmentsService(testDb());
    const { id } = service.create({ name: 'CDT', kind: 'cdt', amountMinor: '1000' });
    expect(service.value(id, '1100')).toBe(true);
    expect(service.contribute(id, { amountMinor: '500' })).toBe(true);
    expect(service.list('month').totals).toMatchObject({
      investedMinor: 1500n,
      valueMinor: 1600n,
      gainMinor: 100n,
    });
  });

  it('borrar se lleva el historial; las demás operaciones dicen que no existe', () => {
    const service = investmentsService(testDb());
    const { id } = service.create({ name: 'CDT', kind: 'cdt', amountMinor: '1000' });
    expect(service.history(id, 'year')).toHaveLength(1);
    expect(service.remove(id)).toBe(true);
    expect(service.history(id, 'year')).toBeNull();
    expect(service.value(id, '1')).toBe(false);
    expect(service.update(id, { name: 'X', kind: 'cdt' })).toBeNull();
  });
});
