# 9. No leer las notificaciones del banco

- Estado: aceptada
- Fecha: 2026-11-24

## Contexto

Queríamos crear movimientos solos a partir de los avisos del banco: la notificación de la app de BBVA o el SMS de Bancolombia. Leer Gmail se descartó antes porque pide verificación de Google y un servidor. La opción local era un `NotificationListenerService` de Android: un módulo nativo propio en la app, con el permiso "Acceso a notificaciones" que activa la persona. Se construyó y compiló una versión de prueba (rama `feat/notificaciones-banco`).

## Decisión

No se lee ninguna notificación ni SMS. Los movimientos se siguen registrando a mano, y los pagos programados avisan lo que viene.

## Por qué

Google Play Protect bloqueó la instalación de la APK de prueba. Su protección contra fraude impide instalar desde el navegador, apps de mensajes o el administrador de archivos las apps que piden permisos que usan los troyanos bancarios: leer SMS, leer notificaciones o accesibilidad. Iris se reparte como APK descargada, así que el permiso la bloquearía para todas las personas, no solo para quien quiere la función.

## Alternativas descartadas

- Publicar en la Play Store: pago de cuenta de desarrollador, revisión de Google del permiso y un proceso de publicación que no se justifica para pocas personas.
- Instalar por cable con `adb` o apagar Play Protect: sirve para una persona técnica, no para quien recibe un enlace.
- Una APK aparte solo con esta función: dos versiones que mantener para una sola persona.

## Consecuencias

- La APK no pide permisos sensibles y se instala sin bloqueos.
- Si algún día Iris llega a la Play Store, se puede retomar desde la rama `feat/notificaciones-banco`.
