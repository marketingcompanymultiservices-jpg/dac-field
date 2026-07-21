"use client";

import { DirectionInspectionsBoard } from "@/components/DirectionInspectionsBoard";
import { HeaderMetric, ModuleHeader } from "@/components/ModuleHeader";
import { PageShell } from "@/components/PageShell";
import { useProjectStore } from "@/lib/project-store";

export default function DirectionInspectionsPage({ params }: { params: { projectId: string } }) {
  const { project } = useProjectStore();

  return (
    <PageShell activeItem="Inspecciones" projectId={params.projectId} backHref={"/projects/" + params.projectId} backLabel="Volver al Centro de Control">
      <ModuleHeader
        eyebrow="Modulo: Inspecciones de Direccion"
        title={project.name}
        meta={"Estado de obra: " + project.status}
        description="Observaciones independientes del Registro Diario para recorridos de direccion, asignacion de responsables y cierre trazable."
        aside={<HeaderMetric label="Modulo" value="Inspecciones" detail="Listado y seguimiento." />}
      />
      <DirectionInspectionsBoard />
    </PageShell>
  );
}
