# Sprint 5.7.7 - Mejoras funcionales del Registro Diario

## Objetivo

Optimizar el Registro Diario para que represente mejor la operacion diaria de obra, sin modificar la logica de Supabase, presupuesto, reportes existentes ni autenticacion.

## Cambios realizados

- Se reemplazo el registro libre de personal por un control de personal de obra:
  - numero total de personas;
  - listado de trabajadores;
  - nombre;
  - cargo o cuadrilla;
  - empresa opcional;
  - observaciones opcionales.
- Se elimino el bloque `Material recibido` del formulario y de la vista del reporte.
- Se agrego el bloque `Material utilizado`, informativo y sin impacto sobre inventario ni presupuesto.
- Se agregaron dos tipos de actividad:
  - actividad del presupuesto, que mantiene la actualizacion de avance;
  - actividad libre, que solo queda en el Reporte Diario.
- El resumen automatico ahora considera:
  - personas en obra;
  - actividades presupuestales;
  - actividades libres;
  - material utilizado;
  - compromisos;
  - fotografias.
- La vista del Reporte Diario separa actividades presupuestales y actividades libres.

## Compatibilidad

No se modifico el esquema de Supabase. Para conservar compatibilidad:

- El nuevo control de personal se guarda en el campo existente `administrative_staff` con formato JSON interno `dac-personnel-v1`.
- El material utilizado se guarda en el campo existente `material` con formato JSON interno `dac-materials-used-v1`.
- Los reportes anteriores siguen mostrando su personal legado cuando existe.
- El material recibido legado no se presenta en la vista nueva, porque ese flujo queda reservado para un futuro modulo de Inventario/Almacen.

## Reglas operativas

- Las actividades presupuestales siguen actualizando el avance del presupuesto.
- Las actividades libres no modifican cantidades, valores, avance ni presupuesto.
- El material utilizado es solo informativo.
- El Registro Diario queda como fuente oficial de informacion operativa.
