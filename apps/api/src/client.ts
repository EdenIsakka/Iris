import { hc } from 'hono/client';
import type { AppType } from './app';

/** Cliente tipado que consume la app móvil: `createApiClient(url).v1.goals.$get()`. */
export const createApiClient = (baseUrl: string, init?: RequestInit) =>
  hc<AppType>(baseUrl, { init: { credentials: 'include', ...init } });

export type { AppType };
