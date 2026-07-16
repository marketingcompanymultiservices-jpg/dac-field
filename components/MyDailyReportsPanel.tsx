"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useProjectStore } from "@/lib/project-store";
import type { AdminUser, DailyReportEntry } from "@/types";

const directorRoles = new Set(["administrador", "director administrativo", "director"]);

export function MyDailyReportsPanel() {
  const { profile, user } = useAuth();
  const { activities, dailyReports, isHydrated, photos, project } = useProjectStore();
  const today = getLocalDateISO();
  const role = getProfileRole(profile);
  const canViewAll = directorRoles.has(role);
  const userKeys = useMemo(() => buildUserKeys(profile, user?.email), [profile, user?.email]);

  const reports = useMemo(() => {
    const uniqueReports = new Map<string, DailyReportEntry>();

    dailyReports
      .filter((report) => report.projectId === project.id)
      .filter((report) => report.date === today)
      .filter((report) => canViewAll || belongsToUser(report, userKeys))
      .forEach((report) => uniqueReports.set(report.id, report));

    return Array.from(uniqueReports.values()).sort((a, b) => {
      const byDate = (b.date + " " + b.time).localeCompare(a.date + " " + a.time);
      if (byDate !== 0) return byDate;
      return (b.updatedAt ?? b.createdAt ?? "").localeCompare(a.updatedAt ?? a.createdAt ?? "");
    });
  }, [canViewAll, dailyReports, project.id, today, userKeys]);

  if (!isHydrated) {
    return (
      <section className="mt-6 rounded-lg border border-dac-primary/10 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-sm font-black uppercase text-dac-secondary">Mis reportes de hoy</p>
        <p className="mt-2 text-sm font-semibold text-dac-text/65">Cargando reportes...</p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-lg border border-dac-primary/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase text-dac-secondary">Mis reportes de hoy</p>
          <h2 className="mt-1 text-xl font-black text-dac-primary">Reportes enviados hoy: {reports.length}</h2>
          <p className="mt-1 text-sm font-semibold text-dac-text/65">{today}</p>
        </div>
        <Link href={"/projects/" + project.id + "/reports"} className="focus-ring rounded-md border border-dac-primary px-4 py-3 text-center text-sm font-black text-dac-primary hover:bg-dac-primary hover:text-white">
          Ver historial de reportes
        </Link>
      </div>

      <div className="mt-4 grid gap-3">
        {reports.length === 0 && (
          <p className="rounded-md border border-dac-primary/10 bg-dac-primary/[0.02] p-4 text-sm font-semibold text-dac-text/65">
            {canViewAll ? "No hay reportes enviados hoy." : "Aun no has enviado reportes hoy."}
          </p>
        )}

        {reports.map((report) => {
          const activityCount = activities.filter((activity) => activity.dailyReportId === report.id).length;
          const photoCount = photos.filter((photo) => photo.dailyReportId === report.id || photo.reportId === report.id).length;

          return (
            <article key={report.id} className="rounded-lg border border-dac-primary/10 bg-dac-primary/[0.025] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="break-words text-sm font-black text-dac-primary">{report.id}</p>
                  <p className="mt-1 text-xs font-bold uppercase text-dac-text/45">Guardado correctamente</p>
                </div>
                <Link href={"/projects/" + report.projectId + "/daily-report/" + report.id} className="focus-ring rounded-md bg-dac-primary px-3 py-2 text-center text-xs font-black text-white hover:bg-dac-secondary">
                  Ver reporte
                </Link>
              </div>

              <dl className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <ReportInfo label="Fecha" value={report.date} />
                <ReportInfo label="Hora" value={report.time || "Sin hora"} />
                <ReportInfo label="Estado" value={report.status} />
                <ReportInfo label="Actividades" value={String(activityCount)} />
                <ReportInfo label="Fotografias" value={String(photoCount)} />
              </dl>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ReportInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-3">
      <dt className="text-[11px] font-black uppercase text-dac-text/45">{label}</dt>
      <dd className="mt-1 break-words text-sm font-black text-dac-primary">{value}</dd>
    </div>
  );
}

function belongsToUser(report: DailyReportEntry, userKeys: Set<string>) {
  if (userKeys.size === 0) return false;
  const authorKeys = [report.createdBy, report.updatedBy].map(normalizeIdentity).filter(Boolean);
  return authorKeys.some((key) => userKeys.has(key));
}

function buildUserKeys(profile: ReturnType<typeof useAuth>["profile"], email?: string) {
  const keys = [
    email,
    profile?.email,
    profile ? (profile.firstName + " " + profile.lastName).trim() : "",
    profile?.firstName,
    profile?.lastName
  ];
  return new Set(keys.map(normalizeIdentity).filter(Boolean));
}

function getProfileRole(profile: AdminUser | null) {
  return normalizeIdentity(profile?.role);
}

function normalizeIdentity(value?: string | null) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getLocalDateISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}
