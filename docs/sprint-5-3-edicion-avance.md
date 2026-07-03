# Sprint 5.3 - Edicion de avance y cantidades del presupuesto

## Objetivo

Permitir que Director, Residente e Interventoria actualicen directamente el avance real acumulado de cada actividad del Presupuesto Maestro, sin migrar datos a Supabase todavia.

## Alcance implementado

- El modulo Presupuesto permite editar avance por actividad.
- El modulo Presupuesto permite corregir la cantidad base/presupuestada real de cada actividad.
- Los campos editables son:
  - Cantidad presupuestada real.
  - Cantidad ejecutada acumulada.
  - Responsable de actualizacion.
  - Observacion de actualizacion.
- Los datos contractuales permanecen bloqueados:
  - ITEM.
  - Descripcion.
  - Unidad.
  - Valor unitario.

## Calculos automaticos

Al guardar una cantidad presupuestada real o ejecutada acumulada, DAC recalcula desde el Store Global:

- Cantidad pendiente.
- Porcentaje ejecutado.
- Valor total.
- Valor ejecutado estimado.
- Valor pendiente estimado.
- Estado de la actividad:
  - Sin iniciar.
  - En ejecucion.
  - Finalizado.

El modulo Avance consume estos mismos calculos, por lo que sus indicadores se actualizan automaticamente.

## Validaciones

La edicion manual no permite:

- Valores negativos.
- Valores no numericos.
- Cantidad ejecutada mayor que la cantidad presupuestada real.
- Cantidad presupuestada real menor que la cantidad ejecutada acumulada.

Cuando hay error, se muestra un mensaje claro dentro del modulo Presupuesto.

## Historial de cambios

Cada actualizacion manual registra:

- ID de actividad.
- ITEM.
- Descripcion.
- Cantidad anterior.
- Cantidad nueva.
- Diferencia.
- Usuario o responsable.
- Fecha.
- Observacion.
- Origen: `Edición manual de avance`.

El Presupuesto incluye la seccion `Historial de cambios de avance`.

Tambien se registra historial de correcciones de cantidad presupuestada con:

- Cantidad base anterior.
- Cantidad base nueva.
- Usuario.
- Fecha.
- Observacion.
- Origen: `Correccion manual de cantidad presupuestada`.

## Bitacora

Cada guardado crea un evento automatico:

`Se actualizo avance manual de la actividad [ITEM] [DESCRIPCION].`

Cuando cambia la cantidad presupuestada, se crea ademas:

`Se actualizo cantidad presupuestada de la actividad [ITEM] [DESCRIPCION].`

## Reportes

El resumen de avance en Reportes incluye la cantidad de actualizaciones manuales registradas.

## Persistencia

Los cambios manuales de avance y las correcciones de cantidad presupuestada se conservan en el Store Global y en `localStorage`.

No se migro presupuesto, avance ni historial a Supabase en este sprint.

## Restricciones respetadas

- No se modifico Planificacion.
- No se modifico autenticacion.
- No se modificaron usuarios ni roles.
- No se modifico el importador Excel.
- No se reemplazo el modelo local de persistencia.
- No se implemento backend nuevo.
