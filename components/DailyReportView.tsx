"use client";

import { useEffect, useState } from "react";
import { ReportHeader } from "@/components/ReportHeader";
import { InfoGrid, ReportSection } from "@/components/ReportSection";
import { getImagesByDailyReportId, getImagesByDate } from "@/lib/imageStorage";
import type { Commitment, DailyActivity, DailyPhoto, DailyReportEntry, Project } from "@/types";

type DailyReportViewProps = {
  project: Project;
  report: DailyReportEntry;
  activities: DailyActivity[];
  commitments: Commitment[];
  photos: DailyPhoto[];
};

const numberFormatter = new Intl.NumberFormat("es-CO");

export function DailyReportView({ project, report, activities, commitments, photos }: DailyReportViewProps) {
  const [hydratedPhotos, setHydratedPhotos] = useState<Array<{ photo: DailyPhoto; dataUrl: string }>>([]);
  const reportActivities = activities.filter((activity) => activity.dailyReportId === report.id || (!activity.dailyReportId && activity.date === report.date));
  const reportCommitments = commitments.filter((commitment) => {
    if (commitment.createdAt) return commitment.createdAt.slice(0, 10) === report.date;
    return commitment.dueDate === report.date || commitment.origin === "Registro Diario";
  });
  const reportPhotos = photos.filter((photo) => photo.dailyReportId === report.id || photo.reportId === report.id || (!photo.dailyReportId && !photo.reportId && photo.date === report.date));
  const totalPhotos = reportPhotos.length;
  const summary = buildSummary(reportActivities, reportCommitments.length, totalPhotos);

  useEffect(() => {
    let active = true;

    async function loadImages() {
      try {
        const byReport = await getImagesByDailyReportId(report.id, photos);
        const entries = byReport.length > 0 ? byReport : await getImagesByDate(report.date, photos);
        if (active) setHydratedPhotos(entries);
      } catch (error) {
        console.error("[DAC DailyReportView] Excepcion controlada leyendo fotografias del reporte", {
          file: "components/DailyReportView.tsx",
          function: "loadImages",
          line: "ver sourcemap/build",
          reportId: report.id,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        if (active) setHydratedPhotos([]);
      }
    }

    loadImages();
    return () => {
      active = false;
    };
  }, [photos, report.date, report.id]);

  return (
    <article className="grid w-full min-w-0 gap-4 overflow-hidden print:gap-4 sm:gap-5">
      <ReportHeader project={project} report={report} />

      <ReportSection title="Resumen automatico">
        <p className="break-words leading-7 text-dac-text/80">{summary}</p>
      </ReportSection>

      <ReportSection title="Informacion general">
        <InfoGrid
          items={[
            ["Fecha", report.date],
            ["Hora", report.time],
            ["Clima", report.weather],
            ["Residente", report.signature || project.resident],
            ["Estado del registro", report.status],
            ["Proyecto", project.name]
          ]}
        />
      </ReportSection>

      <ReportSection title="Personal en obra">
        <InfoGrid
          items={[
            ["Personal administrativo", report.administrativeStaff ?? ""],
            ["Personal operativo", report.operativeStaff ?? ""],
            ["Contratistas", report.contractors ?? ""]
          ]}
        />
      </ReportSection>

      <ReportSection title="Equipos y materiales">
        <InfoGrid
          items={[
            ["Equipos utilizados", report.equipment ?? ""],
            ["Materiales recibidos", report.material ?? ""]
          ]}
        />
      </ReportSection>

      <ReportSection title="Actividades ejecutadas">
        <div className="grid gap-3 md:hidden">
          {reportActivities.map((activity) => (
            <article key={activity.id} className="min-w-0 rounded-md border border-dac-primary/10 bg-dac-primary/[0.03] p-3">
              <p className="break-words text-sm font-black text-dac-primary">{activity.activity}</p>
              <dl className="mt-3 grid gap-2 text-sm">
                <MobileInfo label="Cantidad" value={numberFormatter.format(activity.quantity) + " " + activity.unit} />
                <MobileInfo label="Frente" value={activity.workFront || "Sin frente"} />
                <MobileInfo label="Responsable" value={activity.owner || "Sin responsable"} />
                <MobileInfo label="Horario" value={(activity.startTime || activity.time) + " - " + (activity.endTime || "Sin cierre")} />
                <MobileInfo label="Observacion" value={activity.observation || "Sin observacion."} />
              </dl>
            </article>
          ))}
          {reportActivities.length === 0 && (
            <p className="rounded-md border border-dac-primary/10 p-4 text-sm font-semibold text-dac-text/60">No hay actividades registradas para esta fecha.</p>
          )}
        </div>

        <div className="hidden md:block">
          <table className="w-full table-fixed border-collapse text-left">
            <thead className="bg-dac-primary text-white">
              <tr>
                {["Actividad", "Cantidad", "Frente", "Responsable", "Horario", "Observacion"].map((header, index) => (
                  <th key={header} className={"px-3 py-3 text-xs font-black uppercase " + (index === 0 || index === 5 ? "w-[24%]" : "w-[13%]")}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportActivities.map((activity) => (
                <tr key={activity.id} className="border-b border-dac-primary/10 last:border-b-0">
                  <td className="break-words px-3 py-3 text-sm font-bold">{activity.activity}</td>
                  <td className="break-words px-3 py-3 text-sm font-semibold">{numberFormatter.format(activity.quantity)} {activity.unit}</td>
                  <td className="break-words px-3 py-3 text-sm font-semibold">{activity.workFront || "Sin frente"}</td>
                  <td className="break-words px-3 py-3 text-sm font-semibold">{activity.owner || "Sin responsable"}</td>
                  <td className="break-words px-3 py-3 text-sm font-semibold">{activity.startTime || activity.time} - {activity.endTime || "Sin cierre"}</td>
                  <td className="break-words px-3 py-3 text-sm text-dac-text/75">{activity.observation || "Sin observacion."}</td>
                </tr>
              ))}
              {reportActivities.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-sm font-semibold text-dac-text/60">No hay actividades registradas para esta fecha.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ReportSection>

      <ReportSection title="Observaciones">
        <p className="break-words leading-7 text-dac-text/80">{report.observations || "Sin observaciones registradas."}</p>
      </ReportSection>

      <ReportSection title="Problemas y acciones">
        <InfoGrid
          items={[
            ["Problemas", report.problems],
            ["Acciones tomadas", report.actions]
          ]}
        />
      </ReportSection>

      <ReportSection title="Compromisos">
        <div className="grid gap-3">
          {reportCommitments.map((commitment) => (
            <article key={commitment.id} className="min-w-0 rounded-md border border-dac-primary/10 p-3">
              <p className="break-words font-black text-dac-primary">{commitment.description}</p>
              <p className="mt-1 break-words text-sm font-semibold text-dac-text/70">{commitment.owner} - {commitment.priority} - {commitment.status}</p>
              <p className="mt-1 break-words text-sm font-semibold text-dac-alert">Fecha limite: {commitment.dueDate}</p>
            </article>
          ))}
          {reportCommitments.length === 0 && <p className="text-sm font-semibold text-dac-text/60">Sin compromisos asociados a la jornada.</p>}
        </div>
      </ReportSection>

      <ReportSection title="Registro fotografico">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {hydratedPhotos.map(({ photo, dataUrl }, index) => (
            <figure key={photo.id} className="min-w-0 break-inside-avoid rounded-md border border-dac-primary/15 bg-white p-2">
              <img src={dataUrl} alt={photo.description || photo.name} className="h-auto max-h-72 w-full rounded object-cover sm:h-44 print:h-36" />
              <figcaption className="mt-2 break-words text-xs font-semibold text-dac-text/70">
                Foto {index + 1}: {photo.description || photo.name}
              </figcaption>
            </figure>
          ))}
          {hydratedPhotos.length === 0 && (
            <div className="flex min-h-28 items-center justify-center rounded-md border border-dac-primary/15 bg-dac-secondary/10 p-3 text-center text-sm font-black text-dac-primary">
              Sin fotografias
            </div>
          )}
        </div>
      </ReportSection>

      <ReportSection title="Firma del residente">
        <div className="min-w-0 rounded-md border border-dac-primary/15 p-5">
          <p className="text-sm font-bold text-dac-text/60">Firma simulada</p>
          <p className="mt-4 break-words text-2xl font-black text-dac-primary">{report.signature || project.resident}</p>
        </div>
      </ReportSection>
    </article>
  );
}

function MobileInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded bg-white p-2">
      <dt className="text-[11px] font-black uppercase text-dac-text/50">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-dac-text">{value}</dd>
    </div>
  );
}

function buildSummary(activities: DailyActivity[], commitmentsCount: number, photosCount: number) {
  const uniqueActivities = Array.from(new Set(activities.map((activity) => activity.activity))).slice(0, 4);
  const activityText = uniqueActivities.length > 0 ? uniqueActivities.join(", ") : "sin actividades registradas";

  return (
    "Durante la jornada se ejecutaron actividades de " +
    activityText +
    ", con un total de " +
    activities.length +
    " registros de avance. Se reportaron " +
    commitmentsCount +
    " compromisos y " +
    photosCount +
    " fotografias."
  );
}
