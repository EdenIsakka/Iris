# 7. Llaves foráneas de `user_id` a `users`

- Estado: aceptada
- Fecha: 2026-11-17
- Completa: [ADR-0006](0006-autenticacion-better-auth.md)

## Contexto

El ADR-0006 dejó las columnas `user_id` sin llave foránea porque las filas de `demo-user` no tenían usuario. Sin la llave, la base acepta datos de un usuario que no existe, y borrar una cuenta deja sus datos huérfanos.

## Decisión

- `wallets`, `categories`, `transactions`, `budgets`, `goals` e `investments` referencian `users.id` con `ON DELETE CASCADE`: borrar un usuario borra todos sus datos.
- La migración `0004_user_fk` borra primero las filas sin usuario (los datos de `demo-user` y restos de tests), que nadie podía ver.
- `transactions.wallet_id` pasa de `RESTRICT` a `NO ACTION`. Las dos impiden borrar una billetera con movimientos, pero `RESTRICT` revisa en el momento y frenaría la cascada desde `users`; `NO ACTION` revisa al final de la sentencia, cuando los movimientos ya se borraron.
- Índice en `transactions.wallet_id`: Postgres no indexa las llaves foráneas y el saldo de billeteras une por esa columna.
- El seed ya no crea `demo-user`; solo borra los usuarios de prueba (`test-…@example.com`) que deja un test cortado a mitad.

## Consecuencias

- Los tests crean usuarios reales con `signUp` en vez de ids inventados, y limpian borrando el usuario.
- Borrar la cuenta desde la app queda pendiente; cuando exista, la base ya se encarga de los datos.
