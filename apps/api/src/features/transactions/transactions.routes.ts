import { createTransactionSchema } from '@finanzas/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { serializeMoney } from '../../lib/serialize';
import type { AppEnv } from '../../lib/types';
import { transactionsService } from './transactions.service';

export const transactionsRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const rows = await transactionsService(c.var.db).list(c.var.userId);
    return c.json(rows.map(serializeMoney));
  })
  .post('/', zValidator('json', createTransactionSchema), async (c) => {
    const row = await transactionsService(c.var.db).create(c.var.userId, c.req.valid('json'));
    return c.json(row ? serializeMoney(row) : null, 201);
  })
  .delete('/:id', async (c) => {
    await transactionsService(c.var.db).remove(c.var.userId, c.req.param('id'));
    return c.body(null, 204);
  });
