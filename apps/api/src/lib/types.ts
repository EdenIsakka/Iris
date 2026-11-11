import type { Db } from '@finanzas/db';

export type AppEnv = {
  Variables: {
    db: Db;
    userId: string;
  };
};
