import { expo } from '@better-auth/expo';
import {
  accounts,
  createUserDefaults,
  type Db,
  sessions,
  users,
  verifications,
} from '@finanzas/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

export type AuthOptions = { secret: string; baseURL: string; production: boolean };

/** Correo y contraseña con Better Auth (ADR-0006). */
export function createAuth(db: Db, { secret, baseURL, production }: AuthOptions) {
  return betterAuth({
    secret,
    baseURL,
    database: drizzleAdapter(db, {
      provider: 'pg',
      usePlural: true,
      schema: { users, sessions, accounts, verifications },
    }),
    // shortcut: sin verificación de correo porque no hay servidor de correo; activarla al tener uno.
    emailAndPassword: { enabled: true },
    plugins: [expo()],
    trustedOrigins: [
      'finanzas://',
      // Expo Go abre la app desde exp://<ip-del-pc>:8081; solo en desarrollo.
      ...(production ? [] : ['exp://', 'exp://**']),
    ],
    databaseHooks: {
      user: { create: { after: async (user) => void (await createUserDefaults(db, user.id)) } },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
