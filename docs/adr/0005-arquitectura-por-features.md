# 5. Arquitectura por features (vertical slices)

- Estado: aceptada
- Fecha: 2026-11-11

## Contexto

Organizar por tipo técnico (`components/`, `services/`) dispersa una misma funcionalidad en muchas carpetas.

## Decisión

- API: `src/features/<feature>/` con `*.routes.ts` (HTTP) y `*.service.ts` (lógica de negocio, sin HTTP).
- Mobile: `app/` solo contiene rutas delgadas; la lógica vive en `src/features/<feature>/` (`api.ts` con hooks de TanStack Query y `components/`).
- Lo compartido entre features va en `src/lib` o `src/components/ui`; lo compartido entre apps va en `packages/`.

## Consecuencias

- Una feature se entiende, prueba y borra en un solo lugar.
- Una feature no importa archivos internos de otra; si lo necesita, se sube a `lib` o a un paquete.
