import { AppBrand } from "@/components/AppBrand";
import { ModuleHeader } from "@/components/ModuleHeader";
import { PageShell } from "@/components/PageShell";
import { appConfig, getVersionLabel } from "@/lib/appConfig";
import { getEnvironment } from "@/lib/environment";

export default function AboutPage() {
  const environment = getEnvironment();

  return (
    <PageShell activeItem="Acerca de" backHref="/dashboard" backLabel="Volver al Dashboard">
      <ModuleHeader
        eyebrow="Acerca de"
        title={appConfig.systemName}
        meta={getVersionLabel()}
        description="Informacion de version, empresa y creditos del proyecto DAC."
      />

      <section className="mt-6 rounded-lg border border-dac-primary/15 bg-white p-6 shadow-panel">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <AppBrand />
          <div className="rounded-lg bg-dac-primary p-5 text-white">
            <p className="text-sm font-bold opacity-75">Version</p>
            <p className="mt-2 text-3xl font-black">{getVersionLabel()}</p>
          </div>
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Nombre del sistema" value={environment.appName} />
          <Info label="Empresa" value={environment.company} />
          <Info label="Ambiente" value={environment.environment} />
          <Info label="Fecha de compilacion" value={appConfig.buildDate} />
          <Info label="Autor" value={appConfig.author} />
          <Info label="Version publica" value={environment.version} />
        </dl>

        <div className="mt-6 rounded-lg bg-dac-primary/[0.04] p-5">
          <p className="text-sm font-black uppercase text-dac-secondary">Creditos del proyecto</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-dac-text/75">{appConfig.credits}</p>
        </div>
      </section>
    </PageShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-dac-primary/10 p-4">
      <dt className="text-xs font-bold uppercase text-dac-text/50">{label}</dt>
      <dd className="mt-1 text-sm font-black text-dac-primary">{value}</dd>
    </div>
  );
}
