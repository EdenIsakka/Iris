import { createDb } from './client';
import { categories, goals, wallets } from './schema';

const DEMO_USER = 'demo-user';
const db = createDb(process.env.DATABASE_URL ?? '');

const [wallet] = await db
  .insert(wallets)
  .values({ userId: DEMO_USER, name: 'Cuenta de ahorros', type: 'bank' })
  .returning();

await db.insert(categories).values([
  { userId: DEMO_USER, name: 'Salario', kind: 'income' },
  { userId: DEMO_USER, name: 'Mercado', kind: 'expense' },
  { userId: DEMO_USER, name: 'Transporte', kind: 'expense' },
]);

await db.insert(goals).values({ userId: DEMO_USER, name: 'Pagar deuda', targetMinor: 500_000n });

console.log(`Seed listo. Wallet demo: ${wallet?.id}`);
process.exit(0);
