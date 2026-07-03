# Sprint 5.1 - Supabase, Login Real y Roles Iniciales

## Objetivo

Implementar autenticacion real con Supabase Auth, reemplazar el login simulado y preparar roles iniciales sin migrar todavia los datos operativos.

## Alcance

- Login real con Supabase.
- Rutas protegidas por sesion.
- Usuario autenticado visible en header.
- Roles y usuarios iniciales en estructura local.
- Auditoria local en Bitacora.
- Mocks temporales conservados para proyectos, presupuesto, avance, reportes y documentos.

## Supabase

Dependencia:

- `@supabase/supabase-js`

Ya existe en `package.json`.

Cliente creado:

- `lib/supabaseClient.ts`

Variables usadas:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Si las variables no existen, DAC muestra:

- `Supabase no está configurado.`

## Login real

Archivo actualizado:

- `app/page.tsx`

El login ahora usa:

- Correo.
- Contrasena.
- Estado loading.
- Errores visibles.
- Redireccion a `/dashboard` al iniciar sesion.

## AuthProvider

Archivo creado:

- `components/AuthProvider.tsx`

Maneja:

- Sesion activa.
- Usuario autenticado.
- Perfil local por correo.
- Estado loading.
- Logout.
- Funcion `audit()` para registrar eventos de auditoria.

El provider envuelve la aplicacion en:

- `app/layout.tsx`

## Proteccion de rutas

Si no existe sesion activa, las rutas internas redirigen a:

- `/`

La ruta publica es:

- `/`

## Header

Archivo actualizado:

- `components/PageShell.tsx`

Ahora muestra:

- Usuario real autenticado.
- Rol local asociado por correo.
- Empresa.
- Boton salir con logout real.

## Roles base

Roles iniciales:

- Administrador.
- Director Administrativo.
- Residente de Obra.
- Interventoria.
- Supervisor Tecnico.
- Auxiliar Administrativa.
- Consulta.

## Usuarios iniciales

Usuarios preparados en estructura local:

- Jose Martinez / Director Administrativo.
- Hernan Aristizabal / Residente de Obra.
- Oscar Ospina / Interventoria.
- Oliver Mora / Supervisor Tecnico.
- Juliana / Auxiliar Administrativa.

## Auxiliar Administrativa

Puede:

- Ver informacion.
- Descargar informes.
- Imprimir reportes.
- Exportar documentos.

No puede:

- Eliminar informacion.
- Modificar presupuestos.
- Crear obras.
- Aprobar compras.
- Cambiar usuarios.
- Cambiar configuracion del sistema.

## Auditoria local

Se registran eventos en Bitacora para:

- Usuario inicio sesion.
- Usuario cerro sesion.
- Usuario descargo informe.
- Usuario imprimio reporte.
- Usuario exporto documento.

La auditoria usa:

- `addSystemEvent`
- `useAuth().audit()`

## Mocks conservados

Se mantienen en memoria/localStorage:

- Proyectos.
- Presupuesto.
- Avance.
- Reportes.
- Documentos.

## Pendiente para siguientes sprints

- Crear tablas reales en Supabase.
- Migrar proyectos.
- Migrar presupuesto.
- Migrar reportes y documentos.
- Implementar seguridad real por permisos en servidor.
