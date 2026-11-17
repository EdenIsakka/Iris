import { createApiClient } from '@finanzas/api/client';
import { authClient } from './auth-client';

const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

/**
 * Cliente RPC tipado: los tipos vienen directo de las rutas de Hono.
 * React Native no guarda cookies, así que la de sesión se manda a mano.
 */
export const api = createApiClient(baseUrl, {
  headers: async () => ({ cookie: await authClient.getCookie() }),
  init: { credentials: 'omit' },
});
