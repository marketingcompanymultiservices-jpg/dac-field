# Sprint 2.8 - Reporte Diario Real

## Objetivo

Crear una vista real de Reporte Diario a partir de la informacion registrada en Registro Diario y almacenada en el Store Global.

## Ruta

`/projects/[projectId]/daily-report/[reportId]`

## Accesos

Se agrega boton `Ver reporte diario` desde:

- Registro Diario.
- Bitacora.

## Fuente de informacion

El reporte lee datos reales del Store Global:

- Proyecto.
- Fecha.
- Residente.
- Clima.
- Personal administrativo.
- Personal operativo.
- Contratistas.
- Equipos.
- Materiales.
- Actividades ejecutadas.
- Cantidades ejecutadas.
- Observaciones.
- Problemas.
- Acciones tomadas.
- Compromisos.
- Fotografias simuladas.
- Firma simulada.

## Estructura visual

La vista incluye:

- Encabezado con logo DAC.
- Nombre de obra.
- Direccion.
- Fecha del reporte.
- Codigo del reporte.
- Residente.
- Estado del registro.

## Secciones

- Informacion general.
- Personal en obra.
- Equipos y materiales.
- Actividades ejecutadas.
- Observaciones.
- Problemas y acciones.
- Compromisos.
- Registro fotografico.
- Firma del residente.

## Resumen automatico

DAC genera un parrafo resumen con base en las actividades, compromisos y fotografias de la jornada.

## Acciones

- Volver.
- Imprimir con `window.print()`.
- Descargar PDF simulado con alerta: `Exportacion PDF real disponible en Sprint futuro.`

## Estado no encontrado

Si no existe el reporte solicitado, se muestra:

`No se encontro el reporte diario solicitado.`

## Reglas

- No backend.
- No Supabase.
- No PDF real todavia.
- No se rompe Registro Diario.
- No se rompe Bitacora.
- Vista optimizada para pantalla e impresion.
