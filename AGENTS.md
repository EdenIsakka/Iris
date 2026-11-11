# AGENTS.md

Contexto para agentes de IA (Claude, Orca, etc.) que trabajen en este repo.

## Proyecto

Gestor de finanzas personales mobile-first. Monorepo pnpm + Turborepo.

- `apps/mobile`: Expo SDK 58 + Expo Router + TanStack Query.
- `apps/api`: Hono + Zod + Drizzle sobre PostgreSQL.
- `packages/shared`: esquemas Zod y utilidades de dinero usadas por app y API.
- `packages/db`: esquema Drizzle, cliente y seed.

## Reglas

1. Dinero: siempre `bigint` en unidad mínima (`*_minor`); en JSON como string. Nunca `number` para montos. Ver `docs/adr/0004`.
2. Arquitectura por features (`docs/adr/0005`). Rutas en `app/` delgadas; lógica en `src/features`.
3. Validación: todo input de la API pasa por un esquema de `@finanzas/shared`.
4. Toda consulta filtra por `userId`.
5. Antes de terminar: `pnpm lint && pnpm typecheck && pnpm test`. Los tests `*.db.test.ts` se saltan sin `DATABASE_URL`; con la base levantada, córrelos con `DATABASE_URL=postgres://finanzas:finanzas@localhost:5433/finanzas pnpm test`. Si un test se corta a mitad, `pnpm db:seed` limpia los datos que dejó.
6. Commits con Conventional Commits; una decisión de arquitectura nueva = un ADR nuevo en `docs/adr`.

## Pendiente

- Integrar Better Auth (reemplaza `apps/api/src/middleware/current-user.ts`).
- NativeWind y Victory Native en la app.
