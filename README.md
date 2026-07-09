# DAC - Doble Altura Control

Sistema Integral de Gestion de Obras de Doble Altura Construcciones S.A.S.

DAC se encuentra preparado para ambiente de produccion. La plataforma no depende de datos ficticios para operar: presupuesto, reportes diarios, documentos e inspecciones se consultan desde Supabase segun los modulos ya integrados.

## Plataforma

- Next.js
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Database
- Supabase Storage para documentos
- Reporte Diario como fuente oficial de informacion operativa

## Dominio

https://control.doblealturaconstrucciones.com.co

## Modulos principales

- Dashboard ejecutivo
- Centro de Control de Obra
- Presupuesto Maestro
- Registro Diario
- Reportes diarios
- Avance de obra
- Planificacion semanal
- Levantamiento inicial
- Documentos
- Inspecciones de Direccion
- Compromisos
- Alertas
- Modo Obra
- Administracion
- Estado del Sistema

## Fuentes de informacion

- Autenticacion y perfiles: Supabase Auth y tabla `profiles`.
- Presupuesto: tablas `project_budget_versions` y `project_budget_items`.
- Registro Diario: tablas `daily_reports`, `report_activities`, `report_photos` y `commitments`.
- Documentos: Supabase Storage y metadatos del modulo Documentos.
- Inspecciones de Direccion: tablas `direction_inspections` y `direction_inspection_history`.

Si un proyecto no tiene informacion registrada, DAC muestra indicadores en cero o mensajes profesionales de ausencia de registros.

## Registro Diario

El Registro Diario es la fuente oficial de informacion operativa de DAC.

Incluye:

- informacion general de la jornada;
- personal de obra;
- equipos utilizados;
- material utilizado;
- actividades presupuestales;
- actividades libres;
- observaciones;
- problemas y acciones tomadas;
- compromisos;
- fotografias;
- firma del residente;
- vista imprimible del reporte.

Las actividades presupuestales actualizan el avance del presupuesto. Las actividades libres quedan documentadas en el reporte diario sin modificar cantidades ni valores del presupuesto.

## Presupuesto

El Presupuesto Maestro se importa desde Excel y se almacena en Supabase. Es la fuente oficial para calcular avance fisico y financiero.

## Produccion

DAC no incluye datos operativos ficticios en el ambiente de produccion. La configuracion base conserva unicamente estructuras necesarias para operar, como roles, permisos, carpetas documentales y tipos de reporte.

## Ejecucion local

```bash
npm install
npm run dev
```

## Compilacion

```bash
npm run build
```

## Variables de entorno

Crear `.env.local` con:

```env
NEXT_PUBLIC_APP_NAME=Doble Altura Control
NEXT_PUBLIC_VERSION=v1.0.0
NEXT_PUBLIC_ENV=Produccion
NEXT_PUBLIC_COMPANY=Doble Altura Construcciones S.A.S.
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## RC1

La limpieza RC1 elimina fuentes operativas ficticias del codigo activo, retira herramientas de reinicio de datos de muestra, limpia mensajes de desarrollo y deja la interfaz lista para uso operativo real.
