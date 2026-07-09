# Sprint 5.7.4 - Reportes diarios visibles entre usuarios

## Objetivo

Corregir la carga de reportes diarios para que Jose vea los reportes creados por Hernan cuando ambos consultan el mismo proyecto.

## Correcciones

- Se normaliza el `project_id` usado por Registro Diario a `quintas-de-acuarela` cuando existe un valor local obsoleto.
- El Store registra en consola el `projectBaseId` local y el `normalizedProjectId` usado para consultar Supabase.
- La consulta de `daily_reports` registra:
  - usuario autenticado;
  - rol devuelto por `current_profile_role()`;
  - `project_id` consultado;
  - cantidad de reportes encontrados;
  - origen `Supabase`.
- Registro Diario, Bitacora y Reportes muestran el mensaje:
  `No se encontraron reportes para este proyecto en Supabase.`
- El modulo Reportes ahora muestra una seccion explicita de reportes diarios leidos desde Supabase.
- No se agregan filtros por `created_by`, `user_id`, `owner`, `resident` ni usuario actual.

## Verificacion

En consola, para Jose y Hernan debe verse el mismo:

`normalizedProjectId: quintas-de-acuarela`

Si Supabase devuelve registros, ambos usuarios deben ver la misma cantidad en `reportsFound`.
