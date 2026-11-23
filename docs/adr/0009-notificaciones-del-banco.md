# 9. Movimientos desde las notificaciones del banco

- Estado: aceptada
- Fecha: 2026-11-22
- Completa: [ADR-0008](0008-datos-en-el-celular.md)

## Contexto

Registrar cada gasto a mano cansa. Los bancos avisan cada movimiento: BBVA con una notificación de su app, Bancolombia con un SMS que la app de mensajes muestra como notificación. Queremos aprovechar esos avisos sin servidor, sin cuentas y sin que los datos salgan del celular.

## Decisión

- **Notificaciones, no correo:** leer Gmail pide verificación de Google con auditoría de seguridad (o volver a iniciar sesión cada 7 días en modo prueba) y casi siempre un servidor. Android deja que una app lea las notificaciones si la persona lo activa en Ajustes ("Acceso a notificaciones").
- **Módulo nativo propio:** un módulo local de Expo en `apps/mobile/modules/bank-notifications` (Kotlin, `NotificationListenerService`). Las librerías de npm que hacen esto son pequeñas y poco mantenidas; el nuestro son unas 100 líneas.
- **Fila en el celular:** Android avisa al servicio aunque Iris esté cerrada, pero entonces no corre JavaScript. El servicio solo guarda en `SharedPreferences` las notificaciones de bancos (paquete con "bbva" o "bancolombia", o texto que empieza con "Bancolombia:") y la app las procesa al abrir. Se borran por id, así no se pierde una que llegue mientras tanto.
- **Sin Expo Go:** el módulo no existe en Expo Go ni en iPhone; ahí la función no aparece (`requireOptionalNativeModule` da `null`). Se prueba con una APK de EAS.
- **Por pasos:** primero solo se guarda y se muestra el texto, para escribir el lector de cada banco con mensajes reales. Después el lector sacará monto y tipo, y cada movimiento irá a una bandeja "Por revisar" antes de entrar a Movimientos.

## Alternativas descartadas

- Leer Gmail: verificación de Google, servidor y un formato de correo distinto por banco.
- Leer SMS (`READ_SMS`): no sirve para BBVA, que no manda SMS; las notificaciones cubren ambos casos.
- JavaScript en segundo plano (Headless JS): más complejo y frágil que guardar en una fila.

## Consecuencias

- Solo Android. La persona activa el permiso a mano, y en una APK instalada fuera de la Play Store Android 13+ lo bloquea hasta "Permitir configuración restringida" en la información de la app.
- Si la persona silencia las notificaciones del banco o de los SMS, Iris no las ve.
- Cada banco necesita su lector y puede romperse si el banco cambia el texto; por eso todo pasa por "Por revisar".
- El texto guardado trae nombres y últimos dígitos de cuentas: no sale del celular y se borra al procesarlo.
