import { eq } from 'drizzle-orm';
import { createDb } from './client';
import { categories, goals, wallets } from './schema';

const DEMO_USER = 'demo-user';

// shortcut: solo se crean para el usuario demo; con Better Auth habrá que crearlas al registrarse.
const DEFAULT_CATEGORIES = {
  expense: [
    'Mercado',
    'Transporte',
    'Arriendo',
    'Servicios',
    'Salud',
    'Restaurantes',
    'Entretenimiento',
    'Educación',
    'Ropa',
    'Deudas',
    'Otros gastos',
  ],
  income: ['Salario', 'Trabajo extra', 'Ventas', 'Regalos', 'Otros ingresos'],
};
const db = createDb(process.env.DATABASE_URL ?? '');

// Reinicia los datos del usuario demo para que correr el seed dos veces no duplique nada.
// Las cascadas borran sus transacciones, aportes y topes.
const wallet = await db.transaction(async (tx) => {
  await tx.delete(wallets).where(eq(wallets.userId, DEMO_USER));
  await tx.delete(categories).where(eq(categories.userId, DEMO_USER));
  await tx.delete(goals).where(eq(goals.userId, DEMO_USER));

  const [row] = await tx
    .insert(wallets)
    .values({ userId: DEMO_USER, name: 'Cuenta de ahorros', type: 'bank' })
    .returning();

  await tx
    .insert(categories)
    .values(
      (['expense', 'income'] as const).flatMap((kind) =>
        DEFAULT_CATEGORIES[kind].map((name) => ({ userId: DEMO_USER, name, kind })),
      ),
    );

  await tx.insert(goals).values({ userId: DEMO_USER, name: 'Pagar deuda', targetMinor: 500_000n });
  return row;
});

console.log(`Seed listo (datos de ${DEMO_USER} reiniciados). Wallet demo: ${wallet?.id}`);
process.exit(0);
