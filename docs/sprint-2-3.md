# Sprint 2.3 - Presupuesto conectado con Avance

## Objetivo

Unificar Presupuesto y Avance para que el presupuesto maestro sea la fuente oficial del control fisico y financiero de obra.

## Cambios principales

- Avance deja de leer un mock propio.
- El Store Global calcula `progressItems` desde `budgetItems` y las cantidades registradas en Registro Diario.
- Registro Diario permite seleccionar actividades del presupuesto por item, descripcion, capitulo o subcapitulo.
- Cada actividad diaria guarda el `budgetItemId` correspondiente al item de presupuesto.
- El motor de avance suma cantidades por item presupuestal.

## Registro Diario

En el paso `Actividades ejecutadas` se agrego:

- Buscador de actividades del presupuesto.
- Vista de la actividad seleccionada con item, descripcion, unidad, cantidad contratada, ejecutado acumulado y pendiente.
- Campo `Cantidad ejecutada hoy`.
- Validacion para impedir registrar una cantidad mayor a la pendiente.

## Avance

El modulo Avance recalcula automaticamente:

- Cantidad ejecutada acumulada.
- Cantidad pendiente.
- Porcentaje ejecutado.
- Estado de cada actividad.
- Avance general ponderado por valor total.
- Valor ejecutado estimado.
- Valor pendiente estimado.
- Actividades finalizadas, en ejecucion y sin iniciar.

## Presupuesto

La tabla del modulo Presupuesto ahora muestra columnas calculadas:

- Ejecutado acumulado.
- Pendiente.
- % Ejecutado.
- Estado.

## Persistencia

La informacion continua guardandose en `localStorage`. Al recargar la pagina, las actividades diarias se restauran y los avances se recalculan desde el presupuesto global.

## Pendiente

- Importacion real desde Excel.
- Reemplazo controlado del presupuesto maestro.
- Validaciones avanzadas de unidades y versiones de presupuesto.
- Persistencia real con Supabase.
