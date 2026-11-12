import { contributeToGoalSchema, createGoalSchema, idParamSchema } from '@finanzas/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { serializeMoney } from '../../lib/serialize';
import type { AppEnv } from '../../lib/types';
import { goalsService } from './goals.service';

export const goalsRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const rows = await goalsService(c.var.db).list(c.var.userId);
    return c.json(rows.map(serializeMoney));
  })
  .post('/', zValidator('json', createGoalSchema), async (c) => {
    const row = await goalsService(c.var.db).create(c.var.userId, c.req.valid('json'));
    return c.json(row ? serializeMoney(row) : null, 201);
  })
  .put(
    '/:id',
    zValidator('param', idParamSchema),
    zValidator('json', createGoalSchema),
    async (c) => {
      const row = await goalsService(c.var.db).update(
        c.var.userId,
        c.req.valid('param').id,
        c.req.valid('json'),
      );
      if (!row) throw new HTTPException(404, { message: 'Meta no encontrada' });
      return c.json(serializeMoney(row), 200);
    },
  )
  .delete('/:id', zValidator('param', idParamSchema), async (c) => {
    const removed = await goalsService(c.var.db).remove(c.var.userId, c.req.valid('param').id);
    if (!removed) throw new HTTPException(404, { message: 'Meta no encontrada' });
    return c.body(null, 204);
  })
  .post(
    '/:id/contributions',
    zValidator('param', idParamSchema),
    zValidator('json', contributeToGoalSchema),
    async (c) => {
      const row = await goalsService(c.var.db).contribute(
        c.var.userId,
        c.req.valid('param').id,
        c.req.valid('json').amountMinor,
      );
      if (!row) throw new HTTPException(404, { message: 'Meta no encontrada' });
      return c.json(serializeMoney(row), 201);
    },
  );
