import { eq } from 'drizzle-orm';
import { createDb } from './client';
import { createUserDefaults } from './defaults';
import { categories, goals, wallets } from './schema';

// Datos del usuario de prueba "demo-user", previos al login. Las cuentas reales reciben
// sus datos por defecto al registrarse (createUserDefaults en el hook de Better Auth).
const DEMO_USER = 'demo-user';
const db = createDb(process.env.DATABASE_URL ?? '');

// Reinicia los datos del usuario demo para que correr el seed dos veces no duplique nada.
// Las cascadas borran sus transacciones, aportes y topes.
const wallet = await db.transaction(async (tx) => {
  await tx.delete(wallets).where(eq(wallets.userId, DEMO_USER));
  await tx.delete(categories).where(eq(categories.userId, DEMO_USER));
  await tx.delete(goals).where(eq(goals.userId, DEMO_USER));
  const row = await createUserDefaults(tx, DEMO_USER);
  await tx.insert(goals).values({ userId: DEMO_USER, name: 'Pagar deuda', targetMinor: 500_000n });
  return row;
});

console.log(`Seed listo (datos de ${DEMO_USER} reiniciados). Wallet demo: ${wallet?.id}`);
process.exit(0);
