# Sprint 3.1 - Modulo Administracion

## Objetivo

Crear la base administrativa de DAC para preparar la futura autenticacion con Supabase, manteniendo toda la informacion en Store Global y `localStorage`.

## Ruta

`/admin`

## Submodulos

### Empresa

Permite consultar y editar:

- Nombre empresa
- NIT
- Direccion
- Ciudad
- Correo
- Telefono
- Logo
- Subdominio futuro: `control.doblealturaconstrucciones.com.co`

El logo institucional se muestra con el componente reutilizable `AppLogo`.

### Usuarios

CRUD local completo:

- Crear usuario
- Editar usuario
- Activar / desactivar
- Eliminar

Campos:

- Nombre
- Apellido
- Correo
- Cargo
- Rol
- Estado
- Telefono
- Empresa
- Fecha creacion
- Activo
- Foto opcional

Usuarios iniciales:

- Jose Martinez - Director
- Hernan Aristizabal - Residente
- Oscar Ospina - Interventoria
- Oliver Mora - Supervisor Tecnico

### Roles

Roles iniciales editables:

- Administrador
- Director
- Residente
- Interventoria
- Supervisor Tecnico
- Consulta

Cada rol muestra:

- Cantidad de usuarios
- Descripcion editable
- Permisos asociados

### Permisos

Matriz local por rol.

Filas:

- Dashboard
- Registro Diario
- Bitacora
- Avance
- Presupuesto
- Reportes
- Documentos
- Compromisos
- Levantamiento Inicial
- Administracion

Columnas:

- Ver
- Crear
- Editar
- Eliminar
- Exportar
- Administrar

Los switches solo guardan configuracion. No implementan seguridad real todavia.

## Store Global

Se agregaron al Store:

- `adminCompany`
- `adminUsers`
- `adminRoles`
- `currentUser`

Acciones:

- `updateAdminCompany`
- `addAdminUser`
- `updateAdminUser`
- `deleteAdminUser`
- `updateAdminRole`
- `toggleRolePermission`

## Persistencia

La configuracion administrativa se guarda en `localStorage` junto con el resto del estado local de DAC.

## Header

El header general muestra:

- Usuario conectado
- Rol
- Empresa

## Preparacion Supabase

La estructura queda lista para mapear en un sprint futuro a tablas como:

- `companies`
- `users`
- `roles`
- `permissions`
- `role_permissions`

## Restricciones respetadas

- No se implemento autenticacion real.
- No se implemento Supabase.
- No se modifico Presupuesto.
- No se modifico Registro Diario.
- No se modifico la logica de avance.
- No se rompio navegacion existente.
