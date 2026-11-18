import { describe, expect, it } from 'vitest';
import { testDb } from '../test-db';
import { parseRate, trmService } from './trm';

const reply = (body: unknown) => async () => new Response(JSON.stringify(body));

describe('trmService', () => {
  it('guarda la TRM en centavos con su fecha', async () => {
    const service = trmService(
      testDb(),
      reply([{ valor: '4123.45', vigenciadesde: '2026-11-18T00:00:00.000' }]),
    );
    expect(await service.refresh()).toEqual({ date: '2026-11-18', rateMinor: 412345n });
  });

  it('sin red o con datos raros se queda con la última guardada', async () => {
    const db = testDb();
    await trmService(db, reply([{ valor: '4000', vigenciadesde: '2026-11-17' }])).refresh();
    const offline = trmService(db, async () => {
      throw new Error('sin red');
    });
    expect(await offline.refresh()).toEqual({ date: '2026-11-17', rateMinor: 400000n });
    const weird = trmService(db, reply([{ valor: 'abc', vigenciadesde: '2026-11-18' }]));
    expect((await weird.refresh())?.date).toBe('2026-11-17');
  });

  it('null si nunca se pudo traer', async () => {
    expect(await trmService(testDb(), reply({ error: true })).refresh()).toBeNull();
  });

  it('lee el valor sin pasar por decimales', () => {
    expect(parseRate('4123.4')).toBe(412340n);
    expect(parseRate('4123.456')).toBe(412345n);
    expect(parseRate('-1')).toBeNull();
    expect(parseRate(4000)).toBeNull();
  });
});
