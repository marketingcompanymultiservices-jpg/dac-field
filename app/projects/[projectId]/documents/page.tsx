"use client";

import { DocumentsBoard } from "@/components/DocumentsBoard";
import { HeaderMetric, ModuleHeader } from "@/components/ModuleHeader";
import { PageShell } from "@/components/PageShell";
import { documentFolders } from "@/lib/production-data";
import { useProjectStore } from "@/lib/project-store";

export default function ProjectDocumentsPage() {
  const { project } = useProjectStore();

  return (
    <PageShell activeItem="Documentos" projectId={project.id} backHref={"/projects/" + project.id} backLabel="Volver al Centro de Control">
      <ModuleHeader
        eyebrow="Modulo: Documentos / Expediente Digital"
        title={project.name}
        meta={"Estado de obra: " + project.status}
        aside={<HeaderMetric label="Expediente digital" value="Documentacion centralizada" detail="Sin backend por ahora. Los documentos viven en el store global." />}
      />

      <DocumentsBoard folders={documentFolders} />
    </PageShell>
  );
}
