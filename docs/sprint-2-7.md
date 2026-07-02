# Sprint 2.7 - Levantamiento Inicial de Obra

## Objetivo

Definir el punto de partida real desde el cual DAC empieza a controlar la ejecucion de la obra.

## Ruta

`/projects/[projectId]/initial-survey`

## Acceso

Se agrega el boton `Levantamiento Inicial` en el Centro de Control y un acceso rapido en la navegacion superior.

## Funcionamiento

El modulo muestra todas las actividades del Presupuesto Maestro y permite editar el campo `Ejecutado inicial`.

Columnas principales:

- Item.
- Descripcion.
- Unidad.
- Cantidad contratada.
- Ejecutado inicial.
- Pendiente inicial.
- % inicial.
- Valor ejecutado inicial.
- Estado.

## Validaciones

DAC no permite guardar:

- Valores negativos.
- Ejecutado inicial mayor que la cantidad contratada.
- Valores no numericos.

El estado se calcula asi:

- `Sin iniciar` si ejecutado inicial es 0.
- `En ejecucion` si ejecutado inicial es mayor que 0 y menor que la cantidad contratada.
- `Finalizado` si ejecutado inicial equivale a la cantidad contratada.

## Guardado

Al guardar:

- Se actualiza `initialProgress` en cada actividad del Presupuesto Maestro.
- Se recalcula cantidad ejecutada acumulada.
- Se recalcula cantidad pendiente.
- Se recalcula porcentaje ejecutado.
- Se recalcula valor ejecutado.
- Se actualiza Avance.
- Se actualiza Dashboard.
- Se crea evento en Bitacora: `Levantamiento inicial actualizado.`
- Se guarda fecha del levantamiento.
- Se guarda usuario: `Jose Martinez`.
- Se persiste en `localStorage`.

## Resumen superior

El modulo muestra:

- Total actividades.
- Valor total presupuesto.
- Valor ejecutado inicial.
- Valor pendiente.
- Avance inicial %.
- Fecha del levantamiento.

## Filtros

Filtros disponibles:

- Todas.
- Sin iniciar.
- En ejecucion.
- Finalizadas.
- Busqueda por item o descripcion.

## Exportacion

El boton `Exportar levantamiento` muestra una exportacion simulada.

## Reglas tecnicas

- No backend.
- No Supabase.
- No se rompe Registro Diario.
- No se rompe Avance.
- No se rompe Presupuesto.
- Cada guardado deja un evento en Bitacora.
