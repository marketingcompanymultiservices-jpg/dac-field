# Sprint 1.5 - Modulo Reportes

Se creo el modulo Reportes para la obra piloto Quintas de Acuarela.

## Alcance implementado

- Ruta `/projects/[projectId]/reports`.
- Conexion del boton Reportes desde el Centro de Control.
- Tipos de reportes disponibles para diario, semanal, mensual, fotografico, avance, compromisos, documental y bitacora general.
- Mock local de reportes generados y borradores.
- Tarjetas superiores para total, generados, borradores, ultimo reporte generado y tipos disponibles.
- Panel local para generar reportes simulados con rango de fechas, formato e inclusiones.
- Listado responsive con acciones Ver, Descargar y Eliminar borrador.
- Filtros por estado y tipo de reporte.

## Pendiente para sprint futuro

- Generacion real de PDF y Excel.
- Persistencia en Supabase/PostgreSQL.
- Descarga real de archivos generados.
