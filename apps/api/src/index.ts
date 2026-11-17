import { createDb } from '@finanzas/db';
import { serve } from '@hono/node-server';
import { createApp } from './app';
import { parseEnv } from './env';

const env = parseEnv(process.env);
const app = createApp({
  db: createDb(env.DATABASE_URL),
  corsOrigin: env.CORS_ORIGIN,
  auth: {
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    production: env.NODE_ENV === 'production',
  },
});

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`API escuchando en http://localhost:${info.port}`);
});
