# 4. Dinero como entero en unidad mínima

- Estado: aceptada
- Fecha: 2026-11-11

## Contexto

`0.1 + 0.2 !== 0.3` en JavaScript. Un error de redondeo en una app de finanzas destruye la confianza.

## Decisión

- En base de datos: `bigint` en unidad mínima, columnas con sufijo `_minor`, más un código de moneda ISO 4217 (`COP` por defecto).
- En JSON: string de enteros (`"500000"`), porque JSON no soporta `bigint`.
- En la UI: formato con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' })`.

## Consecuencias

- Sumas exactas siempre.
- Las conversiones se hacen solo en `@finanzas/shared/money`.
