"use client";

import Link from "next/link";
import { ModuleHeader } from "@/components/ModuleHeader";
import { PageShell } from "@/components/PageShell";
import { useProjectStore } from "@/lib/project-store";

export default function BitacoraPage() {
  const { project, timeline, dailyReports } = useProjectStore();

  return (
    <PageShell activeItem="Bitacora" projectId={project.id} backHref={"/projects/" + project.id} backLabel="Volver al Centro de Control">
      <ModuleHeader eyebrow="Bitacora" title={project.name} description="Linea de tiempo alimentada automaticamente desde Registro Diario." />

      {dailyReports.length > 0 && (
        <section className="mt-6 rounded-lg border border-dac-primary/15 bg-white p-5 shadow-panel">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-dac-primary">Reportes diarios disponibles</h2>
              <p className="mt-1 text-sm font-semibold text-dac-text/70">Consulta los informes generados desde Registro Diario.</p>
            </div>
            <Link href={"/projects/" + project.id + "/daily-report/" + dailyReports[0].id} className="focus-ring rounded-md bg-dac-primary px-4 py-3 text-center text-sm font-black text-white hover:bg-dac-secondary">
              Ver reporte diario
            </Link>
          </div>
          <div className="mt-4 grid gap-2">
            {dailyReports.slice(0, 5).map((report) => (
              <Link key={report.id} href={"/projects/" + project.id + "/daily-report/" + report.id} className="focus-ring rounded-md border border-dac-primary/10 p-3 text-sm font-bold text-dac-primary hover:bg-dac-secondary/10">
                {report.date} - {report.status} - {report.id}
              </Link>
            ))}
          </div>
        </section>
      )}
      {dailyReports.length === 0 && (
        <section className="mt-6 rounded-lg border border-dac-primary/15 bg-white p-5 shadow-panel">
          <h2 className="text-xl font-black text-dac-primary">Reportes diarios disponibles</h2>
          <p className="mt-1 text-sm font-semibold text-dac-text/70">No se encontraron reportes para este proyecto en Supabase.</p>
        </section>
      )}

      <section className="mt-6 rounded-lg border border-dac-primary/15 bg-white p-5 shadow-panel sm:p-6">
        <ol className="relative border-l-2 border-dac-secondary/40 pl-5">
          {timeline.map((event) => (
            <li key={event.id ?? event.title + event.time} className="relative pb-7 last:pb-0">
              <span className="absolute -left-[1.95rem] top-1 h-4 w-4 rounded-full border-4 border-white bg-dac-secondary shadow" />
              <time className="text-sm font-black text-dac-alert">{event.time}</time>
              <h2 className="mt-1 text-xl font-black text-dac-primary">{event.title}</h2>
              <p className="mt-1 text-dac-text/75">{event.description}</p>
            </li>
          ))}
        </ol>
      </section>
    </PageShell>
  );
}
