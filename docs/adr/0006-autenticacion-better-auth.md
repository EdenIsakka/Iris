# 6. Autenticación con Better Auth

- Estado: reemplazada por [ADR-0008](0008-datos-en-el-celular.md)
- Fecha: 2026-11-13

## Contexto

Hasta ahora la API usaba un usuario fijo (`demo-user`) y rechazaba todo en producción. Para que varias personas usen la app, cada una debe ver solo sus datos.

## Decisión

- **Better Auth** con correo y contraseña. Sin verificación de correo mientras no haya un servidor de correo.
- **Servidor:** se monta en la API de Hono en `/api/auth/*`. Guarda usuarios, sesiones, cuentas y verificaciones en Postgres con el adaptador de Drizzle (tablas `users`, `sessions`, `accounts`, `verifications`).
- **Middleware:** `currentUser` lee la sesión y deja `userId` en el contexto. Sin sesión, `/v1/*` responde 401.
- **App:** usa el plugin `@better-auth/expo`, que guarda la sesión cifrada con `expo-secure-store`. Como React Native no maneja cookies, el cliente RPC manda la cookie de sesión a mano en cada petición.
- **Cuentas nuevas:** al registrarse, cada una recibe una billetera y las categorías por defecto (`createUserDefaults` en un hook de Better Auth).
- **Datos de prueba:** los datos de `demo-user` no se migran; quedan en la base sin dueño.

## Consecuencias

- Hacen falta las variables `BETTER_AUTH_SECRET` y `BETTER_AUTH_URL` en la API.
- En desarrollo se confía en los orígenes `exp://` de Expo Go; en producción solo en el esquema `finanzas://`.
- Las columnas `user_id` de las tablas de datos no tienen llave foránea a `users`, porque las filas de `demo-user` lo impedirían. Se puede agregar cuando se borren esos datos.
- Iniciar sesión con Google u otros proveedores queda para después: necesita un development build en vez de Expo Go.
