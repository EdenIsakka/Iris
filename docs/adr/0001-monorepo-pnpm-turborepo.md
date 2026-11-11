# 1. Monorepo con pnpm workspaces y Turborepo

- Estado: aceptada
- Fecha: 2026-11-11

## Contexto

La app móvil y la API comparten tipos, validaciones y reglas de dinero. Mantenerlos en repos separados obliga a publicar paquetes o duplicar código.

## Decisión

Un solo repositorio con `apps/` (mobile, api) y `packages/` (shared, db, tsconfig), gestionado con pnpm workspaces y orquestado con Turborepo.

## Consecuencias

- Un PR puede cambiar API y app a la vez con tipos verificados.
- Turborepo cachea lint, typecheck, test y build.
- Hay que respetar fronteras: una app importa paquetes por nombre, nunca por ruta relativa.
