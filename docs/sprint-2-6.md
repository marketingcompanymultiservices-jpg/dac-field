# Sprint 2.6 - Registro Diario como centro operativo

## Objetivo

Convertir el Registro Diario en el centro operativo de la obra, eliminando el ingreso libre de actividades y obligando a que toda ejecucion provenga del Presupuesto Maestro.

## Registro Diario

El paso `Actividades ejecutadas` ahora trabaja con un buscador inteligente basado en el presupuesto.

El buscador permite encontrar actividades por:

- Item.
- Descripcion.
- Capitulo.
- Subcapitulo.

Al seleccionar una actividad se muestra automaticamente:

- Item.
- Descripcion.
- Unidad.
- Capitulo.
- Subcapitulo.
- Cantidad contratada.
- Cantidad ejecutada acumulada.
- Cantidad pendiente.
- Valor unitario.
- Valor total.
- Porcentaje ejecutado.
- Estado.

## Datos que registra el residente

El residente ya no escribe actividades manualmente. Solo registra:

- Cantidad ejecutada hoy.
- Observacion.
- Frente de trabajo.
- Responsable.
- Hora inicio.
- Hora final.
- Fotografias.
- Compromiso opcional.

## Validaciones

DAC no permite guardar:

- Cantidad negativa.
- Cantidad igual a cero.
- Cantidad mayor a la pendiente.
- Cantidad no numerica.

## Integracion automatica

Al guardar una ejecucion, el Store Global recalcula:

- Cantidad ejecutada acumulada.
- Cantidad pendiente.
- Porcentaje ejecutado.
- Estado.
- Valor ejecutado.
- Dashboard.
- Bitacora.
- Reportes.
- Compromisos.

## Ficha de actividad

Se crea la ruta:

`/projects/[projectId]/activities/[activityId]`

La ficha muestra:

- Informacion tecnica de la actividad.
- Historico completo de ejecuciones.
- Fotografias registradas.
- Observaciones.
- Compromisos asociados.
- Valor ejecutado.
- Cantidad pendiente.
- Ultima actualizacion.

## Presupuesto

La tabla de Presupuesto incluye el boton `Ver actividad`, que abre la ficha de cada item.

## Historial

Cada Registro Diario queda asociado al item presupuestal mediante `budgetItemId`.

Los registros nunca se sobrescriben. Cada ejecucion se agrega al historial de la actividad.

## Persistencia

Todo sigue funcionando sin backend y sin Supabase. La informacion se conserva temporalmente con `localStorage`.
