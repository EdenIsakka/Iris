import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import type { AppEnv } from '../lib/types';

/** Exige una sesión de Better Auth y deja el id del usuario en `c.var.userId`. */
export const currentUser = createMiddleware<AppEnv>(async (c, next) => {
  const session = await c.var.auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) throw new HTTPException(401, { message: 'Inicia sesión para continuar' });
  c.set('userId', session.user.id);
  await next();
});
