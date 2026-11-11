import { createApiClient } from '@finanzas/api/client';

const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

/** Cliente RPC tipado: los tipos vienen directo de las rutas de Hono. */
export const api = createApiClient(baseUrl);
