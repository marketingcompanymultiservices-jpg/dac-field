# Sprint 2.5 - Validacion y auditoria de importacion Excel

## Objetivo

Agregar una capa de revision antes de confirmar la importacion de presupuesto, para que DAC permita auditar si el archivo fue leido correctamente.

## Alcance

- No hay backend.
- No hay Supabase.
- La importacion sigue funcionando en el navegador con `xlsx`.
- El Store Global y `localStorage` se mantienen como fuente temporal.

## Validacion previa

Antes de importar definitivamente, DAC muestra:

- Nombre del archivo.
- Numero de filas leidas.
- Actividades validas detectadas.
- Capitulos detectados.
- Subcapitulos detectados.
- Filas descartadas.
- Valor total detectado.
- Columnas detectadas.
- Primeras 20 actividades validas.
- Primeras 20 filas descartadas con motivo.

## Motivos de descarte

Cada fila descartada muestra uno de estos motivos:

- Fila vacia.
- Falta unidad.
- Falta cantidad.
- Falta valor total.
- Es capitulo.
- Es subcapitulo.
- Es subtotal.
- Es total general.
- Valor invalido.

## Confirmacion

El usuario puede:

- Confirmar importacion.
- Cancelar.

Al cancelar, el presupuesto anterior se mantiene intacto.

Al confirmar:

- Se reemplaza el presupuesto maestro.
- Se crea una nueva version.
- Se reinicia el avance calculado asociado al presupuesto anterior.
- Se guarda metadata en `localStorage`.

## Bloqueos minimos

DAC no permite importar si:

- No hay actividades validas.
- El valor total detectado es 0.
- No se detectan columnas obligatorias: ITEM, DESCRIPCION, UND, CANTIDAD y VALOR TOTAL.

## Mejoras de deteccion

El parser ignora filas cuyo texto contiene:

- SUBTOTAL.
- TOTAL.
- COSTO DIRECTO.
- ADMINISTRACION.
- IMPREVISTOS.
- UTILIDAD.
- IVA.
- AIU.
- COSTOS DE OBRA.

## Resumen posterior

Despues de importar se muestra:

- Presupuesto importado correctamente.
- Version.
- Actividades importadas.
- Valor total.
- Fecha.
- Archivo.
