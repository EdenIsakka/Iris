# 3. API propia con Hono, PostgreSQL y Drizzle

- Estado: reemplazada por [ADR-0008](0008-datos-en-el-celular.md)
- Fecha: 2026-11-11

## Contexto

El proyecto es portafolio full stack: el backend debe ser código propio y visible.

## Decisión

API REST en Hono con cliente RPC (`hc`) para tipos de punta a punta, validación con Zod, PostgreSQL como base de datos y Drizzle ORM con migraciones versionadas. Autenticación con Better Auth (pendiente de integrar).

## Alternativas descartadas

- Supabase: más rápido de arrancar, pero con poco backend propio que mostrar.

## Consecuencias

- Más responsabilidad: seguridad, despliegue y migraciones son nuestras.
- Drizzle 1.0 sigue en beta; usamos 0.45 y migramos cuando sea estable.
