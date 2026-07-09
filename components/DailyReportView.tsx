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

type ParsedPersonnel = {
  totalPeople: number;
  workers: Array<{ name: string; role: string; company?: string; observation?: string }>;
  legacy: Array<[string, string]>;
};

type ParsedMaterialsUsed = {
  items: Array<{ material: string; unit: string; quantity: number; observation?: string }>;
};

export function DailyReportView({ project, report, activities, commitments, photos }: DailyReportViewProps) {
  const [hydratedPhotos, setHydratedPhotos] = useState<Array<{ photo: DailyPhoto; dataUrl: string }>>([]);
  const reportActivities = activities.filter((activity) => activity.dailyReportId === report.id || (!activity.dailyReportId && activity.date === report.date));
  const budgetActivities = reportActivities.filter((activity) => Boolean(activity.budgetItemId));
  const freeActivities = reportActivities.filter((activity) => !activity.budgetItemId);
  const reportCommitments = commitments.filter((commitment) => {
    if (commitment.createdAt) return commitment.createdAt.slice(0, 10) === report.date;
    return commitment.dueDate === report.date || commitment.origin === "Registro Diario";
  });
  const reportPhotos = photos.filter((photo) => photo.dailyReportId === report.id || photo.reportId === report.id || (!photo.dailyReportId && !photo.reportId && photo.date === report.date));
  const totalPhotos = reportPhotos.length;
  const personnel = parsePersonnel(report);
  const materialsUsed = parseMaterialsUsed(report.material);
  const summary = buildSummary(personnel.totalPeople, budgetActivities.length, freeActivities.length, materialsUsed.items.length, reportCommitments.length, totalPhotos);

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
        <InfoGrid items={[["Numero total de personas", personnel.totalPeople > 0 ? numberFormatter.format(personnel.totalPeople) : "Sin registrar"]]} />
        {personnel.workers.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {personnel.workers.map((worker, index) => (
              <article key={worker.name + index} className="min-w-0 rounded-md border border-dac-primary/10 bg-dac-primary/[0.03] p-3">
                <p className="break-words text-sm font-black text-dac-primary">{worker.name}</p>
                <p className="mt-1 break-words text-sm font-semibold text-dac-text/70">{[worker.role, worker.company].filter(Boolean).join(" - ") || "Sin cargo"}</p>
                {worker.observation && <p className="mt-2 break-words text-sm text-dac-text/70">{worker.observation}</p>}
              </article>
            ))}
          </div>
        )}
        {personnel.legacy.length > 0 && <div className="mt-4"><InfoGrid items={personnel.legacy} /></div>}
      </ReportSection>

      <ReportSection title="Equipos y materiales">
        <InfoGrid items={[["Equipos utilizados", report.equipment ?? ""]]} />
        <div className="mt-4">
          <h3 className="text-sm font-black uppercase text-dac-primary">Material utilizado</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {materialsUsed.items.map((item, index) => (
              <article key={item.material + index} className="min-w-0 rounded-md border border-dac-primary/10 bg-dac-primary/[0.03] p-3">
                <p className="break-words text-sm font-black text-dac-primary">{item.material}</p>
                <p className="mt-1 break-words text-sm font-semibold text-dac-alert">{numberFormatter.format(item.quantity)} {item.unit}</p>
                {item.observation && <p className="mt-2 break-words text-sm text-dac-text/70">{item.observation}</p>}
              </article>
            ))}
            {materialsUsed.items.length === 0 && <p className="rounded-md border border-dac-primary/10 p-4 text-sm font-semibold text-dac-text/60">Sin material utilizado registrado.</p>}
          </div>
        </div>
      </ReportSection>

      <ReportSection title="Actividades presupuestales">
        <ActivityTable activities={budgetActivities} empty="No hay actividades presupuestales registradas para esta fecha." />
      </ReportSection>

      <ReportSection title="Actividades libres">
        <ActivityTable activities={freeActivities} empty="No hay actividades libres registradas para esta fecha." isFreeActivity />
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

