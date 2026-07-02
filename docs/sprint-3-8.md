# Sprint 3.8 - Centro de Control del Director

## Objetivo

Reemplazar el Dashboard basico por un tablero ejecutivo principal para el Director Administrativo y el Director de Obra.

No se crea un Dashboard nuevo. La ruta existente `/dashboard` ahora muestra el Centro de Control del Director.

## Componente principal

- `components/DirectorControlCenter.tsx`

La pagina `app/dashboard/page.tsx` queda como entrada limpia al componente ejecutivo.

## Secciones implementadas

### 1. Resumen General

Muestra:

- Proyecto activo.
- Avance fisico.
- Avance programado.
- Desviacion.
- Valor ejecutado.
- Valor pendiente.
- Fecha del ultimo registro.
- Ultima sincronizacion.
- Estado del proyecto.

### 2. Actividad de Hoy

Muestra:

- Registro diario recibido.
- Fotografias cargadas.
- Actividades ejecutadas.
- Responsable.

### 3. Alertas Criticas

Muestra solo alertas:

- Criticas.
- Altas.

Incluye boton `Ver todas` hacia el Centro de Alertas.

### 4. Productividad

Muestra:

- Produccion semanal.
- Actividades con mayor avance.
- Actividades sin movimiento.

Los datos se calculan desde Registro Diario y Presupuesto Maestro.

### 5. Compromisos

Muestra:

- Pendientes.
- Vencidos.
- Cumplidos.

Incluye acceso al modulo Compromisos.

### 6. Planeacion

Muestra:

- Actividades programadas esta semana.
- Actividades atrasadas.
- Cumplimiento semanal.

Usa la informacion de Planificacion Semanal.

### 7. Evidencia

Muestra:

- Fotografias cargadas hoy.
- Ultimo reporte enviado.

Incluye acceso al ultimo reporte diario o al Registro Diario si aun no existe reporte.

### 8. Accesos Rapidos

Botones grandes:

- Registro Diario.
- Avance.
- Presupuesto.
- Reportes.
- Alertas.
- Planificacion.
- Modo Obra.
- Centro de Control.

### 9. Indicadores de Obra

Muestra:

- Actividades totales.
- Actividades finalizadas.
- Actividades en ejecucion.
- Actividades sin iniciar.

### 10. Ultima Sincronizacion

Muestra el estado de persistencia local:

- Cargando.
- Datos de prueba.
- Fecha y hora del ultimo guardado local.

### 11. Estado del Proyecto

Muestra el estado actual del proyecto:

- En ejecucion.
- Suspendida.
- Finalizada.

### 12. Estructura Multiproyecto

Se agrega una seccion `Portafolio de proyectos` preparada para listar multiples proyectos cuando existan.

Actualmente muestra la obra activa disponible.

## Integraciones

El Centro de Control del Director consume datos reales del Store Global:

- Proyecto.
- Presupuesto.
- Avance.
- Registro Diario.
- Planificacion Semanal.
- Alertas.
- Productividad.
- Compromisos.
- Fotografias.
- Reportes.
- Persistencia local.

## Restricciones

- No se implementa backend.
- No se implementa Supabase.
- No se rompen modulos existentes.
- No se duplican fuentes de datos.
- El tablero es responsive para celular y escritorio.
