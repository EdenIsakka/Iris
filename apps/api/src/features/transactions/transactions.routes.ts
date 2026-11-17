import { createTransactionSchema, idParamSchema, transactionsPageQuery } from '@finanzas/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { serializeMoney } from '../../lib/serialize';
import type { AppEnv } from '../../lib/types';
import { transactionsService } from './transactions.service';

export const transactionsRoutes = new Hono<AppEnv>()
  .get('/', zValidator('query', transactionsPageQuery), async (c) => {
    const rows = await transactionsService(c.var.db).list(c.var.userId, c.req.valid('query'));
    return c.json(rows.map(serializeMoney));
  })
  .get('/summary', async (c) => {
    const s = await transactionsService(c.var.db).monthSummary(c.var.userId);
    return c.json({ ...serializeMoney(s), byCategory: s.byCategory.map(serializeMoney) });
  })
  .get('/monthly', async (c) => {
    const rows = await transactionsService(c.var.db).monthly(c.var.userId);
    return c.json(rows.map(serializeMoney));
  })
  // Después de /summary y /monthly para que no se lean como un :id.
  .get('/:id', zValidator('param', idParamSchema), async (c) => {
    const row = await transactionsService(c.var.db).get(c.var.userId, c.req.valid('param').id);
    if (!row) throw new HTTPException(404, { message: 'Movimiento no encontrado' });
    return c.json(serializeMoney(row), 200);
  })
  .post('/', zValidator('json', createTransactionSchema), async (c) => {
    const row = await transactionsService(c.var.db).create(c.var.userId, c.req.valid('json'));
    if (!row) throw new HTTPException(404, { message: 'Billetera o categoría no encontrada' });
    return c.json(serializeMoney(row), 201);
  })
  .put(
    '/:id',
    zValidator('param', idParamSchema),
    zValidator('json', createTransactionSchema),
    async (c) => {
      const row = await transactionsService(c.var.db).update(
        c.var.userId,
        c.req.valid('param').id,
        c.req.valid('json'),
      );
      if (!row) throw new HTTPException(404, { message: 'Movimiento no encontrado' });
      return c.json(serializeMoney(row), 200);
    },
  )
  .delete('/:id', zValidator('param', idParamSchema), async (c) => {
    const removed = await transactionsService(c.var.db).remove(
      c.var.userId,
      c.req.valid('param').id,
    );
    if (!removed) throw new HTTPException(404, { message: 'Movimiento no encontrado' });
    return c.body(null, 204);
  });
