import { describe, expect, it } from 'vitest';
import { testDb } from '../test-db';
import { goalsService } from './goals';

describe('goalsService', () => {
  it('marca la meta cumplida cuando los aportes llegan al monto', () => {
    const goals = goalsService(testDb());
    const { id } = goals.create({ name: 'Viaje', targetMinor: '1000' });
    goals.contribute(id, '600');
    expect(goals.list()[0]).toMatchObject({ savedMinor: 600n, status: 'active' });
    goals.contribute(id, '400');
    expect(goals.list()[0]).toMatchObject({ savedMinor: 1000n, status: 'completed' });
  });

  it('al editar recalcula el estado contra lo ahorrado', () => {
    const goals = goalsService(testDb());
    const { id } = goals.create({ name: 'Viaje', targetMinor: '1000' });
    goals.contribute(id, '1000');
    expect(goals.update(id, { name: 'Viaje', targetMinor: '2000' })?.status).toBe('active');
    expect(goals.update(id, { name: 'Viaje', targetMinor: '500' })?.status).toBe('completed');
  });

  it('borrar la meta se lleva sus aportes; aportar a una que no existe da null', () => {
    const goals = goalsService(testDb());
    const { id } = goals.create({ name: 'Viaje', targetMinor: '1000' });
    goals.contribute(id, '100');
    expect(goals.remove(id)).toBe(true);
    expect(goals.contribute(id, '100')).toBeNull();
  });
});
