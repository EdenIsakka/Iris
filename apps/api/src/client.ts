import { type ClientRequestOptions, hc } from 'hono/client';
import type { AppType } from './app';

/** Cliente tipado que consume la app móvil: `createApiClient(url).v1.goals.$get()`. */
export const createApiClient = (baseUrl: string, options?: ClientRequestOptions) =>
  hc<AppType>(baseUrl, options);

export type { AppType };
