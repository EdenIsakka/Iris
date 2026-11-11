# 2. App móvil con Expo (React Native) y Expo Router

- Estado: aceptada
- Fecha: 2026-11-11

## Contexto

La app se usará principalmente desde el celular y debe tener una demo pública para el portafolio.

## Decisión

Expo SDK 58 con Expo Router (rutas por archivos). La demo se publica con `expo export --platform web`; Android se distribuye como APK con EAS Build.

## Alternativas descartadas

- PWA con Next.js: demo más simple, pero menos nativa.
- Flutter: buen rendimiento, pero no comparte lenguaje con la API.

## Consecuencias

- Un solo código para iOS, Android y web.
- Algunas librerías nativas no funcionan en web; se revisa compatibilidad antes de agregarlas.
