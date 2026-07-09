# Sprint 5.7.3 - Registro Diario en produccion

## Objetivo

Dejar el Registro Diario funcional en produccion, sincronizado entre usuarios y sin reutilizar datos locales, simulados o de reportes anteriores.

## Correcciones

- El mensaje de exito queda normalizado: `Registro Diario guardado correctamente.`
- Si Supabase falla, se muestra el error completo con `code`, `message`, `details` y `hint`.
- La consulta de reportes, actividades, fotos y compromisos se carga desde Supabase por `project_id`.
- El Store ya no hidrata Registro Diario desde `localStorage`.
- Si Supabase no devuelve datos reales, Registro Diario queda vacio.
- Se eliminan eventos base simulados de la bitacora operativa.
- El formulario trabaja con un borrador actual:
  - actividades sin `dailyReportId`;
  - compromisos sin `dailyReportId`;
  - fotos sin `dailyReportId` ni `reportId`.
- Despues de guardar, el formulario vuelve limpio a paso 1.

## Seguridad

- `Reiniciar datos de prueba` solo aparece para rol `Administrador`.
- La accion tambien queda protegida en el Store: cualquier rol distinto de `Administrador` es rechazado y queda registrado en consola.

## Verificacion esperada

- Jose puede ver reportes creados por Hernan.
- Hernan puede crear un segundo reporte limpio.
- No aparecen fotografias antiguas en un nuevo Registro Diario.
- No se muestran datos simulados si Supabase no tiene informacion real.
