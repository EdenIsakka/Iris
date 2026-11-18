import { drizzleConfig, migrate } from '@finanzas/db';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

/** La base de este celular (ADR-0008). Se migra al importarla, antes de la primera consulta. */
export const db = drizzle(openDatabaseSync('finanzas.db'), drizzleConfig);
migrate(db);
