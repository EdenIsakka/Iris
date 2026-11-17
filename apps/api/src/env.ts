import { z } from 'zod';

/** Falla al arrancar si falta una variable: mejor un error claro que un bug en producción. */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.url(),
  CORS_ORIGIN: z.string().default('http://localhost:8081'),
  BETTER_AUTH_SECRET: z.string().min(32, 'Usa al menos 32 caracteres aleatorios'),
  BETTER_AUTH_URL: z.url(),
});

export type Env = z.infer<typeof envSchema>;
export const parseEnv = (raw: NodeJS.ProcessEnv): Env => envSchema.parse(raw);
