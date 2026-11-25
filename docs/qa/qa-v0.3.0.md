# QA v0.3.0 — Iris

Formato AAA: **Preparar** (Arrange) → **Hacer** (Act) → **Revisar** (Assert).
Cambia ⬜ por ✅ en lo que pasa. Si algo falla, anota qué viste en la columna de la derecha.

- La lógica de datos (saldos, resúmenes, topes, metas, inversiones, pagos, copias,
  transferencias) ya está cubierta por 80 pruebas automáticas AAA: `pnpm test`.
- Esta lista cubre lo que solo se ve en el celular: pantallas, toques, permisos.
- Haz la lista en Expo Go y, antes de publicar, otra vez en el APK.
- Usa datos de prueba, no los reales.

## 0. Preparar una vez

1. Haz una copia de lo que tengas en **Copia y seguridad → Guardar copia**.
2. Ten 3 billeteras: «Banco» (COP, 1.000.000), «Efectivo» (COP, 0) y «Dólares» (USD, 0).

## 1. Movimientos

| ✓   | Preparar                               | Hacer                                                    | Revisar                                                                              | Notas |
| --- | -------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----- |
| ⬜  | Resumen abierto                        | + → Gasto, 20.000, Banco, Mercado, nota «Rappi», Guardar | Sale en Últimos movimientos en rojo; Banco baja 20.000; «Salió» sube 20.000          |       |
| ⬜  | Ya existe el gasto «Rappi» con Mercado | + → Gasto, 5.000, nota «rappi» sin categoría, Guardar    | Queda con categoría Mercado (sugerida por la nota)                                   |       |
| ⬜  | Ninguna                                | + → Ingreso, 100.000, Salario                            | Sale en verde; «Entró» sube                                                          |       |
| ⬜  | Un movimiento                          | Tócalo → cambia el monto → Guardar                       | La lista y el saldo muestran el nuevo monto                                          |       |
| ⬜  | Un movimiento                          | Tócalo → Repetir hoy                                     | Aparece una copia con fecha de hoy; «Deshacer» la quita                              |       |
| ⬜  | Un movimiento                          | Tócalo → Borrar → Deshacer antes de 5 s                  | Vuelve a aparecer con el mismo monto y fecha                                         |       |
| ⬜  | Ninguna                                | + → Gasto, monto vacío → Guardar                         | Dice «Escribe un monto mayor que 0.» y no guarda                                     |       |
| ⬜  | Ninguna                                | + → Gasto → Ayer / Otra fecha                            | La fecha cambia; no deja elegir fechas futuras                                       |       |
| ⬜  | Movimientos en 2 meses                 | Movimientos → flecha ‹                                   | Cambia de mes, agrupa por día, «Entró · Salió» del mes; › está gris en el mes actual |       |

## 2. Transferencias

| ✓   | Preparar                                       | Hacer                                               | Revisar                                                  | Notas |
| --- | ---------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------- | ----- |
| ⬜  | Solo 1 billetera                               | +                                                   | No aparece «Transferir»                                  |       |
| ⬜  | 2+ billeteras                                  | + → Transferir, 50.000, De Banco, A Efectivo        | Banco −50.000, Efectivo +50.000; «Entró/Salió» no cambia |       |
| ⬜  | Ninguna                                        | Transferir → De: tocar la billetera que estaba en A | Se intercambian; nunca quedan iguales                    |       |
| ⬜  | Ninguna                                        | Transferir de Banco a Dólares sin «Llega»           | Pide «Escribe cuánto llega en USD.»                      |       |
| ⬜  | Ninguna                                        | Transferir 400.000 COP → Dólares, llega 100,00      | Dólares muestra US$100,00                                |       |
| ⬜  | Una transferencia                              | Movimientos del mes                                 | Sale en gris, sin signo, «Banco → Efectivo»              |       |
| ⬜  | Una transferencia                              | Tócala → Borrar → Deshacer                          | Los saldos vuelven a como estaban, y luego otra vez      |       |
| ⬜  | Billetera con transferencias y sin movimientos | Intenta borrarla                                    | No deja borrarla                                         |       |
| ⬜  | Una transferencia                              | Topes, gráfica, avisos                              | No cuentan la transferencia                              |       |

## 3. Billeteras y categorías

| ✓   | Preparar                  | Hacer                                 | Revisar                                               | Notas |
| --- | ------------------------- | ------------------------------------- | ----------------------------------------------------- | ----- |
| ⬜  | Ninguna                   | Crear billetera USD con saldo inicial | Saldo en US$; la moneda no se puede cambiar al editar |       |
| ⬜  | Billetera sin nada        | Borrarla                              | Se borra                                              |       |
| ⬜  | Solo 1 billetera          | Borrarla                              | No deja: «Necesitas al menos una billetera.»          |       |
| ⬜  | Ninguna                   | Categorías → Nueva «Mascotas»         | Aparece en el formulario de gasto                     |       |
| ⬜  | Categoría con movimientos | Borrarla                              | Sus movimientos quedan sin categoría                  |       |

## 4. Topes y avisos

| ✓   | Preparar        | Hacer                     | Revisar                              | Notas |
| --- | --------------- | ------------------------- | ------------------------------------ | ----- |
| ⬜  | Ninguna         | Topes → Mercado 100.000   | Barra con lo gastado del mes         |       |
| ⬜  | Tope de 100.000 | Gastar 120.000 en Mercado | Barra en rojo y aviso de que se pasó |       |

