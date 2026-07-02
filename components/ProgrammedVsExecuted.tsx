"use client";

import { useMemo, useState } from "react";
import { buildProgrammedRows, buildSCurve, calculateProgrammedSummary, type ProgrammedStatus } from "@/lib/programmed-progress";
import { getTodayISO, getWeekStartISO } from "@/lib/planning";
import type { ActivityPlanning, BudgetItem, DailyActivity } from "@/types";

type ProgrammedVsExecutedProps = {
  activities: DailyActivity[];
  budgetItems: BudgetItem[];
  planningItems: ActivityPlanning[];
};

const statusOptions: Array<"Todos" | ProgrammedStatus> = ["Todos", "En tiempo", "Atrasada", "Adelantada", "Sin programacion"];
const numberFormatter = new Intl.NumberFormat("es-CO");

export function ProgrammedVsExecuted({ activities, budgetItems, planningItems }: ProgrammedVsExecutedProps) {
  const [weekStart, setWeekStart] = useState(getWeekStartISO(getTodayISO()));
  const [chapter, setChapter] = useState("Todos");
  const [status, setStatus] = useState("Todos");
  const [responsible, setResponsible] = useState("Todos");

  const chapters = ["Todos", ...Array.from(new Set(budgetItems.map((item) => item.chapter)))];
  const responsibles = ["Todos", ...Array.from(new Set(planningItems.map((item) => item.owner).filter(Boolean)))];
  const baseRows = useMemo(() => buildProgrammedRows({ activities, budgetItems, planningItems, weekStart }), [activities, budgetItems, planningItems, weekStart]);
  const rows = useMemo(() => {
    return baseRows.filter((row) => {
      const matchesChapter = chapter === "Todos" || row.chapter === chapter;
      const matchesStatus = status === "Todos" || row.status === status;
      const matchesResponsible = responsible === "Todos" || row.responsible === responsible;
      return matchesChapter && matchesStatus && matchesResponsible;
    });
  }, [baseRows, chapter, responsible, status]);
  const summary = useMemo(() => calculateProgrammedSummary(rows, budgetItems), [budgetItems, rows]);
  const curve = useMemo(() => buildSCurve(planningItems, activities, budgetItems), [activities, budgetItems, planningItems]);

  return (
    <section className="grid gap-6">
      <div className="rounded-lg border border-dac-primary/15 bg-white p-5 shadow-panel">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-dac-secondary">Programado vs Ejecutado</p>
            <h2 className="mt-1 text-2xl font-black text-dac-primary">Control de cumplimiento y Curva S basica</h2>
            <p className="mt-2 text-sm text-dac-text/70">Comparacion calculada desde Planificacion Semanal y Registro Diario.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select label="Semana" value={weekStart} onChange={(value) => setWeekStart(getWeekStartISO(value))} type="date" />
            <Select label="Capitulo" value={chapter} options={chapters} onChange={setChapter} />
            <Select label="Estado" value={status} options={statusOptions} onChange={setStatus} />
            <Select label="Responsable" value={responsible} options={responsibles} onChange={setResponsible} />
          </div>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Avance programado %" value={summary.programmedProgress.toFixed(1) + " %"} tone="primary" />
        <Metric label="Avance ejecutado %" value={summary.executedProgress.toFixed(1) + " %"} tone="secondary" />
        <Metric label="Desviacion %" value={summary.deviation.toFixed(1) + " %"} tone={summary.deviation < 0 ? "alert" : "secondary"} />
        <Metric label="Actividades atrasadas" value={String(summary.delayedActivities)} tone="alert" />
        <Metric label="Cumplimiento semanal %" value={summary.weeklyCompliance.toFixed(1) + " %"} tone="muted" />
      </section>

      <SCurve points={curve} />

      <section className="rounded-lg border border-dac-primary/15 bg-white shadow-panel">
        <div className="border-b border-dac-primary/10 p-5">
          <h3 className="text-xl font-black text-dac-primary">Detalle semanal</h3>
          <p className="mt-1 text-sm text-dac-text/70">{rows.length} actividades comparadas</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-dac-primary text-white">
              <tr>
                {["ITEM", "ACTIVIDAD", "UNIDAD", "PROGRAMADO", "EJECUTADO", "DIFERENCIA", "% CUMPLIMIENTO", "ESTADO"].map((header) => (
                  <th key={header} className="px-4 py-3 text-xs font-black uppercase">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.item + row.weekStart} className="border-b border-dac-primary/10 last:border-b-0">
                  <td className="px-4 py-4 text-sm font-black text-dac-primary">{row.item}</td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-dac-text">{row.activity}</p>
                    <p className="mt-1 text-xs font-semibold text-dac-text/55">{row.chapter} - {row.responsible}</p>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold">{row.unit}</td>
                  <td className="px-4 py-4 text-sm font-semibold">{numberFormatter.format(row.plannedQuantity)}</td>
                  <td className="px-4 py-4 text-sm font-semibold">{numberFormatter.format(row.executedQuantity)}</td>
                  <td className={(row.difference < 0 ? "text-dac-alert" : "text-dac-primary") + " px-4 py-4 text-sm font-black"}>{numberFormatter.format(row.difference)}</td>
                  <td className="px-4 py-4 text-sm font-black text-dac-primary">{row.compliance.toFixed(1)} %</td>
                  <td className="px-4 py-4"><span className={getStatusClass(row.status)}>{row.status}</span></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-sm font-semibold text-dac-text/60">No hay programacion para los filtros seleccionados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
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
      <p className="mt-3 text-2xl font-black">{value}</p>
    </article>
  );
}

function SCurve({ points }: { points: Array<{ week: string; programmed: number; executed: number }> }) {
  const maxValue = Math.max(...points.flatMap((point) => [point.programmed, point.executed]), 1);
  const width = 760;
  const height = 260;
  const padding = 34;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  function pointToXY(value: number, index: number) {
    const x = points.length <= 1 ? padding : padding + (index / (points.length - 1)) * plotWidth;
    const y = padding + plotHeight - (value / maxValue) * plotHeight;
    return x + "," + y;
  }

  const programmedPath = points.map((point, index) => pointToXY(point.programmed, index)).join(" ");
  const executedPath = points.map((point, index) => pointToXY(point.executed, index)).join(" ");

  return (
    <section className="rounded-lg border border-dac-primary/15 bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-xl font-black text-dac-primary">Curva S basica</h3>
          <p className="mt-1 text-sm text-dac-text/70">Valores acumulados por semana.</p>
        </div>
        <div className="flex gap-3 text-xs font-black">
          <span className="text-dac-secondary">Programado acumulado</span>
          <span className="text-dac-alert">Ejecutado acumulado</span>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <svg viewBox={"0 0 " + width + " " + height} className="h-72 min-w-[760px] rounded-md bg-dac-primary/[0.03]" role="img" aria-label="Curva S programado vs ejecutado">
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#004C6D" strokeOpacity="0.25" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#004C6D" strokeOpacity="0.25" />
          {points.length > 0 && <polyline points={programmedPath} fill="none" stroke="#00B2D7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
          {points.length > 0 && <polyline points={executedPath} fill="none" stroke="#D78C37" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
          {points.map((point, index) => {
            const [x, y] = pointToXY(point.executed, index).split(",").map(Number);
            return <circle key={point.week} cx={x} cy={y} r="4" fill="#D78C37" />;
          })}
          {points.map((point, index) => {
            const x = points.length <= 1 ? padding : padding + (index / (points.length - 1)) * plotWidth;
            return <text key={point.week} x={x} y={height - 10} textAnchor="middle" className="fill-dac-text text-[10px] font-bold">{point.week.slice(5)}</text>;
          })}
        </svg>
      </div>
    </section>
  );
}

function Select({ label, value, options, onChange, type = "select" }: { label: string; value: string; options?: string[]; onChange: (value: string) => void; type?: "select" | "date" }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase text-dac-text/50">{label}</span>
      {type === "date" ? (
        <input type="date" value={value} onChange={(event) => onChange(event.target.value)} className={controlClass} />
      ) : (
        <select value={value} onChange={(event) => onChange(event.target.value)} className={controlClass}>
          {(options ?? []).map((option) => <option key={option}>{option}</option>)}
        </select>
      )}
    </label>
  );
}

function getStatusClass(status: ProgrammedStatus) {
  if (status === "Atrasada") return "inline-flex rounded-full bg-dac-alert/20 px-3 py-1 text-xs font-black text-dac-alert";
  if (status === "Adelantada") return "inline-flex rounded-full bg-dac-secondary/15 px-3 py-1 text-xs font-black text-dac-primary";
  if (status === "Sin programacion") return "inline-flex rounded-full bg-dac-text/10 px-3 py-1 text-xs font-black text-dac-text/70";
  return "inline-flex rounded-full bg-dac-primary/10 px-3 py-1 text-xs font-black text-dac-primary";
}

const controlClass = "focus-ring mt-1 w-full rounded-md border border-dac-primary/15 bg-white px-3 py-2 text-sm font-semibold text-dac-text shadow-sm outline-none";
