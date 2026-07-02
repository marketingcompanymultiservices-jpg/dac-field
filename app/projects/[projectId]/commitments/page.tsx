"use client";

import { CommitmentsBoard } from "@/components/CommitmentsBoard";
import { HeaderMetric, ModuleHeader } from "@/components/ModuleHeader";
import { PageShell } from "@/components/PageShell";
import { useProjectStore } from "@/lib/project-store";

export default function ProjectCommitmentsPage() {
  const { project } = useProjectStore();

  return (
    <PageShell activeItem="Compromisos" projectId={project.id} backHref={"/projects/" + project.id} backLabel="Volver al Centro de Control">
      <ModuleHeader
        eyebrow="Modulo: Compromisos"
        title={project.name}
        meta={"Estado de obra: " + project.status}
        aside={<HeaderMetric label="Gestion de compromisos" value="Seguimiento global" detail="Los compromisos creados en Registro Diario aparecen aqui de inmediato." />}
      />

      <CommitmentsBoard />
    </PageShell>
  );
}
