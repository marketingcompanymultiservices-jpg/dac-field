# Sprint 5.7.1 - Correccion de guardado infinito en Registro Diario

## Problema

En celular, el Registro Diario podia quedar indefinidamente en `Guardando...` al enviar el reporte. El riesgo principal estaba en dos operaciones asincronas:

- lectura de fotografias desde IndexedDB;
- envio de `image_data` grande dentro del RPC `save_daily_report_bundle(payload)`.

## Correccion

- Se agrego timeout a la lectura de imagenes desde IndexedDB.
- Se agrego timeout a la consulta y guardado de reportes diarios en Supabase.
- El RPC `save_daily_report_bundle(payload)` ahora devuelve exito o error visible; la interfaz ya no queda bloqueada indefinidamente.
- Si una fotografia tiene `image_data` demasiado grande, DAC omite el base64 y guarda el metadato para no bloquear el Registro Diario desde celular.
- Despues de guardar correctamente, DAC recarga `daily_reports`, `report_activities`, `report_photos` y `commitments` desde Supabase por `project_id`.

## Mensajes visibles

Exito:

`Registro Diario guardado en Supabase correctamente.`

Error:

`No fue posible guardar el Registro Diario en Supabase.`

El mensaje incluye:

- `code`
- `message`
- `details`
- `hint`

## Logs

La consola registra:

- llamada a `save_daily_report_bundle(payload)`;
- usuario autenticado;
- proyecto;
- cantidad de actividades, fotos y compromisos;
- fotos omitidas por tamano;
- errores completos de Supabase.
