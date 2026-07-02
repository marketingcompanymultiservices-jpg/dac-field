# Sprint 3.9 - QA Integral y Estado del Sistema

## Objetivo

Realizar una revision integral de calidad del sistema DAC sin agregar modulos funcionales nuevos.

El objetivo es dejar una pantalla de diagnostico que permita revisar datos, rutas, integridad, almacenamiento y estado general antes de preparar una version productiva.

## Ruta

- `/system/health`

Nombre visible:

- `Estado del Sistema`

Acceso agregado desde:

- Administracion.

## Componente principal

- `components/SystemHealthPanel.tsx`

## Secciones implementadas

### 1. Estado General

Muestra:

- Sistema operativo del navegador.
- Version DAC.
- Fecha de compilacion local.
- Ultima actualizacion local.
- Estado general.

Estados posibles:

- Excelente.
- Bueno.
- Requiere atencion.

### 2. Diagnostico de datos

Valida y muestra cantidad encontrada para:

- Actividades sin presupuesto.
- Actividades duplicadas.
- Compromisos huerfanos.
- Reportes sin actividades.
- Fotografias sin reporte.
- Usuarios sin rol.
- Roles sin permisos.

### 3. Diagnostico de rendimiento

Muestra:

- Total actividades.
- Total registros diarios.
- Total fotografias.
- Total documentos.
- Total reportes.

### 4. Diagnostico de integridad

Comprueba:

- Presupuesto.
- Registro Diario.
- Avance.
- Reportes.
- Bitacora.
- Alertas.
- Planificacion.
- Productividad.
- Modo Obra.
- Dashboard.

Cada modulo muestra indicador positivo o de revision.

### 5. Validacion de navegacion

Ejecuta una comprobacion de rutas principales mediante `fetch` en el navegador.

Rutas verificadas:

- Login.
- Dashboard.
- Administracion.
- Estado del Sistema.
- Modo Obra.
- Centro de Control.
- Registro Diario.
- Bitacora.
- Presupuesto.
- Levantamiento Inicial.
- Planificacion.
- Avance.
- Alertas.
- Documentos.
- Reportes.
- Compromisos.

### 6. Validacion de almacenamiento

Comprueba:

- Store Global.
- localStorage.
- IndexedDB.
- Uso aproximado del almacenamiento del navegador cuando esta disponible.

### 7. Ejecucion de diagnostico

Se agrega boton:

- `Ejecutar diagnostico`

Al ejecutar:

- Muestra progreso.
- Recalcula validaciones.
- Genera resumen del sistema.
- Registra evento en Bitacora.

## Integracion con Bitacora

Se agrega en el Store Global la accion:

- `addSystemEvent`

La ejecucion del diagnostico crea el evento:

- `Diagnostico del sistema ejecutado.`

## Restricciones

- No se implementa backend.
- No se implementa Supabase.
- No se modifican funcionalidades existentes.
- No se agregan dependencias.
- La revision es local, basada en Store Global, localStorage e IndexedDB.