function ActivityTable({ activities, empty, isFreeActivity = false }: { activities: DailyActivity[]; empty: string; isFreeActivity?: boolean }) {
  return (
    <>
      <div className="grid gap-3 md:hidden">
        {activities.map((activity) => (
          <article key={activity.id} className="min-w-0 rounded-md border border-dac-primary/10 bg-dac-primary/[0.03] p-3">
            <p className="break-words text-sm font-black text-dac-primary">{activity.activity}</p>
            <dl className="mt-3 grid gap-2 text-sm">
              {!isFreeActivity && <MobileInfo label="Cantidad" value={numberFormatter.format(activity.quantity) + " " + activity.unit} />}
              <MobileInfo label="Frente" value={activity.workFront || "Sin frente"} />
              <MobileInfo label="Responsable" value={activity.owner || "Sin responsable"} />
              <MobileInfo label="Horario" value={(activity.startTime || activity.time) + " - " + (activity.endTime || "Sin cierre")} />
              <MobileInfo label="Observacion" value={activity.observation || "Sin observacion."} />
            </dl>
          </article>
        ))}
        {activities.length === 0 && (
          <p className="rounded-md border border-dac-primary/10 p-4 text-sm font-semibold text-dac-text/60">{empty}</p>
        )}
      </div>

      <div className="hidden md:block">
        <table className="w-full table-fixed border-collapse text-left">
          <thead className="bg-dac-primary text-white">
            <tr>
              {(isFreeActivity ? ["Actividad", "Frente", "Responsable", "Horario", "Observacion"] : ["Actividad", "Cantidad", "Frente", "Responsable", "Horario", "Observacion"]).map((header, index) => (
                <th key={header} className={"px-3 py-3 text-xs font-black uppercase " + (index === 0 || header === "Observacion" ? "w-[28%]" : "w-[14%]")}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => (
              <tr key={activity.id} className="border-b border-dac-primary/10 last:border-b-0">
                <td className="break-words px-3 py-3 text-sm font-bold">{activity.activity}</td>
                {!isFreeActivity && <td className="break-words px-3 py-3 text-sm font-semibold">{numberFormatter.format(activity.quantity)} {activity.unit}</td>}
                <td className="break-words px-3 py-3 text-sm font-semibold">{activity.workFront || "Sin frente"}</td>
                <td className="break-words px-3 py-3 text-sm font-semibold">{activity.owner || "Sin responsable"}</td>
                <td className="break-words px-3 py-3 text-sm font-semibold">{activity.startTime || activity.time} - {activity.endTime || "Sin cierre"}</td>
                <td className="break-words px-3 py-3 text-sm text-dac-text/75">{activity.observation || "Sin observacion."}</td>
              </tr>
            ))}
            {activities.length === 0 && (
              <tr>
                <td colSpan={isFreeActivity ? 5 : 6} className="px-3 py-4 text-sm font-semibold text-dac-text/60">{empty}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function parsePersonnel(report: DailyReportEntry): ParsedPersonnel {
  const legacyEntries: Array<[string, string]> = [
    ["Personal administrativo", report.administrativeStaff ?? ""],
    ["Personal operativo", report.operativeStaff ?? ""],
    ["Contratistas", report.contractors ?? ""]
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  const fallback: ParsedPersonnel = {
    totalPeople: 0,
    workers: [],
    legacy: legacyEntries
  };

  try {
    const payload = JSON.parse(report.administrativeStaff || "");
    if (payload?.type !== "dac-personnel-v1") return fallback;
    return {
      totalPeople: Number(payload.totalPeople || payload.workers?.length || 0),
      workers: Array.isArray(payload.workers) ? payload.workers : [],
      legacy: []
    };
  } catch {
    return fallback;
  }
}

function parseMaterialsUsed(value?: string): ParsedMaterialsUsed {
  try {
    const payload = JSON.parse(value || "");
    if (payload?.type !== "dac-materials-used-v1") return { items: [] };
    return {
      items: Array.isArray(payload.items)
        ? payload.items.map((item: { material?: string; unit?: string; quantity?: number; observation?: string }) => ({
            material: item.material ?? "",
            unit: item.unit ?? "",
            quantity: Number(item.quantity || 0),
            observation: item.observation
          }))
        : []
    };
  } catch {
    return { items: [] };
  }
}

function buildSummary(peopleCount: number, budgetActivitiesCount: number, freeActivitiesCount: number, materialsCount: number, commitmentsCount: number, photosCount: number) {
  const peopleText = peopleCount > 0 ? "Durante la jornada laboraron " + numberFormatter.format(peopleCount) + " personas. " : "";

  return (
    peopleText +
    "Se registraron " +
    budgetActivitiesCount +
    " actividades presupuestales y " +
    freeActivitiesCount +
    " actividades libres. Se reportaron " +
    materialsCount +
    " materiales utilizados, " +
    commitmentsCount +
    " compromisos y " +
    photosCount +
    " fotografias."
  );
}
