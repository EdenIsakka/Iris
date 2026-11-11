import { createTransactionSchema } from '@finanzas/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { serializeMoney } from '../../lib/serialize';
import type { AppEnv } from '../../lib/types';
import { transactionsService } from './transactions.service';

export const transactionsRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const rows = await transactionsService(c.var.db).list(c.var.userId);
    return c.json(rows.map(serializeMoney));
  })
  .get('/summary', async (c) => {
    const s = await transactionsService(c.var.db).monthSummary(c.var.userId);
    return c.json({ ...serializeMoney(s), byCategory: s.byCategory.map(serializeMoney) });
  })
  .post('/', zValidator('json', createTransactionSchema), async (c) => {
    const row = await transactionsService(c.var.db).create(c.var.userId, c.req.valid('json'));
    if (!row) throw new HTTPException(404, { message: 'Billetera o categoría no encontrada' });
    return c.json(serializeMoney(row), 201);
  })
  .delete('/:id', async (c) => {
    await transactionsService(c.var.db).remove(c.var.userId, c.req.param('id'));
    return c.body(null, 204);
  });
