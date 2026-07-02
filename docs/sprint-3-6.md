# Sprint 3.6 - Indicadores de Productividad

## Objetivo

Crear indicadores de productividad de obra dentro del modulo Avance, usando la informacion real registrada en el Registro Diario, el Presupuesto Maestro, la Planificacion Semanal, Compromisos y Alertas.

## Ruta

- `/projects/[projectId]/progress`

La seccion se agrega dentro del modulo existente de Avance bajo el bloque `Productividad`.

## Componentes y helpers

- `components/ProductivityPanel.tsx`
- `lib/productivity.ts`

## Calculos implementados

### Productividad por actividad

Para cada actividad del Presupuesto Maestro se calcula:

- Cantidad ejecutada total.
- Dias con movimiento.
- Promedio diario ejecutado.
- Valor ejecutado.
- Ultimo dia con avance.
- Responsable del ultimo avance.
- Estado de productividad.

Estados:

- `Alta productividad`
- `Con movimiento`
- `Baja productividad`
- `Sin movimiento`

### Productividad por responsable

Para cada responsable se calcula:

- Actividades registradas.
- Cantidad ejecutada.
- Valor ejecutado.
- Compromisos asociados.
- Alertas asociadas.

## Vista en Avance

La seccion `Productividad` incluye:

- Tarjetas superiores:
  - Produccion total registrada.
  - Valor ejecutado acumulado.
  - Promedio diario ejecutado.
  - Actividades con movimiento esta semana.
  - Actividades sin movimiento.
- Filtros:
  - Capitulo.
  - Responsable.
  - Semana.
  - Estado.
  - Buscar actividad.
- Tabla por actividad.
- Ranking de mayor produccion.
- Ranking de menor movimiento.
- Panel de productividad por responsable.

## Integraciones

### Dashboard

Se agrega la tarjeta:

- `Productividad semanal`

El valor se calcula como el porcentaje de actividades con movimiento durante la semana seleccionada sobre el total de actividades del Presupuesto Maestro.

### Centro de Alertas

Se agrega el tipo:

- `Actividad con baja productividad`

Regla implementada:

Si una actividad programada ya inicio, no esta finalizada y no registra movimiento reciente en mas de 3 dias, se genera una alerta de prioridad `Media`.

### Reportes

Se agrega el tipo:

- `Reporte de Productividad`

La generacion real del PDF especifico queda pendiente para un sprint futuro.

## Persistencia

No se agrega una nueva fuente de datos. Los indicadores se calculan dinamicamente desde el Store Global y se conservan por la persistencia actual en `localStorage` e IndexedDB para fotografias.

## Restricciones

- No se implementa backend.
- No se implementa Supabase.
- No se modifican los flujos existentes de Avance, Registro Diario ni Planificacion.
- No se agrega una libreria pesada para graficos.
