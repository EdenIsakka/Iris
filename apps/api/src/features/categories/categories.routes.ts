import { createCategorySchema, idParamSchema, renameCategorySchema } from '@finanzas/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { AppEnv } from '../../lib/types';
import { categoriesService } from './categories.service';

export const categoriesRoutes = new Hono<AppEnv>()
  .get('/', async (c) => c.json(await categoriesService(c.var.db).list(c.var.userId)))
  .post('/', zValidator('json', createCategorySchema), async (c) => {
    const { category, created } = await categoriesService(c.var.db).create(
      c.var.userId,
      c.req.valid('json'),
    );
    return c.json(category, created ? 201 : 200);
  })
  .put(
    '/:id',
    zValidator('param', idParamSchema),
    zValidator('json', renameCategorySchema),
    async (c) => {
      const result = await categoriesService(c.var.db).rename(
        c.var.userId,
        c.req.valid('param').id,
        c.req.valid('json').name,
      );
      if (result === 'not-found')
        throw new HTTPException(404, { message: 'Categoría no encontrada' });
      if (result === 'duplicate') {
        throw new HTTPException(409, { message: 'Ya tienes una categoría con ese nombre' });
      }
      return c.json(result, 200);
    },
  )
  // Los movimientos de la categoría quedan sin categoría (FK on delete set null).
  .delete('/:id', zValidator('param', idParamSchema), async (c) => {
    const removed = await categoriesService(c.var.db).remove(c.var.userId, c.req.valid('param').id);
    if (!removed) throw new HTTPException(404, { message: 'Categoría no encontrada' });
    return c.body(null, 204);
  });
