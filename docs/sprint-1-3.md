# Sprint 1.3 - Módulo Compromisos

Se creó el módulo Compromisos para la obra piloto Quintas de Acuarela.

## Entregado

- Ruta `app/projects/[projectId]/commitments/page.tsx`.
- Conexión del botón Compromisos desde el Centro de Control.
- Mock local de compromisos en `lib/mock-data.ts`.
- Componentes reutilizables:
  - `components/CommitmentCard.tsx`
  - `components/CommitmentForm.tsx`
  - `components/CommitmentFilters.tsx`
  - `components/CommitmentSummary.tsx`
- Formulario local para agregar compromisos.
- Filtros por estado y prioridad Alta / Crítica.
- Cambio local de estado a En proceso o Cumplido.

## Pendiente futuro

- Persistencia de compromisos en Supabase/PostgreSQL.
- Notificaciones por fecha límite.
- Historial de cambios por usuario.
- Relación directa con Registro Diario, Bitácora, Fotografías e Interventoría.
