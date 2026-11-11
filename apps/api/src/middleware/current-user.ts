import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import type { AppEnv } from '../lib/types';

/**
 * Placeholder hasta integrar Better Auth (ver docs/adr y AGENTS.md).
 * En desarrollo usa un usuario demo; en producción rechaza todo.
 */
export const currentUser = createMiddleware<AppEnv>(async (c, next) => {
  if (process.env.NODE_ENV === 'production') {
    throw new HTTPException(401, { message: 'Autenticación no configurada' });
  }
  c.set('userId', 'demo-user');
  await next();
});
