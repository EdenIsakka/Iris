import { createCategorySchema } from '@finanzas/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
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
  });
