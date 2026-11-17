import {
  contributeToInvestmentSchema,
  createInvestmentSchema,
  idParamSchema,
  investmentPeriodQuery,
  updateInvestmentSchema,
  valueInvestmentSchema,
} from '@finanzas/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { serializeMoney } from '../../lib/serialize';
import type { AppEnv } from '../../lib/types';
import { investmentsService } from './investments.service';

const notFound = () => new HTTPException(404, { message: 'Inversión no encontrada' });

export const investmentsRoutes = new Hono<AppEnv>()
  .get('/', zValidator('query', investmentPeriodQuery), async (c) => {
    const { items, totals } = await investmentsService(c.var.db).list(
      c.var.userId,
      c.req.valid('query').period,
    );
    return c.json({ items: items.map(serializeMoney), totals: serializeMoney(totals) });
  })
  .post('/', zValidator('json', createInvestmentSchema), async (c) => {
    const row = await investmentsService(c.var.db).create(c.var.userId, c.req.valid('json'));
    return c.json(row, 201);
  })
  .put(
    '/:id',
    zValidator('param', idParamSchema),
    zValidator('json', updateInvestmentSchema),
    async (c) => {
      const row = await investmentsService(c.var.db).update(
        c.var.userId,
        c.req.valid('param').id,
        c.req.valid('json'),
      );
      if (!row) throw notFound();
      return c.json(row, 200);
    },
  )
  .delete('/:id', zValidator('param', idParamSchema), async (c) => {
    const removed = await investmentsService(c.var.db).remove(
      c.var.userId,
      c.req.valid('param').id,
    );
    if (!removed) throw notFound();
    return c.body(null, 204);
  })
  .get(
    '/:id/valuations',
    zValidator('param', idParamSchema),
    zValidator('query', investmentPeriodQuery),
    async (c) => {
      const rows = await investmentsService(c.var.db).history(
        c.var.userId,
        c.req.valid('param').id,
        c.req.valid('query').period,
      );
      if (!rows) throw notFound();
      return c.json(rows.map(serializeMoney), 200);
    },
  )
  .post(
    '/:id/valuations',
    zValidator('param', idParamSchema),
    zValidator('json', valueInvestmentSchema),
    async (c) => {
      const ok = await investmentsService(c.var.db).value(
        c.var.userId,
        c.req.valid('param').id,
        c.req.valid('json').valueMinor,
      );
      if (!ok) throw notFound();
      return c.body(null, 201);
    },
  )
  .post(
    '/:id/contributions',
    zValidator('param', idParamSchema),
    zValidator('json', contributeToInvestmentSchema),
    async (c) => {
      const ok = await investmentsService(c.var.db).contribute(
        c.var.userId,
        c.req.valid('param').id,
        c.req.valid('json').amountMinor,
      );
      if (!ok) throw notFound();
      return c.body(null, 201);
    },
  );
