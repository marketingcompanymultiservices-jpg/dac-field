"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ReportCard } from "@/components/ReportCard";
import { ReportFilter, ReportFilters, reportMatchesFilter } from "@/components/ReportFilters";
import { ReportGenerator } from "@/components/ReportGenerator";
import { ReportSummary } from "@/components/ReportSummary";
import { useAuth } from "@/components/AuthProvider";
import { useProjectStore } from "@/lib/project-store";
import type { ProjectReport, ReportType } from "@/types";

export function ReportsBoard({ reportTypes }: { reportTypes: ReportType[] }) {
  const { audit, user } = useAuth();
  const {
    reports,
    dailyReports,
    activities,
    commitments,
    photos,
    progressSummary,
    executiveSummary,
    manualProgressChanges,
    addReport,
    deleteDraftReport
  } = useProjectStore();
  const [activeFilter, setActiveFilter] = useState<ReportFilter>("Todos");
  const [message, setMessage] = useState("");
  const [previewReport, setPreviewReport] = useState<ProjectReport | null>(null);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => reportMatchesFilter(report, activeFilter));
  }, [activeFilter, reports]);

  function handleAddReport(report: ProjectReport) {
    addReport({
      ...report,
      summary:
        "Actividades: " +
        activities.length +
        ". Fotos: " +
        photos.length +
        ". Compromisos pendientes: " +
        executiveSummary.commitmentsPending +
        ". Avance: " +
        executiveSummary.progress.toFixed(1) +
        " %. Actualizaciones manuales de avance: " +
        manualProgressChanges.length +
        "."
    });
    setMessage("Reporte generado correctamente.");
  }

  function simulateDownload(report: ProjectReport) {
    audit("Usuario descargo informe.", (user?.email ?? "Usuario") + " descargo el informe " + report.name + ".");
    setMessage("Descarga registrada.");
  }

  return (
    <div className="mt-6 grid gap-6">
      <ReportSummary reports={reports} reportTypes={reportTypes} />
      <section className="rounded-lg border border-dac-primary/15 bg-white p-4 shadow-panel sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-dac-secondary">Supabase</p>
            <h2 className="text-xl font-black text-dac-primary">Reportes diarios del proyecto</h2>
          </div>
          <p className="text-sm font-semibold text-dac-text/60">{dailyReports.length} encontrados</p>
        </div>
        <div className="mt-4 grid gap-2">
          {dailyReports.map((report) => (
            <Link
              key={report.id}
              href={"/projects/" + report.projectId + "/daily-report/" + report.id}
              className="focus-ring rounded-md border border-dac-primary/10 p-3 text-sm font-bold text-dac-primary hover:bg-dac-secondary/10"
            >
              {report.date} - {report.status} - {report.id} - {report.createdBy ?? "sin usuario"}
            </Link>
          ))}
          {dailyReports.length === 0 && (
            <p className="rounded-md border border-dac-primary/10 p-4 text-sm font-semibold text-dac-text/60">
              Aún no existen reportes registrados.
            </p>
          )}
        </div>
      </section>
      <ReportGenerator reportTypes={reportTypes} onGenerate={handleAddReport} />
      {message && (
        <p className="rounded-lg border border-dac-secondary/30 bg-dac-secondary/10 p-4 text-sm font-bold text-dac-primary">
          {message}
        </p>
      )}
      {previewReport && (
        <section className="rounded-lg border border-dac-primary/15 bg-white p-4 shadow-panel sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-dac-secondary">Vista previa con datos reales</p>
              <h2 className="mt-1 text-xl font-black text-dac-primary">{previewReport.name}</h2>
              <p className="mt-2 text-sm text-dac-text/70">{previewReport.summary || "Reporte conectado a la informacion del proyecto."}</p>
            </div>
            <button type="button" onClick={() => setPreviewReport(null)} className="focus-ring rounded-md border border-dac-primary px-4 py-2 text-sm font-bold text-dac-primary hover:bg-dac-primary hover:text-white">
              Cerrar vista
            </button>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <PreviewList title="Actividades" items={activities.map((item) => item.activity + " - " + item.quantity + " " + item.unit)} empty="Sin actividades registradas." />
            <PreviewList title="Compromisos" items={commitments.map((item) => item.description + " - " + item.status)} empty="Sin compromisos registrados." />
            <PreviewList title="Fotos por reporte" items={dailyReports.map((report) => report.date + " - " + photos.filter((photo) => photo.dailyReportId === report.id || photo.reportId === report.id).length + " fotos")} empty="Sin fotografias registradas." />
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Avance calculado" value={progressSummary.generalProgress.toFixed(1) + " %"} />
            <Info label="Fotos cargadas" value={String(photos.length)} />
            <Info label="Actividades" value={String(activities.length)} />
            <Info label="Compromisos pendientes" value={String(executiveSummary.commitmentsPending)} />
          </dl>
        </section>
      )}
      <ReportFilters activeFilter={activeFilter} onChange={setActiveFilter} />

      <section className="grid gap-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-dac-secondary">Listado</p>
            <h2 className="text-xl font-black text-dac-primary">Reportes generados</h2>
          </div>
          <p className="text-sm font-semibold text-dac-text/60">{filteredReports.length} visibles</p>
        </div>

        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onPreview={setPreviewReport}
              onDownload={simulateDownload}
              onDeleteDraft={deleteDraftReport}
            />
          ))
        ) : (
          <p className="rounded-lg border border-dac-primary/10 bg-white p-5 text-sm font-semibold text-dac-text/60">
            Aún no existen reportes registrados.
          </p>
        )}
      </section>
    </div>
  );
}

function PreviewList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="rounded-lg border border-dac-primary/10 p-4">
      <h3 className="font-black text-dac-primary">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-3 grid gap-2 text-sm text-dac-text/75">
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <p className="mt-3 text-sm font-semibold text-dac-text/60">{empty}</p>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-dac-primary/10 p-3">
      <dt className="text-xs font-bold uppercase text-dac-text/50">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-dac-text">{value}</dd>
    </div>
  );
}
