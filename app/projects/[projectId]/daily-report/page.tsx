"use client";

import { DailyReportWizard } from "@/components/DailyReportWizard";
import { ModuleHeader } from "@/components/ModuleHeader";
import { PageShell } from "@/components/PageShell";
import { useProjectStore } from "@/lib/project-store";

export default function DailyReportPage() {
  const { project } = useProjectStore();

  return (
    <PageShell activeItem="Registro Diario" projectId={project.id} backHref={"/projects/" + project.id} backLabel="Volver al Centro de Control">
      <ModuleHeader
        eyebrow="Registro Diario"
        title={project.name}
        description="Completa el registro por pasos. Actividades, compromisos y fotografias alimentan automaticamente los demas modulos."
      />
      <DailyReportWizard projectName={project.name} />
    </PageShell>
  );
}
