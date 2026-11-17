# Finanzas

Gestor de finanzas personales pensado para el celular: registra ingresos y gastos, fija topes por categoría y crea metas de ahorro con monto.

> Demo: _pendiente_ · APK: _pendiente_

## Stack

| Capa     | Tecnología                                       |
| -------- | ------------------------------------------------ |
| App      | Expo SDK 58, Expo Router, TanStack Query         |
| API      | Hono (RPC tipado), Zod                           |
| Datos    | PostgreSQL, Drizzle ORM                          |
| Monorepo | pnpm workspaces, Turborepo                       |
| Calidad  | TypeScript strict, Biome, Vitest, GitHub Actions |

Las decisiones están documentadas como ADRs en [`docs/adr`](docs/adr).

## Estructura

```
apps/
  api/        API Hono (features: transactions, wallets, categories, budgets, goals, investments)
  mobile/     App Expo (app/ = rutas, src/features = lógica)
packages/
  shared/     Esquemas Zod + utilidades de dinero
  db/         Esquema Drizzle, cliente, seed
  tsconfig/   Configuración TypeScript compartida
docs/adr/     Decisiones de arquitectura
```

## Correr en local

Requisitos: Node 22, pnpm, Docker.

```bash
cp .env.example .env
cp apps/mobile/.env.example apps/mobile/.env   # en un celular físico, pon ahí la IP de tu PC
pnpm install
pnpm db:up && pnpm db:generate && pnpm db:migrate && pnpm db:seed
pnpm dev
```

## Scripts

| Script           | Qué hace                           |
| ---------------- | ---------------------------------- |
| `pnpm dev`       | API + app en modo desarrollo       |
| `pnpm lint`      | Biome (lint + formato)             |
| `pnpm typecheck` | TypeScript en todos los workspaces |
| `pnpm test`      | Pruebas                            |

Los tests contra Postgres (`*.db.test.ts`) se saltan si no hay `DATABASE_URL`. Para incluirlos con la base levantada:

```bash
DATABASE_URL=postgres://finanzas:finanzas@localhost:5433/finanzas pnpm test
```
