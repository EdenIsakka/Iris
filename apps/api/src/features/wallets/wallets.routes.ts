import { createWalletSchema, idParamSchema } from '@finanzas/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { serializeMoney } from '../../lib/serialize';
import type { AppEnv } from '../../lib/types';
import { walletsService } from './wallets.service';

const notFound = () => new HTTPException(404, { message: 'Billetera no encontrada' });

export const walletsRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const rows = await walletsService(c.var.db).list(c.var.userId);
    return c.json(rows.map(serializeMoney));
  })
  .post('/', zValidator('json', createWalletSchema), async (c) => {
    const row = await walletsService(c.var.db).create(c.var.userId, c.req.valid('json'));
    return c.json(row ? serializeMoney(row) : null, 201);
  })
  .put(
    '/:id',
    zValidator('param', idParamSchema),
    zValidator('json', createWalletSchema),
    async (c) => {
      const row = await walletsService(c.var.db).update(
        c.var.userId,
        c.req.valid('param').id,
        c.req.valid('json'),
      );
      if (!row) throw notFound();
      return c.json(serializeMoney(row), 200);
    },
  )
  .delete('/:id', zValidator('param', idParamSchema), async (c) => {
    const result = await walletsService(c.var.db).remove(c.var.userId, c.req.valid('param').id);
    if (result === 'not-found') throw notFound();
    if (result === 'last') {
      throw new HTTPException(409, { message: 'Necesitas al menos una billetera' });
    }
    if (result === 'has-transactions') {
      throw new HTTPException(409, {
        message: 'Esta billetera tiene movimientos. Bórralos o pásalos a otra billetera primero',
      });
    }
    return c.body(null, 204);
  });
