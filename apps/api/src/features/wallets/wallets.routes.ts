import { Hono } from 'hono';
import type { AppEnv } from '../../lib/types';
import { walletsService } from './wallets.service';

export const walletsRoutes = new Hono<AppEnv>().get('/', async (c) =>
  c.json(await walletsService(c.var.db).list(c.var.userId)),
);
