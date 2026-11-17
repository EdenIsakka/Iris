import type { Db } from '@finanzas/db';
import type { Auth } from '../auth';

export type AppEnv = {
  Variables: {
    db: Db;
    auth: Auth;
    userId: string;
  };
};
