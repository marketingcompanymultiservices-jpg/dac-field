# Sprint 5.7 - Registro Diario compartido por proyecto

## Objetivo

Corregir la inconsistencia donde un Registro Diario creado por un usuario no aparecia para otros usuarios autorizados del mismo proyecto.

## Diagnostico

- El Registro Diario se estaba guardando en el Store Global y en `localStorage`.
- Las fotografias reales se guardaban en IndexedDB del navegador que las cargaba.
- El listado de reportes dependia de datos locales del navegador, por lo que Jose no podia ver reportes creados por Hernan.

## Correccion

- Se agrego el helper `lib/supabase/daily-reports.ts`.
- El guardado de Registro Diario ahora usa Supabase mediante `save_daily_report_bundle(payload)`.
- El listado se carga por `project_id`, no por `user_id`, `created_by` ni `owner`.
- Se sincronizan:
  - `daily_reports`
  - `report_activities`
  - `report_photos`
  - `commitments`
- Las fotos se guardan como imagen comprimida en `report_photos.image_data` para que otro usuario pueda verlas aunque no existan en su IndexedDB local.

## Logs agregados

La consola registra:

- proyecto consultado;
- usuario autenticado;
- origen de datos;
- consulta ejecutada;
- cantidad de reportes encontrados;
- cantidad de actividades, fotos y compromisos encontrados;
- detalle completo de errores de Supabase.

## Migracion requerida

Ejecutar en Supabase:

`database/sprint-5-7-daily-reports-supabase.sql`

La migracion crea las tablas remotas y la funcion transaccional:

`public.save_daily_report_bundle(payload jsonb)`

## Pendiente futuro

Mover fotografias a Supabase Storage para no almacenar base64 en tabla cuando el volumen de obra crezca.
