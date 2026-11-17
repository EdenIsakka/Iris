import { like } from 'drizzle-orm';
import { createDb } from './client';
import { users } from './schema';

// Las cuentas reales reciben sus datos por defecto al registrarse (createUserDefaults en el
// hook de Better Auth). El seed solo limpia los usuarios que deja un test cortado a mitad:
// las llaves en cascada se llevan todos sus datos.
const db = createDb(process.env.DATABASE_URL ?? '');

const removed = await db
  .delete(users)
  .where(like(users.email, 'test-%@example.com'))
  .returning({ id: users.id });

console.log(`Seed listo: ${removed.length} usuarios de prueba borrados.`);
process.exit(0);
