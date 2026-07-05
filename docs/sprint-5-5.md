# Sprint 5.5 - Inspecciones de Direccion

## Objetivo

Crear un modulo independiente para que el Director registre observaciones durante recorridos de obra, las asigne a responsables y haga seguimiento hasta el cierre.

## Alcance implementado

- Nueva ruta: `/projects/[projectId]/direction-inspections`.
- Acceso desde el menu principal y desde el Centro de Control de Obra.
- Creacion de inspecciones con obra, fecha automatica, director autenticado, responsable, ubicacion, clasificacion, prioridad, descripcion, fecha limite y observaciones del compromiso.
- Carga de fotografias de observacion y correccion usando la infraestructura existente de imagenes.
- Vista de miniaturas y ampliacion de fotografias.
- Seguimiento por responsable con respuesta, evidencias de correccion y fecha de atencion.
- Flujo de estados: Pendiente, En proceso, Atendida y Cerrada.
- Acciones de Director: aprobar cierre o reabrir la observacion.
- Filtros por obra, responsable, estado, prioridad, clasificacion y fecha.
- Indicadores de pendientes, en proceso, cerradas, vencidas, responsables y clasificaciones.
- Historial local de cambios por inspeccion con usuario, fecha, accion y detalle.
- Persistencia temporal en Store Global y localStorage.

## Integracion con usuarios y roles

El modulo usa el usuario autenticado como Director que registra y toma los usuarios del sistema como responsables disponibles. La matriz de permisos incluye el nuevo modulo `Inspecciones de Direccion` para mantener preparada la administracion por roles.

## Base de datos preparada

Se agrego la migracion:

`database/sprint-5-5-direction-inspections.sql`

Incluye:

- Tabla `public.direction_inspections`.
- Tabla `public.direction_inspection_history`.
- Indices para proyecto, responsable, estado, prioridad, clasificacion y fecha limite.
- Row Level Security.
- Politicas iniciales para usuarios autenticados y roles operativos.

## Restricciones respetadas

- No se modifico el Registro Diario.
- No se modifico Bitacora.
- No se migro la informacion operativa a Supabase.
- No se cambio autenticacion ni permisos existentes.
- No se modifico la logica del presupuesto ni avance.

## Pendiente futuro

- Guardar inspecciones reales en Supabase cuando se active la persistencia remota del modulo.
- Usar Supabase Storage para fotografias de inspecciones.
- Aplicar permisos de UI estrictos por rol.
- Notificaciones automaticas al responsable asignado.

## Correccion 5.5.1 - Conexion con Supabase

La migracion fue ejecutada en Supabase y el modulo quedo conectado a las tablas remotas:

- `direction_inspections`
- `direction_inspection_history`

Cambios aplicados:

- Al ingresar al modulo, las inspecciones se cargan desde Supabase.
- Al crear una inspeccion, se guarda en `direction_inspections` y se registra el evento inicial en `direction_inspection_history`.
- Al responder una inspeccion, se guarda la respuesta, fecha de atencion, evidencias asociadas y evento historico.
- Al cambiar estado, cerrar o reabrir, se actualiza la tabla principal y se registra el cambio en el historial.
- La lista de inspecciones deja de depender de `localStorage`.
- Las fotografias siguen usando IndexedDB local y se referencian en Supabase mediante IDs, hasta integrar Supabase Storage.
