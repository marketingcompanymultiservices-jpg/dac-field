# Sprint 5.7.5 - Confirmacion real del Registro Diario

## Objetivo

Evitar que DAC muestre exito antes de confirmar que el reporte guardado existe en Supabase y aparece en la lista visible.

## Correcciones

- El mensaje `Registro Diario guardado correctamente.` solo aparece despues de:
  - respuesta exitosa de `save_daily_report_bundle(payload)`;
  - recarga de `daily_reports` por `project_id`;
  - verificacion del `id` recien creado en la respuesta recargada.
- Si el reporte no aparece tras guardar, se muestra:
  `El reporte fue enviado, pero no pudo confirmarse su lectura desde Supabase.`
- La consulta de reportes se ordena por `updated_at DESC` y `created_at DESC`.
- El reporte recien confirmado queda priorizado como primer elemento visible.
- La fecha del formulario usa fecha local `YYYY-MM-DD` y no `toISOString()`.

## Logs agregados

- fecha seleccionada antes de guardar;
- fecha enviada a Supabase;
- fecha retornada desde Supabase;
- id del reporte creado;
- cantidad de reportes recargados;
- id del ultimo reporte visible.
