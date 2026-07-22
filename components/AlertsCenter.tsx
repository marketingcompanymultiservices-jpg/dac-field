"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useProjectStore } from "@/lib/project-store";
import type { AlertPriority, AlertStatus, AlertType, SmartAlert } from "@/types";

type AlertFilters = {
  priority: string;
  status: string;
  responsible: string;
  type: string;
  date: string;
};

const priorities: Array<"Todas" | AlertPriority> = ["Todas", "Critica", "Alta", "Media", "Baja"];
const statuses: Array<"Todos" | AlertStatus> = ["Todos", "Nueva", "En proceso", "Atendida", "Cerrada"];
const types: Array<"Todos" | AlertType> = [
  "Todos",
  "Actividad atrasada",
  "Compromiso vencido",
  "Registro diario faltante",
  "Registro sin fotografias",
  "Actividad sin movimiento",
  "Actividad con baja productividad",
  "Planificacion vencida",
  "Documento pendiente",
  "Observacion de interventoria pendiente",
  "Inspeccion vencida",
  "Inspeccion proxima a vencer"
];

export function AlertsCenter() {
  const { profile } = useAuth();
  const { alerts, currentUser, updateAlertStatus } = useProjectStore();
  const roleName = profile?.role ?? currentUser.role;
  const currentProfileId = profile?.id ?? currentUser.id;
  const canViewAllDirectionInspections = canSeeAllInspections(roleName);
  const [filters, setFilters] = useState<AlertFilters>({
    priority: "Todas",
    status: "Todos",
    responsible: "Todos",
    type: "Todos",
    date: ""
  });

  const visibleAlerts = useMemo(
    () => alerts.filter((alert) => isAlertVisibleForInspections(alert, canViewAllDirectionInspections, currentProfileId)),
    [alerts, canViewAllDirectionInspections, currentProfileId]
  );
  const responsibles = ["Todos", ...Array.from(new Set(visibleAlerts.map((alert) => alert.responsible).filter(Boolean)))];
  const filteredAlerts = useMemo(() => {
    return visibleAlerts.filter((alert) => {
      const matchesPriority = filters.priority === "Todas" || alert.priority === filters.priority;
      const matchesStatus = filters.status === "Todos" || alert.status === filters.status;
      const matchesResponsible = filters.responsible === "Todos" || alert.responsible === filters.responsible;
      const matchesType = filters.type === "Todos" || alert.type === filters.type;
      const matchesDate = !filters.date || alert.date === filters.date;
      return matchesPriority && matchesStatus && matchesResponsible && matchesType && matchesDate;
    });
  }, [filters, visibleAlerts]);

  const total = visibleAlerts.length;
  const critical = visibleAlerts.filter((alert) => alert.priority === "Critica" && alert.status !== "Cerrada").length;
  const pending = visibleAlerts.filter((alert) => alert.status === "Nueva" || alert.status === "En proceso").length;
  const attended = visibleAlerts.filter((alert) => alert.status === "Atendida" || alert.status === "Cerrada").length;

  function updateFilter(key: keyof AlertFilters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="mt-6 grid gap-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Total alertas" value={String(total)} tone="primary" />
        <Metric label="Criticas" value={String(critical)} tone="alert" />
        <Metric label="Pendientes" value={String(pending)} tone="secondary" />
        <Metric label="Atendidas" value={String(attended)} tone="muted" />
      </section>

      <section className="rounded-lg border border-dac-primary/15 bg-white p-4 shadow-panel sm:p-5">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-black uppercase text-dac-secondary">Bandeja inteligente</p>
            <h2 className="text-2xl font-black text-dac-primary">Alertas de obra</h2>
            <p className="mt-1 text-sm text-dac-text/70">Reglas automaticas calculadas desde planificacion, registros, compromisos, documentos y fotografias.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Select label="Prioridad" value={filters.priority} options={priorities} onChange={(value) => updateFilter("priority", value)} />
            <Select label="Estado" value={filters.status} options={statuses} onChange={(value) => updateFilter("status", value)} />
            <Select label="Responsable" value={filters.responsible} options={responsibles} onChange={(value) => updateFilter("responsible", value)} />
            <Select label="Tipo" value={filters.type} options={types} onChange={(value) => updateFilter("type", value)} />
            <label className="block">
              <span className="text-xs font-black uppercase text-dac-text/50">Fecha</span>
              <input type="date" value={filters.date} onChange={(event) => updateFilter("date", event.target.value)} className={controlClass} />
            </label>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        {filteredAlerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} onStatusChange={updateAlertStatus} />
        ))}
        {filteredAlerts.length === 0 && (
          <p className="rounded-lg border border-dac-primary/10 bg-white p-5 text-sm font-semibold text-dac-text/60">
            No hay alertas para los filtros seleccionados.
          </p>
        )}
      </section>
    </div>
  );
}

