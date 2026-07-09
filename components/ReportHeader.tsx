import { AppBrand } from "@/components/AppBrand";
import type { DailyReportEntry, Project } from "@/types";

export function ReportHeader({ project, report }: { project: Project; report: DailyReportEntry }) {
  return (
    <header className="w-full overflow-hidden rounded-lg border border-dac-primary/15 bg-white p-4 shadow-panel print:border-dac-primary/30 print:shadow-none sm:p-5">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[1fr_minmax(17rem,20rem)] lg:items-start">
        <div className="min-w-0">
          <AppBrand showMotto />
          <p className="mt-3 text-sm font-bold uppercase text-dac-secondary">Reporte Diario de Obra</p>
          <h1 className="mt-1 break-words text-2xl font-black text-dac-primary sm:text-3xl">{project.name}</h1>
          <p className="mt-2 break-words text-sm font-semibold text-dac-text/70">{project.address} - {project.city}</p>
        </div>
        <div className="min-w-0 rounded-lg bg-dac-primary p-4 text-white">
          <p className="text-xs font-bold uppercase text-white/70">Codigo del reporte</p>
          <p className="mt-1 break-all font-black leading-snug">{report.id}</p>
          <p className="mt-3 text-xs font-bold uppercase text-white/70">Fecha</p>
          <p className="mt-1 break-words font-black">{report.date}</p>
          <p className="mt-3 text-xs font-bold uppercase text-white/70">Estado</p>
          <p className="mt-1 break-words font-black">{report.status}</p>
        </div>
      </div>
    </header>
  );
}
