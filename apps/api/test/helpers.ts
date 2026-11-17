import { type Db, users } from '@finanzas/db';
import { inArray } from 'drizzle-orm';
import type { createApp } from '../src/app';

export const testAuth = {
  secret: 'secreto-de-prueba-con-mas-de-32-caracteres',
  baseURL: 'http://localhost:3000',
  production: false,
};

type App = ReturnType<typeof createApp>;

/** Registra un usuario nuevo y devuelve su id y un `request` que manda su cookie de sesión. */
export async function signUp(app: App) {
  const res = await app.request('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Test',
      email: `test-${crypto.randomUUID()}@example.com`,
      password: 'contraseña-de-prueba',
    }),
  });
  if (!res.ok) throw new Error(`El registro falló: ${res.status} ${await res.text()}`);
  const { user } = (await res.json()) as { user: { id: string } };
  const cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');
  const request = (path: string, init: RequestInit = {}) =>
    app.request(path, { ...init, headers: { ...(init.headers as object), cookie } });
  return { userId: user.id, request };
}

/** Borra estos usuarios; las llaves en cascada se llevan todos sus datos. */
export async function deleteUsers(db: Db, ids: string[]) {
  await db.delete(users).where(inArray(users.id, ids));
}