function AlertCard({ alert, onStatusChange }: { alert: SmartAlert; onStatusChange: (id: string, status: AlertStatus) => void }) {
  return (
    <article className="rounded-lg border border-dac-primary/15 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className={getPriorityClass(alert.priority)}>{alert.priority}</span>
            <span className={getStatusClass(alert.status)}>{alert.status}</span>
            <span className="rounded-full bg-dac-primary/10 px-3 py-1 text-xs font-black text-dac-primary">{alert.type}</span>
          </div>
          <h3 className="mt-3 text-xl font-black text-dac-primary">{alert.detail}</h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Info label="Fecha" value={alert.date} />
            <Info label="Proyecto" value={alert.projectName} />
            <Info label="Actividad" value={alert.activityName || alert.activityId || "No aplica"} />
            <Info label="Responsable" value={alert.responsible} />
          </dl>
          <p className="mt-4 rounded-md bg-dac-primary/[0.04] p-3 text-sm font-semibold text-dac-text/75">
            <span className="font-black text-dac-primary">Accion recomendada: </span>
            {alert.recommendedAction}
          </p>
        </div>
        <div className="grid min-w-52 gap-2">
          <Link href={alert.href || "/projects/" + alert.projectId} className="focus-ring rounded-md bg-dac-primary px-4 py-3 text-center text-sm font-black text-white hover:bg-dac-secondary">
            Ver detalle
          </Link>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            <button type="button" onClick={() => onStatusChange(alert.id, "En proceso")} className="focus-ring rounded-md border border-dac-primary px-3 py-2 text-sm font-bold text-dac-primary hover:bg-dac-primary hover:text-white">En proceso</button>
            <button type="button" onClick={() => onStatusChange(alert.id, "Atendida")} className="focus-ring rounded-md border border-dac-secondary px-3 py-2 text-sm font-bold text-dac-primary hover:bg-dac-secondary/10">Atendida</button>
            <button type="button" onClick={() => onStatusChange(alert.id, "Cerrada")} className="focus-ring rounded-md border border-dac-alert px-3 py-2 text-sm font-bold text-dac-alert hover:bg-dac-alert hover:text-white">Cerrar</button>
          </div>
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  const className =
    tone === "primary"
      ? "border-dac-primary/20 bg-dac-primary text-white"
      : tone === "alert"
        ? "border-dac-alert/30 bg-dac-alert/10 text-dac-text"
        : tone === "secondary"
          ? "border-dac-secondary/25 bg-dac-secondary/10 text-dac-primary"
          : "border-dac-primary/10 bg-white text-dac-text";

  return (
    <article className={"rounded-lg border p-4 shadow-sm " + className}>
      <p className="text-sm font-bold opacity-75">{label}</p>
      <p className="mt-3 text-3xl font-black">{value}</p>
    </article>
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

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase text-dac-text/50">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={controlClass}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function getPriorityClass(priority: AlertPriority) {
  if (priority === "Critica") return "rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white";
  if (priority === "Alta") return "rounded-full bg-dac-alert/15 px-3 py-1 text-xs font-black text-dac-alert";
  if (priority === "Media") return "rounded-full bg-dac-secondary/15 px-3 py-1 text-xs font-black text-dac-primary";
  return "rounded-full bg-dac-primary/10 px-3 py-1 text-xs font-black text-dac-text/70";
}

function getStatusClass(status: AlertStatus) {
  if (status === "Cerrada") return "rounded-full bg-dac-text/15 px-3 py-1 text-xs font-black text-dac-text";
  if (status === "Atendida") return "rounded-full bg-dac-secondary/15 px-3 py-1 text-xs font-black text-dac-primary";
  if (status === "En proceso") return "rounded-full bg-dac-alert/15 px-3 py-1 text-xs font-black text-dac-text";
  return "rounded-full bg-dac-primary/10 px-3 py-1 text-xs font-black text-dac-primary";
}

const controlClass = "focus-ring mt-1 w-full rounded-md border border-dac-primary/15 bg-white px-3 py-2 text-sm font-semibold text-dac-text shadow-sm outline-none";

function canSeeAllInspections(roleName: string) {
  return ["administrador", "director", "director administrativo"].includes(normalizeRole(roleName));
}

function isAlertVisibleForInspections(alert: SmartAlert, canViewAllInspections: boolean, currentProfileId: string | undefined) {
  if (alert.type !== "Inspeccion vencida" && alert.type !== "Inspeccion proxima a vencer") return true;
  if (canViewAllInspections) return true;
  return Boolean(currentProfileId && alert.responsibleProfileId === currentProfileId);
}

function normalizeRole(role: string) {
  return role
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}
