import {
  type CreateCategoryInput,
  createCategorySchema,
  renameCategorySchema,
} from '@finanzas/shared';
import { and, asc, eq, ne, sql } from 'drizzle-orm';
import type { Db } from '../db';
import { categories } from '../schema';

const columns = { id: categories.id, name: categories.name, kind: categories.kind };

export function categoriesService(db: Db) {
  const sameName = (name: string) => eq(sql`lower(${categories.name})`, name.toLowerCase());

  return {
    list() {
      return db.select(columns).from(categories).orderBy(asc(categories.name)).all();
    },

    /**
     * Crea la categoría, o devuelve la que ya existe con el mismo nombre (sin importar
     * mayúsculas) y tipo, para no duplicarla.
     */
    create(raw: CreateCategoryInput) {
      const input = createCategorySchema.parse(raw);
      const existing = db
        .select(columns)
        .from(categories)
        .where(and(eq(categories.kind, input.kind), sameName(input.name)))
        .get();
      if (existing) return existing;
      return db
        .insert(categories)
        .values({ name: input.name, kind: input.kind })
        .returning(columns)
        .get();
    },

    /** Renombra sin chocar con otra del mismo tipo (sin importar mayúsculas). */
    rename(id: string, rawName: string) {
      const { name } = renameCategorySchema.parse({ name: rawName });
      const current = db.select(columns).from(categories).where(eq(categories.id, id)).get();
      if (!current) return 'not-found' as const;
      const clash = db
        .select({ id: categories.id })
        .from(categories)
        .where(and(eq(categories.kind, current.kind), sameName(name), ne(categories.id, id)))
        .get();
      if (clash) return 'duplicate' as const;
      return db
        .update(categories)
        .set({ name })
        .where(eq(categories.id, id))
        .returning(columns)
        .get();
    },

    /** Los movimientos de la categoría quedan sin categoría (on delete set null). */
    remove(id: string) {
      return db.delete(categories).where(eq(categories.id, id)).returning().all().length > 0;
    },
  };
}
