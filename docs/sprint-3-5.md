# Sprint 3.5 - Centro de Alertas Inteligentes

## Objetivo

Crear una bandeja central de alertas inteligentes para detectar riesgos operativos de la obra usando datos locales del Store Global.

## Ruta

`/projects/[projectId]/alerts`

## Accesos

Se agrega boton `Alertas` en:

- Menu principal.
- Centro de Control.
- Dashboard.

## Estructura de alerta

Cada alerta contiene:

- Tipo
- Prioridad
- Fecha
- Proyecto
- Actividad relacionada
- Responsable
- Estado
- Accion recomendada
- Detalle
- Enlace a detalle

## Tipos

- Actividad atrasada
- Compromiso vencido
- Registro diario faltante
- Registro sin fotografias
- Actividad sin movimiento
- Planificacion vencida
- Documento pendiente
- Observacion de interventoria pendiente

## Prioridades

- Critica
- Alta
- Media
- Baja

## Estados

- Nueva
- En proceso
- Atendida
- Cerrada

## Indicadores superiores

- Total alertas
- Criticas
- Pendientes
- Atendidas

## Filtros

- Prioridad
- Estado
- Responsable
- Tipo
- Fecha

## Reglas automaticas

El motor de alertas crea alertas cuando:

- Una planificacion vencio y no se completo.
- Un compromiso esta vencido o tiene fecha limite vencida.
- Un registro diario tiene menos de 5 fotografias.
- No existe registro diario o han pasado mas de 2 dias desde el ultimo.
- Una actividad con ejecucion no tiene movimiento en mas de 2 dias.
- Un documento esta proximo a vencer.
- Una observacion de interventoria sigue pendiente.

## Acciones

Cada alerta permite:

- Ver detalle.
- Marcar En proceso.
- Marcar Atendida.
- Cerrar.

## Bitacora

El Store registra eventos de sistema cuando:

- Se detecta una nueva alerta inteligente.
- Una alerta cambia de estado.
- Una alerta se cierra.

## Persistencia

Las alertas se calculan automaticamente desde los datos vivos. Solo se persisten:

- Estados modificados por el usuario.
- Alertas ya conocidas para evitar registrar la misma creacion repetidamente.

Persistencia:

- Store Global.
- `localStorage`.

## Archivos principales

- `lib/alerts.ts`
- `components/AlertsCenter.tsx`
- `app/projects/[projectId]/alerts/page.tsx`

## Restricciones respetadas

- No backend.
- No Supabase.
- No se rompen modulos existentes.
- No se duplica informacion operativa.
- Diseno responsive DAC.
