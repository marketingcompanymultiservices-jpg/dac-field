# Sprint 3.7 - Modo Obra

## Objetivo

Optimizar DAC para uso real desde celular en obra mediante una experiencia simplificada para el residente.

## Ruta

- `/field`

Tambien se agregan accesos desde:

- Dashboard.
- Navegacion principal.
- Centro de Control de Obra.

## Concepto

`Modo Obra` es una vista adicional. No reemplaza ni elimina los modulos completos de DAC.

La pantalla esta pensada para el uso en celular, con botones grandes, texto legible, tarjetas simples y navegacion inferior fija.

## Funcionalidades

### Pantalla principal

Muestra solo informacion operativa:

- Obra activa.
- Registrar dia.
- Tomar fotografias.
- Ver actividades de hoy.
- Ver compromisos.
- Enviar reporte.
- Sincronizacion local.

### Registro Diario compacto

Permite registrar:

- Clima.
- Personal.
- Actividad del Presupuesto Maestro.
- Cantidad ejecutada.
- Frente de trabajo.
- Responsable.
- Hora inicio.
- Hora final.
- Observaciones.

Las actividades siguen saliendo del Presupuesto Maestro. No se permite crear actividades manuales.

### Actividades de hoy

Muestra las actividades programadas para la fecha actual desde Planificacion Semanal.

Si no hay actividades programadas para hoy, el buscador permite usar el Presupuesto Maestro como fuente.

### Fotografias

Incluye acceso rapido a camara:

- `Tomar foto`
- `Seleccionar desde galeria`

Las fotografias se guardan usando el flujo existente de IndexedDB y metadata en Store Global.

### Compromisos

Muestra resumen de:

- Pendientes.
- Vencidos.
- Mios.

Tambien permite crear compromisos rapidos asociados al Registro Diario.

### Envio de reporte

Permite enviar un reporte diario compacto con:

- Fecha actual.
- Hora actual.
- Clima.
- Personal.
- Observacion general.
- Firma del residente.

El reporte queda en el Store Global y alimenta los modulos existentes.

### Indicadores de estado

La vista muestra:

- Datos guardados localmente.
- Fotos pendientes para llegar al minimo recomendado de 5.
- Reporte enviado o no enviado.

## Integraciones

Modo Obra usa las mismas acciones del Store Global:

- `addDailyActivity`
- `addDailyCommitment`
- `addDailyPhotos`
- `saveDailyReport`
- `deleteDailyPhoto`

Por esto, al registrar informacion desde Modo Obra se actualizan automaticamente:

- Avance.
- Bitacora.
- Dashboard.
- Compromisos.
- Reportes.
- Alertas.
- Productividad.

## Restricciones

- No se implementa backend.
- No se implementa Supabase.
- No se elimina el Registro Diario completo.
- No se modifica el modulo de Avance.
- No se modifica el modulo de Reportes.
- La persistencia sigue usando localStorage e IndexedDB.
