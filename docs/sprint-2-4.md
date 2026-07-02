# Sprint 2.4 - Importador de Presupuesto Excel

## Objetivo

Permitir que DAC cargue un presupuesto real desde un archivo Excel `.xlsx` o `.xls` directamente en el navegador.

## Alcance

- Se usa la ruta existente `/projects/[projectId]/budget`.
- No se implementa backend.
- No se implementa Supabase.
- El presupuesto importado se guarda en el Store Global.
- La persistencia sigue usando `localStorage`.
- Avance, Dashboard y Registro Diario consumen inmediatamente el presupuesto importado.

## Dependencia

Se agrega la libreria `xlsx` para leer archivos Excel en el navegador.

## Helper

Se crea `lib/excelBudgetParser.ts` con funciones para:

- `parseBudgetExcel(file)`.
- `normalizeHeader(header)`.
- `parseCurrency(value)`.
- `parseNumber(value)`.
- `detectBudgetRows(rows, columns)`.

## Deteccion de columnas

El parser busca encabezados equivalentes para:

- ITEM / ITEM.
- DESCRIPCION / DESCRIPCION.
- UND / UND. / UNIDAD.
- CANT / CANT. / CANTIDAD.
- VALOR UNIT / VALOR UNIT. / VALOR UNITARIO / VLR UNIT.
- VALOR TOTAL / TOTAL / VLR TOTAL.
- % / PORCENTAJE / AVANCE.

## Deteccion de capitulos y actividades

- Si una fila no tiene unidad ni cantidad, pero tiene descripcion, se trata como capitulo o subcapitulo.
- Si el item es entero como `1`, `2`, `3`, se considera capitulo.
- Si el item es tipo `1.1`, `1.2` y no tiene cantidad, se considera subcapitulo.
- Si la fila tiene unidad y cantidad, se importa como actividad.

## Vista previa

Antes de importar se muestran las primeras 10 actividades detectadas con:

- Item.
- Descripcion.
- Unidad.
- Cantidad.
- Valor unitario.
- Valor total.
- Porcentaje inicial.
- Capitulo.
- Subcapitulo.

## Confirmacion

Antes de reemplazar el presupuesto, DAC muestra:

`Esta accion reemplazara el presupuesto actual y reiniciara el avance calculado. Desea continuar?`

## Reglas al importar

- El presupuesto actual se reemplaza.
- Las actividades registradas en Registro Diario se limpian para reiniciar el avance calculado.
- La planificacion vinculada a items anteriores se limpia.
- `initialProgress` queda en 0 si el Excel no trae porcentaje valido.
- Si el Excel trae porcentaje inicial, Avance lo usa como base para calcular el avance inicial.

## Metadata de version

Se guarda:

- Numero de version.
- Fecha de importacion.
- Usuario importador.
- Nombre del archivo.
- Total de actividades.
- Valor total importado.

## Errores controlados

El importador muestra mensajes si:

- El archivo no es Excel.
- No se detectan columnas minimas.
- No hay actividades validas.
- Existen valores numericos invalidos.

## Pendiente

- Validacion avanzada de plantillas.
- Historial completo de versiones.
- Importacion con backend.
- Persistencia real en Supabase.
