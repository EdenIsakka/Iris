import { describe, expect, it } from 'vitest';
import { testDb } from '../test-db';
import { parseRate, trmService } from './trm';

const reply = (body: unknown) => async () => new Response(JSON.stringify(body));
// 18 de nov, 9 p. m. en Bogotá (ya es 19 en UTC).
const NOW = new Date('2026-11-19T02:00:00Z');

describe('trmService', () => {
  it('guarda la TRM en centavos con su fecha', async () => {
    const service = trmService(
      testDb(),
      reply([{ valor: '4123.45', vigenciadesde: '2026-11-18T00:00:00.000' }]),
    );
    expect(await service.refresh(NOW)).toEqual({ date: '2026-11-18', rateMinor: 412345n });
  });

  it('sin red o con datos raros se queda con la última guardada', async () => {
    const db = testDb();
    await trmService(db, reply([{ valor: '4000', vigenciadesde: '2026-11-17' }])).refresh(NOW);
    const offline = trmService(db, async () => {
      throw new Error('sin red');
    });
    expect(await offline.refresh(NOW)).toEqual({ date: '2026-11-17', rateMinor: 400000n });
    const weird = trmService(db, reply([{ valor: 'abc', vigenciadesde: '2026-11-18' }]));
    expect((await weird.refresh(NOW))?.date).toBe('2026-11-17');
  });

  it('pide y usa la TRM vigente hoy, no la publicada para mañana', async () => {
    const db = testDb();
    let asked = '';
    await trmService(db, async (url) => {
      asked = decodeURIComponent(url);
      return new Response(JSON.stringify([{ valor: '4100', vigenciadesde: '2026-11-19' }]));
    }).refresh(NOW);
    expect(asked).toContain("vigenciadesde <= '2026-11-18T00:00:00'");
    // Una de mañana guardada (p. ej. por una versión anterior) no cuenta hasta su día.
    await trmService(db, reply([{ valor: '4000', vigenciadesde: '2026-11-18' }])).refresh(NOW);
    expect(trmService(db).latest(NOW)?.rateMinor).toBe(400000n);
    expect(trmService(db).latest(new Date('2026-11-19T06:00:00Z'))?.rateMinor).toBe(410000n);
  });

  it('null si nunca se pudo traer', async () => {
    expect(await trmService(testDb(), reply({ error: true })).refresh(NOW)).toBeNull();
  });

  it('lee el valor sin pasar por decimales', () => {
    expect(parseRate('4123.4')).toBe(412340n);
    expect(parseRate('4123.456')).toBe(412345n);
    expect(parseRate('-1')).toBeNull();
    expect(parseRate(4000)).toBeNull();
  });
});
