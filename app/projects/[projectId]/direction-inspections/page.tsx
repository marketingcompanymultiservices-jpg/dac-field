"use client";

import { DirectionInspectionsBoard } from "@/components/DirectionInspectionsBoard";
import { HeaderMetric, ModuleHeader } from "@/components/ModuleHeader";
import { PageShell } from "@/components/PageShell";
import { useProjectStore } from "@/lib/project-store";

export default function DirectionInspectionsPage({ params }: { params: { projectId: string } }) {
  const { directionInspections, project } = useProjectStore();
  const openCount = directionInspections.filter((inspection) => inspection.status !== "Cerrada").length;

  return (
    <PageShell activeItem="Inspecciones de Dirección" projectId={params.projectId} backHref={"/projects/" + params.projectId} backLabel="Volver al Centro de Control">
      <ModuleHeader
        eyebrow="Modulo: Inspecciones de Direccion"
        title={project.name}
        meta={"Estado de obra: " + project.status}
        description="Observaciones independientes del Registro Diario para recorridos de direccion, asignacion de responsables y cierre trazable."
        aside={<HeaderMetric label="Inspecciones abiertas" value={String(openCount)} detail="Seguimiento directo de direccion." />}
      />
      <DirectionInspectionsBoard />
    </PageShell>
  );
}
