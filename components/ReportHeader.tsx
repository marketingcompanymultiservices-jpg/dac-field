import { AppBrand } from "@/components/AppBrand";
import type { DailyReportEntry, Project } from "@/types";

export function ReportHeader({ project, report }: { project: Project; report: DailyReportEntry }) {
  return (
    <header className="rounded-lg border border-dac-primary/15 bg-white p-5 shadow-panel print:border-dac-primary/30 print:shadow-none">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <AppBrand showMotto />
          <p className="mt-3 text-sm font-bold uppercase text-dac-secondary">Reporte Diario de Obra</p>
          <h1 className="mt-1 text-3xl font-black text-dac-primary">{project.name}</h1>
          <p className="mt-2 text-sm font-semibold text-dac-text/70">{project.address} - {project.city}</p>
        </div>
        <div className="rounded-lg bg-dac-primary p-4 text-white sm:min-w-72">
          <p className="text-xs font-bold uppercase text-white/70">Codigo del reporte</p>
          <p className="mt-1 font-black">{report.id}</p>
          <p className="mt-3 text-xs font-bold uppercase text-white/70">Fecha</p>
          <p className="mt-1 font-black">{report.date}</p>
          <p className="mt-3 text-xs font-bold uppercase text-white/70">Estado</p>
          <p className="mt-1 font-black">{report.status}</p>
        </div>
      </div>
    </header>
  );
}
