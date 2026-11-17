import { sql } from 'drizzle-orm';

// shortcut: zona fija de Colombia (MVP solo COP); pasarla por usuario si se abre a otros países.
export const TZ = 'America/Bogota';

/** Inicio del mes en curso en hora de Colombia, como timestamp. */
export const monthStart = sql`date_trunc('month', now() at time zone ${TZ}) at time zone ${TZ}`;

/** Primer día del mes en curso en hora de Colombia, como date. */
export const currentPeriod = sql<string>`date_trunc('month', now() at time zone ${TZ})::date`;
