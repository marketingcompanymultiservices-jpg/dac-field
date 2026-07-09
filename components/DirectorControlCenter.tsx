"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ModuleHeader } from "@/components/ModuleHeader";
import { PageShell } from "@/components/PageShell";
import { useAuth } from "@/components/AuthProvider";
import { buildProgrammedRows, calculateProgrammedSummary } from "@/lib/programmed-progress";
import { getTodayISO, getWeekStartISO } from "@/lib/planning";
import { buildActivityProductivity, calculateProductivitySummary } from "@/lib/productivity";
import { useProjectStore } from "@/lib/project-store";
import type { AdminPermissionModule, SmartAlert } from "@/types";

const currencyFormatter = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const numberFormatter = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });

type QuickAction = {
  href: string;
  label: string;
  permission: AdminPermissionModule;
  alert?: boolean;
};

export function DirectorControlCenter() {
  const { profile } = useAuth();
  const {
    activities,
    alerts,
    adminRoles,
    budgetItems,
    commitments,
    currentUser,
    dailyReports,
    isHydrated,
    lastSavedAt,
    photos,
    planningItems,
    progressItems,
    progressSummary,
    project,
    projects
  } = useProjectStore();
  const today = getTodayISO();
  const dashboardUser = profile ?? currentUser;
  const roleName = profile?.role ?? currentUser.role;
  const roleConfig = adminRoles.find((role) => role.name === roleName);
  const weekStart = getWeekStartISO(today);
  const todayActivities = activities.filter((activity) => activity.date === today);
  const todayPhotos = photos.filter((photo) => photo.date === today);
  const latestReport = dailyReports.slice().sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0];
  const todayReport = dailyReports.find((report) => report.date === today);
  const programmedRows = buildProgrammedRows({ activities, budgetItems, planningItems, weekStart });
  const programmedSummary = calculateProgrammedSummary(programmedRows, budgetItems);
  const productivityRows = buildActivityProductivity(activities, budgetItems);
  const productivitySummary = calculateProductivitySummary(productivityRows, weekStart);
  const topActivities = productivityRows.filter((row) => row.executedQuantity > 0).sort((a, b) => b.executedValue - a.executedValue).slice(0, 3);
  const inactiveActivities = productivityRows.filter((row) => row.status === "Sin movimiento" || row.status === "Baja productividad").slice(0, 3);
  const executiveAlerts = alerts.filter((alert) => (alert.priority === "Critica" || alert.priority === "Alta") && alert.status !== "Cerrada").slice(0, 4);
  const completedActivities = progressItems.filter((item) => item.progress >= 100).length;
  const activeActivities = progressItems.filter((item) => item.progress > 0 && item.progress < 100).length;
  const pendingActivities = progressItems.filter((item) => item.progress === 0).length;
  const weeklyProgrammed = programmedRows.length;
  const weeklyDelayed = programmedRows.filter((row) => row.status === "Atrasada").length;
  const pendingCommitments = commitments.filter((commitment) => commitment.status === "Pendiente").length;
  const overdueCommitments = commitments.filter((commitment) => commitment.status === "Vencido" || (commitment.status !== "Cumplido" && commitment.dueDate < today)).length;
  const completedCommitments = commitments.filter((commitment) => commitment.status === "Cumplido").length;
  const lastResponsible = todayActivities[0]?.owner || project.resident;
  const quickActionItems: QuickAction[] = [
    { href: "/projects/" + project.id + "/daily-report", label: "Registro Diario", permission: "Registro Diario" },
    { href: "/projects/" + project.id + "/direction-inspections", label: "Nueva Inspección", permission: "Inspecciones de Direccion", alert: true },
    { href: "/projects/" + project.id + "/progress", label: "Registrar Avance", permission: "Avance" },
    { href: "/projects/" + project.id + "/budget", label: "Presupuesto", permission: "Presupuesto" },
    { href: "/projects/" + project.id + "/reports", label: "Reportes", permission: "Reportes" },
    { href: "/projects/" + project.id + "/documents", label: "Documentos", permission: "Documentos" }
  ];
  const quickActions = quickActionItems.filter((action) => canView(action.permission, roleConfig, roleName));

  return (
    <PageShell activeItem="Dashboard">
      <ModuleHeader
        eyebrow="Centro de Control del Director"
        title={"Bienvenido, " + dashboardUser.firstName + " " + dashboardUser.lastName}
        meta={"Estado del proyecto: " + project.status}
        description="Tablero ejecutivo para control administrativo, tecnico y operativo de la obra."
      />

      <section className="mt-4">
        <Panel>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-dac-secondary">¿Qué desea hacer?</p>
              <h2 className="mt-1 text-xl font-black text-dac-primary">Acciones principales</h2>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {quickActions.map((action) => (
              <QuickLink key={action.href + action.label} href={action.href} label={action.label} alert={action.alert} />
            ))}
            {quickActions.length === 0 && <Empty text="No hay acciones disponibles para el rol actual." />}
          </div>
        </Panel>
      </section>

      <section className="mt-4 grid gap-3 xl:grid-cols-[1.45fr_0.55fr]">
        <Panel>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-dac-secondary">Resumen general</p>
              <h2 className="mt-1 text-xl font-black text-dac-primary">{project.name}</h2>
              <p className="mt-1 text-sm font-semibold text-dac-text/65">{project.address} / {project.city}</p>
            </div>
            <ProjectStatus status={project.status} />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Avance fisico" value={progressSummary.generalProgress.toFixed(1) + " %"} tone="primary" />
            <Metric label="Avance programado" value={programmedSummary.programmedProgress.toFixed(1) + " %"} tone="secondary" />
            <Metric label="Desviacion" value={programmedSummary.deviation.toFixed(1) + " %"} tone={programmedSummary.deviation < 0 ? "alert" : "secondary"} />
            <Metric label="Ultimo registro" value={latestReport?.date ?? "Sin registro"} tone="muted" />
            <Metric label="Valor ejecutado" value={currencyFormatter.format(progressSummary.executedValue)} tone="secondary" />
            <Metric label="Valor pendiente" value={currencyFormatter.format(progressSummary.pendingValue)} tone="muted" />
            <Metric label="Proyecto activo" value={projects.length + " / " + projects.length} tone="primary" />
            <Metric label="Ultima sincronizacion" value={formatSavedAt(lastSavedAt, isHydrated)} tone="muted" />
          </div>
        </Panel>

        <Panel>
          <p className="text-sm font-black uppercase text-dac-secondary">Estado operativo</p>
          <div className="mt-3 grid gap-2">
            <Info label="Registro diario recibido" value={todayReport ? todayReport.status : "No recibido"} />
            <Info label="Fotografias cargadas" value={String(todayPhotos.length)} />
            <Info label="Actividades ejecutadas" value={String(todayActivities.length)} />
            <Info label="Responsable" value={lastResponsible} />
          </div>
        </Panel>
      </section>

      <section className="mt-4 grid gap-3 xl:grid-cols-3">
        <Panel>
          <SectionHeader title="Alertas criticas" actionHref={"/projects/" + project.id + "/alerts"} actionLabel="Ver todas" />
          <div className="mt-3 grid gap-2">
            {executiveAlerts.map((alert) => <AlertLine key={alert.id} alert={alert} />)}
            {executiveAlerts.length === 0 && <Empty text="No hay alertas criticas o altas abiertas." />}
          </div>
        </Panel>

        <Panel>
          <p className="text-sm font-black uppercase text-dac-secondary">Productividad</p>
          <div className="mt-3 grid gap-2">
            <Info label="Produccion semanal" value={productivitySummary.weeklyProductivity.toFixed(1) + " %"} />
            <CompactList title="Mayor avance" items={topActivities.map((row) => row.item + " - " + row.activity + " / " + currencyFormatter.format(row.executedValue))} />
            <CompactList title="Sin movimiento" items={inactiveActivities.map((row) => row.item + " - " + row.activity)} />
          </div>
        </Panel>

        <Panel>
          <p className="text-sm font-black uppercase text-dac-secondary">Compromisos</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <MiniMetric label="Pendientes" value={pendingCommitments} />
            <MiniMetric label="Vencidos" value={overdueCommitments} alert />
            <MiniMetric label="Cumplidos" value={completedCommitments} />
          </div>
          <Link href={"/projects/" + project.id + "/commitments"} className="focus-ring mt-3 inline-flex w-full justify-center rounded-md border border-dac-primary px-3 py-2 text-sm font-black text-dac-primary hover:bg-dac-secondary/10">
            Ver compromisos
          </Link>
        </Panel>
      </section>

      <section className="mt-4 grid gap-3 xl:grid-cols-3">
        <Panel>
          <p className="text-sm font-black uppercase text-dac-secondary">Planeacion</p>
          <div className="mt-3 grid gap-2">
            <Info label="Programadas esta semana" value={String(weeklyProgrammed)} />
            <Info label="Actividades atrasadas" value={String(weeklyDelayed)} />
            <Info label="Cumplimiento semanal" value={programmedSummary.weeklyCompliance.toFixed(1) + " %"} />
          </div>
        </Panel>

        <Panel>
          <p className="text-sm font-black uppercase text-dac-secondary">Evidencia</p>
          <div className="mt-3 grid gap-2">
            <Info label="Fotografias cargadas hoy" value={String(todayPhotos.length)} />
            <Info label="Ultimo reporte enviado" value={latestReport ? latestReport.date + " / " + latestReport.status : "Sin reportes"} />
          </div>
          <Link href={latestReport ? "/projects/" + project.id + "/daily-report/" + latestReport.id : "/projects/" + project.id + "/daily-report"} className="focus-ring mt-3 inline-flex w-full justify-center rounded-md bg-dac-primary px-3 py-2 text-sm font-black text-white hover:bg-dac-secondary">
            Ver reporte
          </Link>
        </Panel>

        <Panel>
          <p className="text-sm font-black uppercase text-dac-secondary">Indicadores de Obra</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <MiniMetric label="Totales" value={progressItems.length} />
            <MiniMetric label="Finalizadas" value={completedActivities} />
            <MiniMetric label="En ejecucion" value={activeActivities} />
            <MiniMetric label="Sin iniciar" value={pendingActivities} alert={pendingActivities > 0} />
          </div>
        </Panel>
      </section>

      <section className="mt-4">
        <Panel>
          <p className="text-sm font-black uppercase text-dac-secondary">Portafolio de proyectos</p>
          <p className="mt-1 text-sm font-semibold text-dac-text/65">Estructura preparada para multiples proyectos. Hoy se muestra la obra activa disponible.</p>
          <div className="mt-3 grid gap-2">
            {projects.map((item) => (
              <Link key={item.id} href={"/projects/" + item.id} className="focus-ring rounded-lg border border-dac-primary/10 p-3 hover:border-dac-secondary hover:bg-dac-secondary/10">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-black text-dac-primary">{item.name}</p>
                    <p className="text-sm font-semibold text-dac-text/60">{item.city} / {item.director}</p>
                  </div>
                  <span className="rounded-full bg-dac-primary/10 px-3 py-1 text-xs font-black text-dac-primary">{item.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </Panel>
      </section>
    </PageShell>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <section className="rounded-lg border border-dac-primary/15 bg-white p-3.5 shadow-panel sm:p-4">{children}</section>;
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "primary" | "secondary" | "alert" | "muted" }) {
  const className =
    tone === "primary"
      ? "bg-dac-primary text-white"
      : tone === "secondary"
        ? "bg-dac-secondary/10 text-dac-primary"
        : tone === "alert"
          ? "bg-dac-alert/15 text-dac-text"
          : "bg-dac-primary/[0.04] text-dac-text";

  return (
    <article className={"rounded-md p-3 " + className}>
      <p className="text-xs font-black uppercase opacity-70">{label}</p>
      <p className="mt-1 text-lg font-black xl:text-xl">{value}</p>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-dac-primary/[0.04] p-2.5">
      <p className="text-xs font-bold uppercase text-dac-text/50">{label}</p>
      <p className="mt-1 text-sm font-black text-dac-primary">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) {
  return (
    <article className={(alert ? "bg-dac-alert/15" : "bg-dac-primary/[0.04]") + " rounded-md p-2.5 text-center"}>
      <p className={(alert ? "text-dac-alert" : "text-dac-primary") + " text-xl font-black"}>{numberFormatter.format(value)}</p>
      <p className="mt-1 text-xs font-bold text-dac-text/60">{label}</p>
    </article>
  );
}

function SectionHeader({ title, actionHref, actionLabel }: { title: string; actionHref: string; actionLabel: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-black uppercase text-dac-secondary">{title}</p>
      <Link href={actionHref} className="focus-ring rounded-md border border-dac-primary/15 px-3 py-2 text-xs font-black text-dac-primary hover:bg-dac-secondary/10">
        {actionLabel}
      </Link>
    </div>
  );
}

function AlertLine({ alert }: { alert: SmartAlert }) {
  return (
    <Link href={alert.href || "/projects/" + alert.projectId + "/alerts"} className="focus-ring block rounded-md border border-dac-primary/10 p-2.5 hover:border-dac-alert hover:bg-dac-alert/10">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black text-dac-alert">{alert.priority}</p>
        <p className="text-xs font-semibold text-dac-text/50">{alert.date}</p>
      </div>
      <p className="mt-1 text-sm font-black text-dac-primary">{alert.type}</p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold text-dac-text/65">{alert.detail}</p>
    </Link>
  );
}

function CompactList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-black uppercase text-dac-text/50">{title}</p>
      <div className="mt-2 grid gap-2">
        {items.map((item) => (
          <p key={item} className="truncate rounded-md border border-dac-primary/10 p-2 text-sm font-semibold text-dac-text/70" title={item}>{item}</p>
        ))}
        {items.length === 0 && <Empty text="Sin datos registrados." />}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-md border border-dac-primary/10 p-2.5 text-sm font-semibold text-dac-text/55">{text}</p>;
}

function QuickLink({ href, label, alert = false }: { href: string; label: string; alert?: boolean }) {
  return (
    <Link href={href} className={(alert ? "bg-dac-alert text-white hover:bg-dac-primary" : "bg-dac-primary text-white hover:bg-dac-secondary") + " focus-ring flex min-h-16 items-center justify-center rounded-lg p-3 text-center text-sm font-black shadow-sm"}>
      {label}
    </Link>
  );
}

function ProjectStatus({ status }: { status: string }) {
  const className =
    status === "Suspendida"
      ? "bg-dac-alert/15 text-dac-alert"
      : status === "Finalizada"
        ? "bg-dac-secondary/15 text-dac-primary"
        : "bg-dac-primary text-white";

  return <span className={"inline-flex rounded-full px-3 py-1.5 text-sm font-black " + className}>{status}</span>;
}

function formatSavedAt(lastSavedAt: string | null, isHydrated: boolean) {
  if (!isHydrated) return "Cargando";
  if (!lastSavedAt) return "Sin registros";
  return new Date(lastSavedAt).toLocaleString("es-CO", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function canView(permission: AdminPermissionModule, roleConfig: { permissions: Partial<Record<AdminPermissionModule, { Ver?: boolean }>> } | undefined, roleName: string) {
  if (roleName === "Administrador") return true;
  if (!roleConfig) return true;
  return roleConfig.permissions[permission]?.Ver ?? false;
}
