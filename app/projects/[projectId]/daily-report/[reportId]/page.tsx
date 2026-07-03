"use client";

import Link from "next/link";
import { DailyReportView } from "@/components/DailyReportView";
import { PageShell } from "@/components/PageShell";
import { useAuth } from "@/components/AuthProvider";
import { useProjectStore } from "@/lib/project-store";

export default function DailyReportDetailPage({ params }: { params: { projectId: string; reportId: string } }) {
  const { audit, user } = useAuth();
  const { project, dailyReports, activities, commitments, photos } = useProjectStore();
  const report = dailyReports.find((item) => item.id === params.reportId);

  function printReport() {
    audit("Usuario imprimio reporte.", (user?.email ?? "Usuario") + " imprimio el reporte diario " + params.reportId + ".");
    window.print();
  }

  function simulatePdf() {
    audit("Usuario descargo informe.", (user?.email ?? "Usuario") + " solicito descarga PDF del reporte diario " + params.reportId + ".");
    window.alert("Exportacion PDF real disponible en Sprint futuro.");
  }

  return (
    <PageShell activeItem="Registro Diario" projectId={project.id} backHref={"/projects/" + project.id + "/daily-report"} backLabel="Volver a Registro Diario">
      <div className="mb-5 flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase text-dac-secondary">Reporte Diario Real</p>
          <h1 className="text-2xl font-black text-dac-primary">Consulta de registro diario</h1>
        </div>
        <div className="grid gap-2 sm:flex">
          <Link href={"/projects/" + project.id + "/daily-report"} className="focus-ring rounded-md border border-dac-primary/20 px-4 py-3 text-center text-sm font-black text-dac-primary hover:bg-dac-secondary/10">
            Volver
          </Link>
          <button type="button" onClick={printReport} className="focus-ring rounded-md bg-dac-primary px-4 py-3 text-sm font-black text-white hover:bg-dac-secondary">
            Imprimir
          </button>
          <button type="button" onClick={simulatePdf} className="focus-ring rounded-md border border-dac-alert px-4 py-3 text-sm font-black text-dac-alert hover:bg-dac-alert hover:text-white">
            Descargar PDF simulado
          </button>
        </div>
      </div>

      {!report ? (
        <section className="rounded-lg border border-dac-primary/15 bg-white p-6 shadow-panel">
          <h2 className="text-2xl font-black text-dac-primary">No se encontro el reporte diario solicitado.</h2>
          <p className="mt-2 text-sm font-semibold text-dac-text/70">Verifica el codigo del reporte o vuelve al Registro Diario.</p>
        </section>
      ) : (
        <DailyReportView project={project} report={report} activities={activities} commitments={commitments} photos={photos} />
      )}
    </PageShell>
  );
}
