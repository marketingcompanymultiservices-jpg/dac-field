# Sprint 3.3 - Evidencia fotografica real

## Objetivo

Implementar evidencia fotografica real en DAC, cargada desde navegador o celular, asociada al Registro Diario, a actividades del Presupuesto Maestro y a reportes diarios.

## Alcance

- Sin backend.
- Sin Supabase.
- Imagenes reales en navegador.
- Metadata en Store Global y `localStorage`.
- Binarios/base64 comprimidos en IndexedDB.
- Integracion con Registro Diario, Reporte Diario, Bitacora, Ficha de Actividad y Reportes.

## Registro Diario

El paso `Fotografias` permite:

- Tomar foto desde camara movil.
- Seleccionar imagenes desde galeria.
- Cargar varias imagenes.
- Ver miniaturas.
- Editar descripcion.
- Asociar la foto a una actividad del Presupuesto Maestro.
- Eliminar fotos antes de enviar.

Inputs usados:

- `accept="image/*"`
- `capture="environment"` para camara movil.
- `multiple` para carga desde galeria.

## Metadata por foto

Cada foto guarda:

- `id`
- `projectId`
- `name`
- `type`
- `size`
- `date`
- `time`
- `user`
- `description`
- `activityId`
- `reportId`
- `dailyReportId`
- `storage`

La imagen real se almacena aparte en IndexedDB.

## Helper

Archivo:

`lib/imageStorage.ts`

Funciones principales:

- `validateImageFile()`
- `compressImage()`
- `saveImage()`
- `getImagesByDailyReportId()`
- `getImagesByActivityId()`
- `deleteImage()`
- `clearImages()`

Tambien se mantienen funciones compatibles:

- `getImagesByReportId()`
- `getImagesByDate()`
- `getImage()`

## Validaciones

- Formatos permitidos: JPG, JPEG, PNG y WEBP.
- Tamano maximo: 5 MB por foto.
- Minimo recomendado: 5 fotos por registro.
- Contador visible: `Fotos cargadas X/5`.

## Compresion

Las imagenes se comprimen en navegador cuando es posible:

- Ancho maximo: 1600 px.
- Calidad JPEG aproximada: 0.82.
- PNG se conserva como PNG.

## Reporte Diario

El Reporte Diario consulta imagenes por `dailyReportId` y muestra las fotos reales en la seccion `Registro fotografico`.

Si el reporte fue creado antes de existir `dailyReportId`, se conserva fallback por fecha.

## PDF

La vista de Reporte Diario muestra miniaturas reales y es compatible con `window.print()`.

La exportacion PDF real con imagenes embebidas no se implementa en este sprint porque no hay una libreria PDF estable conectada a la app. Queda anotada para un sprint futuro de exportacion documental.

## Bitacora

Al cargar fotos se crea el evento:

`Se cargaron X fotografias al registro diario.`

## Ficha de Actividad

La ficha individual de actividad consulta imagenes por `activityId` y muestra las fotografias reales asociadas.

## Reportes

El modulo Reportes muestra la cantidad real de fotos registradas y, en la vista previa, el conteo por reporte diario.

## Limpieza

Al reiniciar datos de prueba se limpia:

- `localStorage`
- Metadata del Store
- Imagenes almacenadas en IndexedDB

## Restricciones respetadas

- No backend.
- No Supabase.
- No se rompe Store Global.
- No se rompe `localStorage`.
- No se rompe Registro Diario.
- No se rompe Reporte Diario.
- TypeScript limpio.
- Diseño responsive DAC.
