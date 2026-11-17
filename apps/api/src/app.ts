import type { Db } from '@finanzas/db';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { type AuthOptions, createAuth } from './auth';
import { categoriesRoutes } from './features/categories/categories.routes';
import { goalsRoutes } from './features/goals/goals.routes';
import { healthRoutes } from './features/health/health.routes';
import { investmentsRoutes } from './features/investments/investments.routes';
import { transactionsRoutes } from './features/transactions/transactions.routes';
import { walletsRoutes } from './features/wallets/wallets.routes';
import type { AppEnv } from './lib/types';
import { currentUser } from './middleware/current-user';
import { errorHandler } from './middleware/error-handler';

type Deps = { db: Db; corsOrigin: string; auth: AuthOptions };

/** Fábrica de la app: recibe dependencias para poder probarla sin servidor real. */
export function createApp({ db, corsOrigin, auth: authOptions }: Deps) {
  const auth = createAuth(db, authOptions);
  const app = new Hono<AppEnv>()
    .use(logger())
    .use(secureHeaders())
    .use(cors({ origin: corsOrigin, credentials: true }))
    .use(async (c, next) => {
      c.set('db', db);
      c.set('auth', auth);
      await next();
    })
    .route('/health', healthRoutes)
    .on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw))
    .use('/v1/*', currentUser)
    .route('/v1/transactions', transactionsRoutes)
    .route('/v1/goals', goalsRoutes)
    .route('/v1/investments', investmentsRoutes)
    .route('/v1/wallets', walletsRoutes)
    .route('/v1/categories', categoriesRoutes);

  app.onError(errorHandler);
  return app;
}

/** Tipo exportado para el cliente RPC de la app móvil (end-to-end type safety). */
export type AppType = ReturnType<typeof createApp>;
