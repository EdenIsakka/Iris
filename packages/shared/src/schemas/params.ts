import { z } from 'zod';

/** `:id` de la URL: si no es UUID se responde 400 en vez de que Postgres falle con 500. */
export const idParamSchema = z.object({ id: z.uuid() });
