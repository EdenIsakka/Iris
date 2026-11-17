import { idParamSchema, setBudgetSchema } from '@finanzas/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { serializeMoney } from '../../lib/serialize';
import type { AppEnv } from '../../lib/types';
import { budgetsService } from './budgets.service';

const notFound = () => new HTTPException(404, { message: 'Categoría de gasto no encontrada' });

// El :id de PUT y DELETE es el de la categoría: hay un tope vigente por categoría.
export const budgetsRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const rows = await budgetsService(c.var.db).list(c.var.userId);
    return c.json(rows.map(serializeMoney));
  })
  .put(
    '/:id',
    zValidator('param', idParamSchema),
    zValidator('json', setBudgetSchema),
    async (c) => {
      const row = await budgetsService(c.var.db).set(
        c.var.userId,
        c.req.valid('param').id,
        BigInt(c.req.valid('json').limitMinor),
      );
      if (!row) throw notFound();
      return c.json(serializeMoney(row), 200);
    },
  )
  .delete('/:id', zValidator('param', idParamSchema), async (c) => {
    const removed = await budgetsService(c.var.db).remove(c.var.userId, c.req.valid('param').id);
    if (!removed) throw notFound();
    return c.body(null, 204);
  });