## 5. Metas

| ✓   | Preparar       | Hacer                                   | Revisar                                   | Notas |
| --- | -------------- | --------------------------------------- | ----------------------------------------- | ----- |
| ⬜  | Ninguna        | Nueva meta 1.200.000, fecha en 12 meses | «Ahorra $100.000 al mes para llegar en …» |       |
| ⬜  | Meta con fecha | Editar → «Sin fecha»                    | Desaparece el «Ahorra … al mes»           |       |
| ⬜  | Meta           | Aportar hasta llegar                    | Queda cumplida                            |       |

## 6. Inversiones

| ✓   | Preparar             | Hacer                                   | Revisar                                       | Notas |
| --- | -------------------- | --------------------------------------- | --------------------------------------------- | ----- |
| ⬜  | Con internet         | Nueva → Bitcoin, escribe 0,001 unidades | «0,001 BTC valen hoy $…» con un valor creíble |       |
| ⬜  | Ninguna              | Escribe 12 unidades por error           | El valor de la vista previa salta a la vista  |       |
| ⬜  | Inversión con precio | Aportar con unidades                    | Valor y aportado suben                        |       |
| ⬜  | CDT con tasa         | Abrirla                                 | El valor crece con los días                   |       |
| ⬜  | Sin internet         | Abrir inversiones                       | No se cae; quedan los últimos precios         |       |

## 7. Pagos fijos

| ✓   | Preparar                | Hacer                     | Revisar                                                                | Notas |
| --- | ----------------------- | ------------------------- | ---------------------------------------------------------------------- | ----- |
| ⬜  | Ninguna                 | Nuevo pago mensual 80.000 | «Pagos fijos: $80.000 al mes»                                          |       |
| ⬜  | Pagos en COP y USD      | Pestaña Pagos             | «$X + US$Y al mes»                                                     |       |
| ⬜  | Un pago                 | Ya lo pagué               | La pantalla se cierra una vez; aparece el gasto; pasa al mes siguiente |       |
| ⬜  | Varios pagos            | Pestaña Pagos             | Las filas no se montan unas sobre otras                                |       |
| ⬜  | Notificaciones apagadas | Pestaña Pagos             | Sale «Activarlas en Ajustes»                                           |       |

## 8. Copia y seguridad

| ✓   | Preparar                   | Hacer                                                                 | Revisar                                                   | Notas |
| --- | -------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------- | ----- |
| ⬜  | Ninguna                    | Guardar copia → elegir carpeta                                        | Archivo `iris-AAAA-MM-DD.json` en la carpeta              |       |
| ⬜  | Ninguna                    | Activar copia semanal → elegir carpeta                                | Muestra la carpeta y la fecha «Última»                    |       |
| ⬜  | Copia semanal prendida     | Cambiar la fecha del celular +8 días y abrir Iris                     | Aparece otra copia en la carpeta                          |       |
| ⬜  | Copia semanal prendida     | Borrar la carpeta, adelantar la fecha 9 días, abrir Copia y seguridad | Sale en rojo que la copia no se pudo guardar              |       |
| ⬜  | Una copia                  | Abrir una copia → Reemplazar                                          | Los datos quedan como en la copia, con las transferencias |       |
| ⬜  | Un archivo que no es copia | Abrir una copia                                                       | Dice que no es una copia y no toca nada                   |       |
| ⬜  | Celular sin huella ni PIN  | Prender bloqueo                                                       | «Primero ponle huella o PIN al celular…»                  |       |
| ⬜  | Huella puesta              | Prender bloqueo → confirmar                                           | Queda «Apagar bloqueo»                                    |       |
| ⬜  | Bloqueo prendido           | Cerrar Iris y abrirla                                                 | Pantalla morada con la hoja; no sale la huella sola       |       |
| ⬜  | Pantalla de bloqueo        | Entrar con huella → Cancelar                                          | Sigue bloqueada                                           |       |
| ⬜  | Pantalla de bloqueo        | Usar el PIN del celular → poner PIN                                   | Entra                                                     |       |
| ⬜  | Dentro de Iris             | Salir menos de 1 min y volver                                         | No pide nada                                              |       |
| ⬜  | Dentro de Iris             | Salir más de 1 min y volver                                           | Pide entrar de nuevo                                      |       |
| ⬜  | Bloqueo prendido           | Abrir apps recientes                                                  | La miniatura sale sin saldos; no deja tomar captura       |       |
| ⬜  | Modo oscuro                | Pantalla de bloqueo                                                   | La hoja se ve oscura y legible                            |       |

## 9. General

| ✓   | Preparar          | Hacer                                  | Revisar                                    | Notas |
| --- | ----------------- | -------------------------------------- | ------------------------------------------ | ----- |
| ⬜  | Ninguna           | Cambiar tema claro / oscuro / sistema  | Todo legible en los dos                    |       |
| ⬜  | Ninguna           | Botón atrás de Android en cada ventana | Cierra la ventana, sin pantallas en blanco |       |
| ⬜  | TalkBack prendido | Recorrer Resumen y un formulario       | Cada botón dice qué hace                   |       |
