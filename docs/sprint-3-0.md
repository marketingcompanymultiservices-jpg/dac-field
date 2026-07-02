# Sprint 3.0 - Fotografias reales desde navegador y celular

## Objetivo

Convertir el registro fotografico del Registro Diario en una carga real de imagenes desde el navegador o celular, manteniendo DAC sin backend y sin Supabase.

## Alcance implementado

- Carga real de imagenes en Registro Diario.
- Soporte para camara movil mediante input con `accept="image/*"` y `capture="environment"`.
- Seleccion multiple desde galeria o explorador de archivos.
- Validacion de formatos: JPG, JPEG, PNG y WEBP.
- Tamano maximo por foto: 5 MB.
- Contador visible: `Fotos cargadas X/5`.
- Previsualizacion con miniatura.
- Descripcion editable por foto.
- Asociacion opcional de la foto con una actividad del Presupuesto Maestro.
- Eliminacion de fotos antes de enviar el registro.
- Evento automatico en Bitacora: `Se cargaron X fotografias al registro diario.`
- Reporte Diario Real mostrando fotografias reales cargadas.
- Ficha individual de actividad mostrando fotografias asociadas.

## Arquitectura de almacenamiento

Las fotografias se guardan con dos capas:

1. Metadata en el Store Global:
   - `id`
   - `projectId`
   - `name`
   - `date`
   - `time`
   - `user`
   - `description`
   - `activityId`
   - `reportId`
   - `type`
   - `size`
   - `storage`

2. Imagen en IndexedDB:
   - Base64 comprimido o convertido desde el archivo original.
   - Guardado por `id` en la base `dac-image-storage`.

Esta separacion evita saturar `localStorage`, que queda reservado para datos livianos y metadata.

## Helper principal

Archivo: `lib/imageStorage.ts`

Funciones:

- `validateImageFile(file)`
- `saveImage(file, metadata)`
- `getImage(id)`
- `getImagesByReportId(reportId, photos)`
- `getImagesByDate(date, photos)`
- `deleteImage(id)`
- `compressImageIfPossible(file)`

## Integraciones

### Registro Diario

El paso de Fotografias ya no usa simulacion. Permite tomar o seleccionar imagenes reales, editarlas visualmente y asociarlas al reporte diario por fecha. Al guardar el reporte, las fotos de esa jornada quedan relacionadas con el `reportId`.

### Reporte Diario

La vista del reporte diario consulta IndexedDB y muestra las fotos reales en la seccion `Registro fotografico`.

### Bitacora

Cada carga de grupo de fotos agrega un evento de sistema para dejar trazabilidad.

### Reportes

El modulo Reportes usa la cantidad real de fotos almacenada en el Store Global para sus resumenes.

### Ficha de Actividad

Si una foto se asocia a una actividad del presupuesto, aparece en la ficha individual de esa actividad.

## Pendientes futuros

- Subida a Supabase Storage.
- Sincronizacion multiusuario.
- Compresion avanzada y miniaturas separadas.
- Georreferenciacion y metadatos EXIF.
- Inclusion completa en PDF real cuando se active el flujo definitivo de exportacion.

## Restricciones respetadas

- Sin backend.
- Sin Supabase.
- Sin romper Registro Diario.
- Sin romper Reporte Diario.
- Sin cambiar la fuente maestra del Presupuesto.
- Persistencia local mantenida.
