# Sprint 3.2 - Planificacion Semanal

## Objetivo

Crear el modulo de Planificacion Semanal para que Director y Residente programen las actividades que esperan ejecutar en una semana de obra.

## Ruta

`/projects/[projectId]/planning`

## Navegacion

Se agrega el boton `Planificación` en:

- Menu principal.
- Centro de Control de Obra.

## Fuente de actividades

Las actividades provienen exclusivamente del Presupuesto Maestro.

No se permite escribir actividades manuales.

## Formulario de programacion

Campos:

- Actividad del presupuesto
- Cantidad programada
- Responsable
- Fecha inicio
- Fecha fin
- Prioridad

Prioridades:

- Alta
- Media
- Baja

## Tabla

Columnas:

- ITEM
- Actividad
- Unidad
- Cantidad programada
- Responsable
- Fecha inicio
- Fecha fin
- Prioridad
- Estado

La tabla muestra tambien informacion de apoyo dentro de las celdas:

- Cantidad ejecutada en la semana
- Porcentaje cumplido de la programacion
- Avance total de la actividad en la obra

## Estados

Estados calculados automaticamente:

- Pendiente
- En ejecucion
- Finalizada
- Atrasada

Reglas:

- Si no tiene ejecucion y la fecha final no ha pasado: `Pendiente`.
- Si tiene ejecucion menor a la cantidad programada: `En ejecucion`.
- Si la ejecucion semanal alcanza la cantidad programada: `Finalizada`.
- Si llega la fecha final y no se completa: `Atrasada`.

## Filtros

- Semana
- Responsable
- Prioridad
- Estado

## Tarjetas superiores

- Actividades programadas
- Actividades terminadas
- Actividades pendientes
- Cumplimiento semanal %

## Integracion con Registro Diario

Cuando el Registro Diario guarda avances de una actividad del Presupuesto Maestro, la Planificacion Semanal calcula automaticamente:

- Cantidad ejecutada dentro de la semana programada.
- Porcentaje de cumplimiento semanal.
- Estado de la programacion.

No se duplican datos. La planificacion se deriva de:

- `planningItems`
- `activities`
- `budgetItems`

## Duplicar semana

El boton `Duplicar semana` copia la programacion de una semana origen hacia una semana destino, conservando:

- Actividad
- Cantidad programada
- Responsable
- Prioridad
- Duracion relativa

Al duplicar se registra evento en Bitacora:

`Se creo una nueva planificacion semanal.`

## Exportacion

El boton `Exportar programacion` muestra una simulacion. La exportacion real queda pendiente para un sprint futuro.

## Persistencia

La planificacion vive en Store Global y persiste en `localStorage`.

## Restricciones respetadas

- No backend.
- No Supabase.
- No se rompe Presupuesto.
- No se rompe Registro Diario.
- No se rompe Avance.
- No se duplica la fuente de actividades.
