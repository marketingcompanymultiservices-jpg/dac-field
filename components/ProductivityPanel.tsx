"use client";

import { useMemo, useState } from "react";
import { buildActivityProductivity, buildResponsibleProductivity, calculateProductivitySummary, type ProductivityStatus } from "@/lib/productivity";
import { getTodayISO, getWeekStartISO } from "@/lib/planning";
import type { BudgetItem, Commitment, DailyActivity, SmartAlert } from "@/types";

type ProductivityPanelProps = {
  activities: DailyActivity[];
  alerts: SmartAlert[];
  budgetItems: BudgetItem[];
  commitments: Commitment[];
};

const currencyFormatter = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const numberFormatter = new Intl.NumberFormat("es-CO");
const statuses: Array<"Todos" | ProductivityStatus> = ["Todos", "Alta productividad", "Con movimiento", "Baja productividad", "Sin movimiento"];

export function ProductivityPanel({ activities, alerts, budgetItems, commitments }: ProductivityPanelProps) {
  const [chapter, setChapter] = useState("Todos");
  const [responsible, setResponsible] = useState("Todos");
  const [weekStart, setWeekStart] = useState(getWeekStartISO(getTodayISO()));
  const [status, setStatus] = useState("Todos");
  const [search, setSearch] = useState("");

  const allRows = useMemo(() => buildActivityProductivity(activities, budgetItems), [activities, budgetItems]);
  const responsibles = ["Todos", ...Array.from(new Set(allRows.map((row) => row.responsible).filter(Boolean)))];
  const chapters = ["Todos", ...Array.from(new Set(allRows.map((row) => row.chapter)))];
  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return allRows.filter((row) => {
      const matchesChapter = chapter === "Todos" || row.chapter === chapter;
      const matchesResponsible = responsible === "Todos" || row.responsible === responsible;
      const matchesStatus = status === "Todos" || row.status === status;
      const matchesSearch = !normalizedSearch || [row.item, row.activity, row.chapter].some((value) => value.toLowerCase().includes(normalizedSearch));
      return matchesChapter && matchesResponsible && matchesStatus && matchesSearch;
    });
  }, [allRows, chapter, responsible, search, status]);
  const summary = useMemo(() => calculateProductivitySummary(filteredRows, weekStart), [filteredRows, weekStart]);
  const responsibleRows = useMemo(() => buildResponsibleProductivity({ activities, alerts, budgetItems, commitments }), [activities, alerts, budgetItems, commitments]);
  const topActivities = filteredRows.filter((row) => row.executedQuantity > 0).sort((a, b) => b.executedValue - a.executedValue).slice(0, 5);
  const lowActivities = filteredRows.filter((row) => row.status === "Sin movimiento" || row.status === "Baja productividad").slice(0, 5);

  return (
    <section className="grid gap-6">
      <div className="rounded-lg border border-dac-primary/15 bg-white p-5 shadow-panel">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-dac-secondary">Productividad</p>
            <h2 className="mt-1 text-2xl font-black text-dac-primary">Indicadores de productividad de obra</h2>
            <p className="mt-2 text-sm text-dac-text/70">Calculado desde Registro Diario, Presupuesto Maestro, Compromisos y Alertas.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Select label="Capitulo" value={chapter} options={chapters} onChange={setChapter} />
            <Select label="Responsable" value={responsible} options={responsibles} onChange={setResponsible} />
            <label className="block">
              <span className="text-xs font-black uppercase text-dac-text/50">Semana</span>
              <input type="date" value={weekStart} onChange={(event) => setWeekStart(getWeekStartISO(event.target.value))} className={controlClass} />
            </label>
            <Select label="Estado" value={status} options={statuses} onChange={setStatus} />
            <label className="block">
              <span className="text-xs font-black uppercase text-dac-text/50">Buscar actividad</span>
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} className={controlClass} placeholder="Item o actividad" />
            </label>
          </div>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Produccion total registrada" value={numberFormatter.format(summary.totalProduction)} tone="primary" />
        <Metric label="Valor ejecutado acumulado" value={currencyFormatter.format(summary.executedValue)} tone="secondary" />
        <Metric label="Promedio diario ejecutado" value={numberFormatter.format(summary.dailyAverage)} tone="secondary" />
        <Metric label="Actividades con movimiento esta semana" value={String(summary.weeklyMovingActivities)} tone="muted" />
        <Metric label="Actividades sin movimiento" value={String(summary.inactiveActivities)} tone="alert" />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Ranking title="Top actividades con mayor produccion" rows={topActivities.map((row) => ({ title: row.item + " - " + row.activity, detail: numberFormatter.format(row.executedQuantity) + " " + row.unit + " / " + currencyFormatter.format(row.executedValue) }))} empty="Sin produccion registrada." />
        <Ranking title="Actividades con menor movimiento" rows={lowActivities.map((row) => ({ title: row.item + " - " + row.activity, detail: row.status + " / ultimo avance: " + row.lastProgressDate }))} empty="No hay actividades con bajo movimiento." />
      </section>

      <section className="rounded-lg border border-dac-primary/15 bg-white shadow-panel">
        <div className="border-b border-dac-primary/10 p-5">
          <h3 className="text-xl font-black text-dac-primary">Productividad por actividad</h3>
          <p className="mt-1 text-sm text-dac-text/70">{filteredRows.length} actividades visibles</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1160px] border-collapse text-left">
            <thead className="bg-dac-primary text-white">
              <tr>
                {["ITEM", "ACTIVIDAD", "UNIDAD", "EJECUTADO ACUMULADO", "DIAS CON AVANCE", "PROMEDIO DIARIO", "ULTIMO AVANCE", "VALOR EJECUTADO", "RESPONSABLE", "ESTADO"].map((header) => (
                  <th key={header} className="px-4 py-3 text-xs font-black uppercase">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.item} className="border-b border-dac-primary/10 last:border-b-0">
                  <td className="px-4 py-4 text-sm font-black text-dac-primary">{row.item}</td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-dac-text">{row.activity}</p>
                    <p className="mt-1 text-xs font-semibold text-dac-text/55">{row.chapter}</p>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold">{row.unit}</td>
                  <td className="px-4 py-4 text-sm font-semibold">{numberFormatter.format(row.executedQuantity)}</td>
                  <td className="px-4 py-4 text-sm font-semibold">{row.daysWithMovement}</td>
                  <td className="px-4 py-4 text-sm font-semibold">{numberFormatter.format(row.dailyAverage)}</td>
                  <td className="px-4 py-4 text-sm font-semibold">{row.lastProgressDate}</td>
                  <td className="px-4 py-4 text-sm font-semibold">{currencyFormatter.format(row.executedValue)}</td>
                  <td className="px-4 py-4 text-sm font-semibold">{row.responsible}</td>
                  <td className="px-4 py-4"><span className={getStatusClass(row.status)}>{row.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-dac-primary/15 bg-white shadow-panel">
        <div className="border-b border-dac-primary/10 p-5">
          <h3 className="text-xl font-black text-dac-primary">Productividad por responsable</h3>
        </div>
        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
          {responsibleRows.map((row) => (
            <article key={row.responsible} className="rounded-lg border border-dac-primary/10 p-4">
              <p className="font-black text-dac-primary">{row.responsible}</p>
              <dl className="mt-3 grid gap-2 text-sm">
                <Info label="Actividades registradas" value={String(row.activitiesRegistered)} />
                <Info label="Cantidad ejecutada" value={numberFormatter.format(row.executedQuantity)} />
                <Info label="Valor ejecutado" value={currencyFormatter.format(row.executedValue)} />
                <Info label="Compromisos asociados" value={String(row.commitments)} />
                <Info label="Alertas asociadas" value={String(row.alerts)} />
              </dl>
            </article>
          ))}
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

function Ranking({ title, rows, empty }: { title: string; rows: Array<{ title: string; detail: string }>; empty: string }) {
  return (
    <section className="rounded-lg border border-dac-primary/15 bg-white p-5 shadow-panel">
      <h3 className="text-xl font-black text-dac-primary">{title}</h3>
      <div className="mt-4 grid gap-3">
        {rows.length === 0 && <p className="text-sm font-semibold text-dac-text/60">{empty}</p>}
        {rows.map((row, index) => (
          <article key={row.title} className="rounded-md border border-dac-primary/10 p-3">
            <p className="text-sm font-black text-dac-primary">{index + 1}. {row.title}</p>
            <p className="mt-1 text-sm font-semibold text-dac-text/70">{row.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase text-dac-text/50">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={controlClass}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-dac-primary/[0.04] p-2">
      <dt className="text-xs font-bold uppercase text-dac-text/50">{label}</dt>
      <dd className="mt-1 font-semibold text-dac-text">{value}</dd>
    </div>
  );
}

function getStatusClass(status: ProductivityStatus) {
  if (status === "Alta productividad") return "inline-flex rounded-full bg-dac-secondary/15 px-3 py-1 text-xs font-black text-dac-primary";
  if (status === "Baja productividad") return "inline-flex rounded-full bg-dac-alert/20 px-3 py-1 text-xs font-black text-dac-alert";
  if (status === "Sin movimiento") return "inline-flex rounded-full bg-dac-text/10 px-3 py-1 text-xs font-black text-dac-text/70";
  return "inline-flex rounded-full bg-dac-primary/10 px-3 py-1 text-xs font-black text-dac-primary";
}

const controlClass = "focus-ring mt-1 w-full rounded-md border border-dac-primary/15 bg-white px-3 py-2 text-sm font-semibold text-dac-text shadow-sm outline-none";
