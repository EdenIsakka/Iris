import { categories, type Db } from '@finanzas/db';
import type { CreateCategoryInput } from '@finanzas/shared';
import { and, asc, eq, ne, sql } from 'drizzle-orm';

const columns = { id: categories.id, name: categories.name, kind: categories.kind };

export function categoriesService(db: Db) {
  return {
    list(userId: string) {
      return db
        .select(columns)
        .from(categories)
        .where(eq(categories.userId, userId))
        .orderBy(asc(categories.name));
    },

    /**
     * Crea la categoría, o devuelve la que ya existe con el mismo nombre (sin importar
     * mayúsculas) y tipo, para no duplicarla.
     * shortcut: revisar-y-luego-insertar no es atómico; con varios clientes del mismo usuario
     * a la vez, pasar a un índice único sobre (user_id, kind, lower(name)).
     */
    async create(userId: string, input: CreateCategoryInput) {
      const [existing] = await db
        .select(columns)
        .from(categories)
        .where(
          and(
            eq(categories.userId, userId),
            eq(categories.kind, input.kind),
            eq(sql`lower(${categories.name})`, input.name.toLowerCase()),
          ),
        );
      if (existing) return { category: existing, created: false };
      const [category] = await db
        .insert(categories)
        .values({ userId, name: input.name, kind: input.kind })
        .returning(columns);
      return { category, created: true };
    },

    /** Renombra sin chocar con otra del mismo tipo (sin importar mayúsculas). */
    async rename(userId: string, id: string, name: string) {
      const [current] = await db
        .select(columns)
        .from(categories)
        .where(and(eq(categories.id, id), eq(categories.userId, userId)));
      if (!current) return 'not-found' as const;
      const [clash] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(
          and(
            eq(categories.userId, userId),
            eq(categories.kind, current.kind),
            eq(sql`lower(${categories.name})`, name.toLowerCase()),
            ne(categories.id, id),
          ),
        );
      if (clash) return 'duplicate' as const;
      const [row] = await db
        .update(categories)
        .set({ name })
        .where(eq(categories.id, id))
        .returning(columns);
      return row ?? ('not-found' as const);
    },

    async remove(userId: string, id: string) {
      const rows = await db
        .delete(categories)
        .where(and(eq(categories.id, id), eq(categories.userId, userId)))
        .returning({ id: categories.id });
      return rows.length > 0;
    },
  };
}
