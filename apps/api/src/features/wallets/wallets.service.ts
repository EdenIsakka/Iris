import { type Db, wallets } from '@finanzas/db';
import { asc, eq } from 'drizzle-orm';

export function walletsService(db: Db) {
  return {
    list(userId: string) {
      return db
        .select({ id: wallets.id, name: wallets.name, type: wallets.type })
        .from(wallets)
        .where(eq(wallets.userId, userId))
        .orderBy(asc(wallets.createdAt));
    },
  };
}
