"use client";

import { HeaderMetric, ModuleHeader } from "@/components/ModuleHeader";
import { PageShell } from "@/components/PageShell";
import { ReportsBoard } from "@/components/ReportsBoard";
import { reportTypes } from "@/lib/production-data";
import { useProjectStore } from "@/lib/project-store";

export default function ReportsPage() {
  const { project } = useProjectStore();

  return (
    <PageShell activeItem="Reportes" projectId={project.id} backHref={"/projects/" + project.id} backLabel="Volver al Centro de Control">
      <ModuleHeader
        eyebrow="Modulo: Reportes"
        title={project.name}
        description="Centro de generacion y consulta de reportes con vista previa alimentada por Registro Diario."
        aside={<HeaderMetric label="Estado de obra" value={project.status} />}
      />

      <ReportsBoard reportTypes={reportTypes} />
    </PageShell>
  );
}
