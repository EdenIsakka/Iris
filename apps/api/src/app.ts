import type { Db } from '@finanzas/db';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { categoriesRoutes } from './features/categories/categories.routes';
import { goalsRoutes } from './features/goals/goals.routes';
import { healthRoutes } from './features/health/health.routes';
import { transactionsRoutes } from './features/transactions/transactions.routes';
import { walletsRoutes } from './features/wallets/wallets.routes';
import type { AppEnv } from './lib/types';
import { currentUser } from './middleware/current-user';
import { errorHandler } from './middleware/error-handler';

type Deps = { db: Db; corsOrigin: string };

/** Fábrica de la app: recibe dependencias para poder probarla sin servidor real. */
export function createApp({ db, corsOrigin }: Deps) {
  const app = new Hono<AppEnv>()
    .use(logger())
    .use(secureHeaders())
    .use(cors({ origin: corsOrigin, credentials: true }))
    .use(async (c, next) => {
      c.set('db', db);
      await next();
    })
    .route('/health', healthRoutes)
    .use('/v1/*', currentUser)
    .route('/v1/transactions', transactionsRoutes)
    .route('/v1/goals', goalsRoutes)
    .route('/v1/wallets', walletsRoutes)
    .route('/v1/categories', categoriesRoutes);

  app.onError(errorHandler);
  return app;
}

/** Tipo exportado para el cliente RPC de la app móvil (end-to-end type safety). */
export type AppType = ReturnType<typeof createApp>;
