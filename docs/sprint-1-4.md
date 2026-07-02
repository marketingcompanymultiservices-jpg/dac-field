# Sprint 1.4 - Módulo Documentos

Se creó el módulo Documentos como expediente digital de la obra piloto Quintas de Acuarela.

## Entregado

- Ruta `app/projects/[projectId]/documents/page.tsx`.
- Conexión del botón Documentos desde el Centro de Control.
- Mock local de documentos y carpetas en `lib/mock-data.ts`.
- Componentes reutilizables:
  - `components/DocumentCard.tsx`
  - `components/DocumentForm.tsx`
  - `components/DocumentFilters.tsx`
  - `components/DocumentSummary.tsx`
- Panel de carpetas para filtrar el expediente.
- Filtros por estado: Todos, Vigentes, Próximos a vencer, Reemplazados y Archivados.
- Buscador por nombre, carpeta, usuario u observación.
- Formulario local para agregar documentos con archivo simulado.

## Pendiente futuro

- Carga real de archivos.
- Almacenamiento en Supabase Storage.
- Versionamiento real y trazabilidad de reemplazos.
- Vencimientos con alertas automáticas.
- Permisos por rol para consulta, carga y aprobación documental.
