import { AlertsCenter } from "@/components/AlertsCenter";
import { ModuleHeader } from "@/components/ModuleHeader";
import { PageShell } from "@/components/PageShell";

export default function ProjectAlertsPage({ params }: { params: { projectId: string } }) {
  return (
    <PageShell activeItem="Alertas" projectId={params.projectId} backHref={"/projects/" + params.projectId} backLabel="Volver al Centro de Control">
      <ModuleHeader
        eyebrow="Centro de Alertas Inteligentes"
        title="Alertas"
        meta="Reglas automaticas de seguimiento de obra"
      />
      <AlertsCenter />
    </PageShell>
  );
}
