import { AdminPanel } from "@/components/AdminPanel";
import { ModuleHeader } from "@/components/ModuleHeader";
import { PageShell } from "@/components/PageShell";

export default function AdminPage() {
  return (
    <PageShell activeItem="Administracion">
      <ModuleHeader
        eyebrow="Configuracion del sistema"
        title="Administracion"
        meta="Empresa, usuarios, roles y permisos"
      />
      <AdminPanel />
    </PageShell>
  );
}
