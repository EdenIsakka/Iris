import type { Db } from './client';
import { categories, wallets } from './schema';

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

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/** Billetera y categorías con las que arranca toda cuenta nueva. */
export async function createUserDefaults(db: Db | Tx, userId: string) {
  const [wallet] = await db
    .insert(wallets)
    .values({ userId, name: 'Cuenta de ahorros', type: 'bank' })
    .returning();
  await db
    .insert(categories)
    .values(
      (['expense', 'income'] as const).flatMap((kind) =>
        DEFAULT_CATEGORIES[kind].map((name) => ({ userId, name, kind })),
      ),
    );
  return wallet;
}
