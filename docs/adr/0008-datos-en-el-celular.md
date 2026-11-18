# 8. Los datos viven en el celular

- Estado: aceptada
- Fecha: 2026-11-18
- Reemplaza: [ADR-0003](0003-api-hono-postgres-drizzle.md), [ADR-0006](0006-autenticacion-better-auth.md), [ADR-0007](0007-llaves-de-usuario.md)
- Completa: [ADR-0004](0004-dinero-en-unidad-minima.md)

## Contexto

La app la usan pocas personas, cada una con sus propias cuentas. Con un servidor, alguien tiene que pagarlo o mantenerlo despierto, y las finanzas de todos pasan por él. Queremos que cualquiera la instale y la use sin crear una cuenta.

## Decisión

- **Base:** SQLite dentro del celular con `expo-sqlite`, abierta en modo síncrono. Drizzle (`sqlite-core`) escribe las consultas.
- **Sin servidor ni cuentas:** se borran la API de Hono, Better Auth, Postgres y Docker. Un celular es una persona: las tablas ya no tienen `user_id`.
- **Lógica:** los servicios (billeteras, movimientos, topes, metas, inversiones) viven en `@finanzas/db` y validan su entrada con los esquemas de `@finanzas/shared`. La app los llama desde los hooks de TanStack Query, igual que antes llamaba a la API.
- **Migraciones:** una lista de SQL en `packages/db/src/migrations.ts`, aplicada al abrir la base según `PRAGMA user_version`. La primera crea también la billetera y las categorías por defecto.
- **Dinero (completa ADR-0004):** columna `INTEGER` de SQLite (64 bits) y `bigint` en JS. `expo-sqlite` entrega los enteros como `number`, exacto hasta 2^53, así que los montos se limitan a 15 dígitos (~9 × 10^14).
- **Hora:** los meses se cuentan en hora de Colombia, fija en UTC−5 (no tiene horario de verano).
- **Pruebas:** los servicios se prueban en Node con `sql.js` (SQLite en WebAssembly) en memoria. No hace falta Docker ni `DATABASE_URL`.

## Alternativas descartadas

- Mantener la API en Render + Neon: hosting gratis que se duerme, y datos de otras personas en un servidor nuestro.
- Migraciones con `drizzle-kit` para Expo: necesita importar archivos `.sql` en Metro con un plugin de Babel; la lista a mano es más corta.

## Consecuencias

- Si se pierde el celular o se borra la app, se pierden los datos. Para eso está la copia de seguridad (Resumen → Copia de seguridad): un JSON con todas las tablas que se puede abrir en otro celular.
- No hay sincronización entre dispositivos.
- Las consultas síncronas corren en el hilo de JS; con el volumen de una persona no se nota.
- Una migración nueva se escribe a mano en SQL y debe coincidir con `schema.ts`; las pruebas de los servicios la ejercitan.
