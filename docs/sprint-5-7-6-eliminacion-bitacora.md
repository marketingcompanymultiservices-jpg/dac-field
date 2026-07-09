# Sprint 5.7.6 - Eliminacion del modulo Bitacora

## Decision

El modulo Bitacora queda eliminado de DAC.

El Registro Diario es la fuente oficial de informacion operativa de DAC.

## Alcance aplicado

- Se elimino la ruta visual `/projects/[projectId]/bitacora`.
- Se elimino Bitacora del menu principal.
- Se elimino Bitacora del Centro de Control de Obra.
- Se elimino Bitacora del diagnostico de navegacion e integridad.
- Se elimino Bitacora de la matriz de permisos semilla.
- Se elimino el tipo de reporte `Bitacora General`.
- Se actualizaron textos de interfaz que mencionaban Bitacora como destino operativo.

## Fuente oficial

La consulta historica operativa debe realizarse desde:

- `daily_reports`
- `report_activities`
- `report_photos`
- `commitments`

## Supabase

No se eliminaron tablas automaticamente.

Si existen tablas historicas usadas exclusivamente por Bitacora, como `events` en esquemas iniciales, quedan marcadas como obsoletas y no deben usarse para nuevas consultas operativas.

## Modulos no modificados

- Registro Diario
- Presupuesto
- Documentos
- Usuarios
- Inspecciones
- Reportes PDF
- Supabase
- Permisos reales remotos
