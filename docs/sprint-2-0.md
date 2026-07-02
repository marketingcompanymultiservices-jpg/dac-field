# Sprint 2.0 - Store Global y Registro Diario como centro

Este sprint convierte el Registro Diario en la fuente operativa de DAC - Doble Altura Control.

## Arquitectura

Se implemento `ProjectStoreProvider` con Context API en `lib/project-store.tsx` y se activo desde `app/layout.tsx`.

El store mantiene en memoria:

- Proyecto.
- Actividades registradas desde Registro Diario.
- Registros diarios.
- Fotografias simuladas.
- Compromisos.
- Documentos.
- Avance calculado.
- Bitacora.
- Reportes.

## Flujo de datos

El Registro Diario ya no trabaja aislado. Cuando el usuario agrega una actividad, compromiso o fotografia, se actualiza el store global.

Los demas modulos leen la misma fuente:

- Dashboard calcula tarjetas dinamicas.
- Avance calcula cantidades ejecutadas, pendientes, porcentaje y estado.
- Bitacora agrega eventos automaticos por actividades, compromisos y fotos.
- Compromisos muestra los compromisos creados desde Registro Diario.
- Reportes muestra vista previa con datos reales registrados en memoria.

## Motor de avance

El motor esta en `lib/progress.ts`.

La funcion `buildProgressFromActivities` cruza las actividades del Registro Diario con los items del presupuesto base por descripcion normalizada. Con esa relacion calcula:

- Cantidad acumulada.
- Cantidad pendiente.
- Porcentaje ejecutado.
- Estado: Finalizado, En ejecucion o Sin iniciar.

## Alcance excluido

- No hay backend.
- No hay Supabase.
- No hay persistencia al recargar la pagina.
- No hay importacion real de Excel.
