# Sprint 3.4 - Programado vs Ejecutado y Curva S basica

## Objetivo

Agregar al modulo Avance una seccion de control Programado vs Ejecutado para comparar la Planificacion Semanal contra lo registrado en Registro Diario.

## Ruta

`/projects/[projectId]/progress`

## Nueva seccion

`Programado vs Ejecutado`

Se ubica dentro del modulo Avance, sin reemplazar la tabla actual de avance presupuestal.

## Fuentes de datos

### Avance programado

Se calcula desde:

- `planningItems`
- Actividades del Presupuesto Maestro
- Cantidad programada
- Fecha inicio / fin de la programacion semanal

### Avance ejecutado

Se calcula desde:

- `activities`
- Cantidades registradas en Registro Diario
- `budgetItemId`
- Fecha del registro diario

## Indicadores

- Avance programado %
- Avance ejecutado %
- Desviacion %
- Actividades atrasadas
- Cumplimiento semanal %

## Tabla

Columnas:

- ITEM
- Actividad
- Unidad
- Programado
- Ejecutado
- Diferencia
- % Cumplimiento
- Estado

Estados:

- En tiempo
- Atrasada
- Adelantada
- Sin programacion

## Filtros

- Semana
- Capitulo
- Estado
- Responsable

## Curva S basica

Se implementa con SVG simple, sin librerias externas.

Eje X:

- Semanas detectadas desde planificacion y registros diarios.

Lineas:

- Programado acumulado
- Ejecutado acumulado

## Dashboard

Se agrega tarjeta:

- `Desviacion Programado vs Ejecutado`

## Reportes

Se agrega tipo:

- `Reporte Programado vs Ejecutado`

Tambien se agrega filtro en el modulo Reportes.

## PDF

No se implementa PDF real para este reporte en este sprint.

La vista queda preparada para que un sprint futuro genere un PDF especifico de Programado vs Ejecutado.

## Helper

Archivo:

`lib/programmed-progress.ts`

Funciones:

- `buildProgrammedRows`
- `calculateProgrammedSummary`
- `buildSCurve`

## Restricciones respetadas

- No backend.
- No Supabase.
- No se rompe Avance.
- No se rompe Planificacion.
- No se rompe Registro Diario.
- No se agregan librerias pesadas.
