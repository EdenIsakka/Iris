# AGENTS.md

Contexto para agentes de IA (Claude, Orca, etc.) que trabajen en este repo.

## Proyecto

Gestor de finanzas personales mobile-first. Los datos viven en el celular, sin servidor ni cuentas (`docs/adr/0008`). Monorepo pnpm + Turborepo.

- `apps/mobile`: Expo SDK 58 + Expo Router + TanStack Query + `expo-sqlite`.
- `packages/db`: esquema Drizzle de SQLite, migraciones y servicios (billeteras, movimientos, topes, metas, inversiones).
- `packages/shared`: esquemas Zod y utilidades de dinero.

## Reglas

1. Dinero: siempre `bigint` en unidad mínima (`*_minor`), hasta 15 dígitos. Nunca `number` para montos. Ver `docs/adr/0004` y `0008`.
2. Arquitectura por features (`docs/adr/0005`). Rutas en `app/` delgadas; hooks y UI en `src/features`; la lógica de datos en los servicios de `@finanzas/db`.
3. Validación: los servicios pasan toda entrada por un esquema de `@finanzas/shared`.
4. Una migración nueva se agrega al final de `packages/db/src/migrations.ts` (nunca se edita una que ya salió) y debe coincidir con `schema.ts`.
5. Antes de terminar: `pnpm lint && pnpm typecheck && pnpm test`. Las pruebas usan SQLite en memoria (`sql.js`); no necesitan nada levantado.
6. Commits con Conventional Commits; una decisión de arquitectura nueva = un ADR nuevo en `docs/adr`.

## Pendiente

- Exportar e importar una copia de los datos (si se pierde el celular, se pierden).
- Tocar una barra de la gráfica mensual para ver los montos exactos.
