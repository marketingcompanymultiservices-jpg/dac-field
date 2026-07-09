"use client";

import { useMemo, useState } from "react";
import { addDaysISO, getPlanningExecution, getPlanningProgress, getPlanningStatus, getTodayISO, getWeekStartISO } from "@/lib/planning";
import type { ActivityPlanning, BudgetItem, BudgetProgressItem, DailyActivity, PlanningPriority, PlanningStatus } from "@/types";

type PlanningFilters = {
  weekStart: string;
  owner: string;
  priority: string;
  status: string;
};

type PlanningTableProps = {
  activities: DailyActivity[];
  budgetItems: BudgetItem[];
  planningItems: ActivityPlanning[];
  progressItems: BudgetProgressItem[];
  onDuplicateWeek: (fromWeekStart: string, toWeekStart: string) => void;
};

const statusOptions: Array<"Todos" | PlanningStatus> = ["Todos", "Pendiente", "En ejecucion", "Finalizada", "Atrasada"];
const priorityOptions: Array<"Todos" | PlanningPriority> = ["Todos", "Alta", "Media", "Baja"];

export function PlanningTable({ activities, budgetItems, planningItems, progressItems, onDuplicateWeek }: PlanningTableProps) {
  const today = getTodayISO();
  const [filters, setFilters] = useState<PlanningFilters>({
    weekStart: getWeekStartISO(today),
    owner: "Todos",
    priority: "Todos",
    status: "Todos"
  });
  const [targetWeek, setTargetWeek] = useState(addDaysISO(getWeekStartISO(today), 7));
  const [message, setMessage] = useState("");

  const budgetByItem = useMemo(() => new Map(budgetItems.map((item) => [item.item, item])), [budgetItems]);
  const progressByItem = useMemo(() => new Map(progressItems.map((item) => [item.item, item])), [progressItems]);
  const weekEnd = addDaysISO(filters.weekStart, 6);
  const owners = ["Todos", ...Array.from(new Set(planningItems.map((item) => item.owner).filter(Boolean)))];

  const rows = useMemo(() => {
    return planningItems
      .filter((planning) => planning.startDate >= filters.weekStart && planning.startDate <= weekEnd)
      .map((planning) => {
        const budgetItem = budgetByItem.get(planning.budgetItemId);
        const executed = getPlanningExecution(planning, activities);
        const status = getPlanningStatus(planning, executed, today);
        const percent = getPlanningProgress(planning, executed);
        const progressItem = progressByItem.get(planning.budgetItemId);
        return { planning, budgetItem, executed, status, percent, progressItem };
      })
      .filter((row) => {
        const matchesOwner = filters.owner === "Todos" || row.planning.owner === filters.owner;
        const matchesPriority = filters.priority === "Todos" || row.planning.priority === filters.priority;
        const matchesStatus = filters.status === "Todos" || row.status === filters.status;
        return matchesOwner && matchesPriority && matchesStatus;
      })
      .sort((a, b) => a.planning.startDate.localeCompare(b.planning.startDate) || a.planning.budgetItemId.localeCompare(b.planning.budgetItemId));
  }, [activities, budgetByItem, filters, planningItems, progressByItem, today, weekEnd]);

  function updateFilter(key: keyof PlanningFilters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function duplicateWeek() {
    if (!filters.weekStart || !targetWeek) return;
    onDuplicateWeek(filters.weekStart, targetWeek);
    setMessage("Se creo una nueva planificacion semanal.");
  }

  function exportPlanning() {
    setMessage("La exportacion de programacion quedo registrada.");
  }

  return (
    <section className="rounded-lg border border-dac-primary/15 bg-white shadow-panel">
      <div className="border-b border-dac-primary/10 p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-xl font-black text-dac-primary">Planificacion semanal</h2>
              <p className="mt-1 text-sm text-dac-text/70">Programacion operativa desde actividades del Presupuesto Maestro.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <label className="block">
                <span className="text-xs font-black uppercase text-dac-text/50">Duplicar hacia semana</span>
                <input type="date" value={targetWeek} onChange={(event) => setTargetWeek(getWeekStartISO(event.target.value))} className={controlClass} />
              </label>
              <button type="button" onClick={duplicateWeek} className="focus-ring self-end rounded-md bg-dac-primary px-4 py-2 text-sm font-black text-white hover:bg-dac-secondary">Duplicar semana</button>
              <button type="button" onClick={exportPlanning} className="focus-ring self-end rounded-md border border-dac-alert px-4 py-2 text-sm font-black text-dac-alert hover:bg-dac-alert hover:text-white">Exportar programacion</button>
            </div>
          </div>

          {message && <p className="rounded-md bg-dac-secondary/10 px-4 py-3 text-sm font-bold text-dac-primary">{message}</p>}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="block">
              <span className="text-xs font-black uppercase text-dac-text/50">Semana</span>
              <input type="date" value={filters.weekStart} onChange={(event) => updateFilter("weekStart", getWeekStartISO(event.target.value))} className={controlClass} />
              <span className="mt-1 block text-xs font-semibold text-dac-text/55">{filters.weekStart} a {weekEnd}</span>
            </label>
            <SelectFilter label="Responsable" value={filters.owner} options={owners} onChange={(value) => updateFilter("owner", value)} />
            <SelectFilter label="Prioridad" value={filters.priority} options={priorityOptions} onChange={(value) => updateFilter("priority", value)} />
            <SelectFilter label="Estado" value={filters.status} options={statusOptions} onChange={(value) => updateFilter("status", value)} />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] border-collapse text-left">
          <thead className="bg-dac-primary text-white">
            <tr>
              {["ITEM", "ACTIVIDAD", "UNIDAD", "CANTIDAD PROGRAMADA", "RESPONSABLE", "FECHA INICIO", "FECHA FIN", "PRIORIDAD", "ESTADO"].map((header) => (
                <th key={header} className="px-4 py-3 text-xs font-black uppercase">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ planning, budgetItem, executed, status, percent, progressItem }) => (
              <tr key={(planning.id ?? planning.budgetItemId) + planning.startDate} className="border-b border-dac-primary/10 align-top last:border-b-0">
                <td className="px-4 py-4 text-sm font-black text-dac-primary">{planning.budgetItemId}</td>
                <td className="px-4 py-4">
                  <p className="font-bold text-dac-text">{budgetItem?.description ?? "Actividad no encontrada"}</p>
                  <p className="mt-1 text-xs font-semibold text-dac-text/55">{budgetItem?.chapter ?? "Sin capitulo"}</p>
                  <p className="mt-1 text-xs font-semibold text-dac-primary">Avance total obra: {(progressItem?.progress ?? 0).toFixed(1)} %</p>
                </td>
                <td className="px-4 py-4 text-sm font-semibold">{budgetItem?.unit ?? "-"}</td>
                <td className="px-4 py-4">
                  <p className="text-sm font-black text-dac-primary">{formatNumber(planning.plannedQuantity)} {budgetItem?.unit ?? ""}</p>
                  <p className="mt-1 text-xs font-semibold text-dac-text/60">Ejecutado: {formatNumber(executed)} ({percent.toFixed(1)} %)</p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-dac-primary/10">
                    <div className="h-full rounded-full bg-dac-secondary" style={{ width: percent + "%" }} />
                  </div>
                </td>
                <td className="px-4 py-4 text-sm font-semibold">{planning.owner}</td>
                <td className="px-4 py-4 text-sm font-semibold">{planning.startDate}</td>
                <td className="px-4 py-4 text-sm font-semibold">{planning.endDate}</td>
                <td className="px-4 py-4"><span className={getPriorityClass(planning.priority)}>{planning.priority}</span></td>
                <td className="px-4 py-4"><span className={getStatusClass(status)}>{status}</span></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-sm font-semibold text-dac-text/60">No hay actividades programadas para esta semana o filtro.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const controlClass = "focus-ring mt-1 w-full rounded-md border border-dac-primary/15 bg-white px-3 py-2 text-sm font-semibold text-dac-text shadow-sm outline-none";

function SelectFilter({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
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

function getStatusClass(status: PlanningStatus) {
  if (status === "Finalizada") return "inline-flex rounded-full bg-dac-secondary/15 px-3 py-1 text-xs font-black text-dac-primary";
  if (status === "En ejecucion") return "inline-flex rounded-full bg-dac-alert/15 px-3 py-1 text-xs font-black text-dac-text";
  if (status === "Atrasada") return "inline-flex rounded-full bg-dac-alert/20 px-3 py-1 text-xs font-black text-dac-alert";
  return "inline-flex rounded-full bg-dac-primary/10 px-3 py-1 text-xs font-black text-dac-primary";
}

function getPriorityClass(priority?: string) {
  if (priority === "Alta") return "inline-flex rounded-full bg-dac-alert/15 px-3 py-1 text-xs font-black text-dac-alert";
  if (priority === "Media") return "inline-flex rounded-full bg-dac-secondary/15 px-3 py-1 text-xs font-black text-dac-primary";
  return "inline-flex rounded-full bg-dac-primary/10 px-3 py-1 text-xs font-black text-dac-text/70";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CO").format(value);
}
