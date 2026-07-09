"use client";

import { useEffect, useMemo, useState } from "react";
import { HeaderMetric, ModuleHeader } from "@/components/ModuleHeader";
import { PageShell } from "@/components/PageShell";
import { getProgressStatus } from "@/lib/progress";
import { useProjectStore } from "@/lib/project-store";
import type { BudgetItem, InitialSurveyMetadata, ProgressStatus } from "@/types";

type SurveyFilter = "Todas" | ProgressStatus;

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat("es-CO");

export default function InitialSurveyPage() {
  const { project, budgetItems, initialSurvey, saveInitialSurvey } = useProjectStore();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<SurveyFilter>("Todas");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setDraft(
      Object.fromEntries(
        budgetItems.map((item) => {
          const executed = item.quantity * ((item.initialProgress ?? 0) / 100);
          return [item.item, executed ? String(Number(executed.toFixed(4))) : ""];
        })
      )
    );
  }, [budgetItems]);

  const rows = useMemo(() => budgetItems.map((item) => buildSurveyRow(item, draft[item.item])), [budgetItems, draft]);
  const summary = useMemo(() => {
    const totalBudget = rows.reduce((sum, row) => sum + row.item.totalValue, 0);
    const executedValue = rows.reduce((sum, row) => sum + row.executedValue, 0);
    const pendingValue = Math.max(totalBudget - executedValue, 0);
    const initialProgress = totalBudget === 0 ? 0 : (executedValue / totalBudget) * 100;

    return {
      totalActivities: rows.length,
      totalBudget,
      executedValue,
      pendingValue,
      initialProgress
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesFilter = filter === "Todas" || row.status === filter;
      const matchesSearch =
        !normalizedSearch ||
        [row.item.item, row.item.description].some((value) => value.toLowerCase().includes(normalizedSearch));

      return matchesFilter && matchesSearch;
    });
  }, [filter, rows, search]);

  function updateDraft(item: BudgetItem, value: string) {
    setMessage("");
    setDraft((current) => ({ ...current, [item.item]: value }));
  }

  function saveSurvey() {
    const invalidRow = rows.find((row) => row.invalidReason);
    if (invalidRow) {
      setMessage(invalidRow.item.item + ": " + invalidRow.invalidReason);
      return;
    }

    const confirmed = window.confirm("Este levantamiento inicial sera el punto de partida del control DAC. Desea guardar?");
    if (!confirmed) return;

    const updatedItems = budgetItems.map((item) => {
      const executed = parseNumber(draft[item.item]);
      const initialProgress = item.quantity === 0 ? 0 : Math.min(100, (executed / item.quantity) * 100);
      return { ...item, initialProgress: Number(initialProgress.toFixed(4)) };
    });
    const metadata: InitialSurveyMetadata = {
      savedAt: new Date().toISOString(),
      savedBy: "Jose Martinez",
      totalActivities: summary.totalActivities,
      executedValue: summary.executedValue,
      pendingValue: summary.pendingValue,
      initialProgress: summary.initialProgress
    };

    saveInitialSurvey(updatedItems, metadata);
    setMessage("Levantamiento inicial guardado correctamente.");
  }

  function exportSurvey() {
    window.alert("La exportacion del levantamiento quedo registrada.");
  }

  return (
    <PageShell activeItem="Levantamiento" projectId={project.id} backHref={"/projects/" + project.id} backLabel="Volver al Centro de Control">
      <ModuleHeader
        eyebrow="Modulo: Levantamiento Inicial de Obra"
        title={project.name}
        meta={"Estado: " + project.status}
        aside={<HeaderMetric label="Avance inicial" value={summary.initialProgress.toFixed(1) + " %"} detail="Punto de partida del control DAC." />}
      />

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <SummaryCard label="Total actividades" value={numberFormatter.format(summary.totalActivities)} tone="primary" />
        <SummaryCard label="Valor total presupuesto" value={currencyFormatter.format(summary.totalBudget)} />
        <SummaryCard label="Valor ejecutado inicial" value={currencyFormatter.format(summary.executedValue)} />
        <SummaryCard label="Valor pendiente" value={currencyFormatter.format(summary.pendingValue)} tone="muted" />
        <SummaryCard label="Avance inicial" value={summary.initialProgress.toFixed(1) + " %"} tone="primary" />
        <SummaryCard label="Fecha levantamiento" value={initialSurvey ? new Date(initialSurvey.savedAt).toLocaleDateString("es-CO") : "Sin guardar"} tone="alert" />
      </section>

      <section className="mt-6 rounded-lg border border-dac-primary/15 bg-white shadow-panel">
        <div className="border-b border-dac-primary/10 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-dac-primary">Actividades del presupuesto maestro</h2>
              <p className="mt-1 text-sm text-dac-text/70">Edita el ejecutado inicial para definir el punto de partida real de la obra.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={exportSurvey} className="focus-ring rounded-md border border-dac-primary/20 px-4 py-3 text-sm font-black text-dac-primary hover:bg-dac-secondary/10">
                Exportar levantamiento
              </button>
              <button type="button" onClick={saveSurvey} className="focus-ring rounded-md bg-dac-primary px-4 py-3 text-sm font-black text-white hover:bg-dac-secondary">
                Guardar levantamiento inicial
              </button>
            </div>
          </div>

          {message && <p className="mt-4 rounded-md bg-dac-secondary/10 px-4 py-3 text-sm font-bold text-dac-primary">{message}</p>}

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <label className="block">
              <span className="text-xs font-black uppercase text-dac-text/50">Buscar por item o descripcion</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} className="focus-ring mt-1 w-full rounded-md border border-dac-primary/15 px-3 py-2 text-sm font-semibold" placeholder="Ej: mamposteria, 4.03" />
            </label>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              {(["Todas", "Sin iniciar", "En ejecucion", "Finalizado"] as SurveyFilter[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={
                    "focus-ring rounded-md border px-3 py-2 text-sm font-bold " +
                    (filter === item
                      ? "border-dac-primary bg-dac-primary text-white"
                      : "border-dac-primary/15 bg-white text-dac-primary hover:bg-dac-secondary/10")
                  }
                >
                  {item === "Finalizado" ? "Finalizadas" : item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-left">
            <thead className="bg-dac-primary text-white">
              <tr>
                {["ITEM", "DESCRIPCION", "UND", "CANTIDAD CONTRATADA", "EJECUTADO INICIAL", "PENDIENTE INICIAL", "% INICIAL", "VALOR EJECUTADO INICIAL", "ESTADO"].map((header) => (
                  <th key={header} className="px-4 py-3 text-xs font-black uppercase">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.item.item} className="border-b border-dac-primary/10 align-top last:border-b-0">
                  <td className="px-4 py-4 text-sm font-black text-dac-primary">{row.item.item}</td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-dac-text">{row.item.description}</p>
                    {row.invalidReason && <p className="mt-2 text-xs font-black text-dac-alert">{row.invalidReason}</p>}
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold">{row.item.unit}</td>
                  <td className="px-4 py-4 text-sm font-semibold">{numberFormatter.format(row.item.quantity)}</td>
                  <td className="px-4 py-4">
                    <input
                      value={draft[row.item.item] ?? ""}
                      onChange={(event) => updateDraft(row.item, event.target.value)}
                      className="focus-ring w-32 rounded-md border border-dac-primary/20 px-3 py-2 text-sm font-bold"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold">{numberFormatter.format(row.pendingQuantity)}</td>
                  <td className="px-4 py-4 text-sm font-black text-dac-primary">{row.initialProgress.toFixed(1)} %</td>
                  <td className="px-4 py-4 text-sm font-semibold">{currencyFormatter.format(row.executedValue)}</td>
                  <td className="px-4 py-4"><span className={getStatusClass(row.status)}>{row.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PageShell>
  );
}

function buildSurveyRow(item: BudgetItem, rawValue: string | undefined) {
  const executedQuantity = parseNumber(rawValue);
  const invalidReason = getInvalidReason(executedQuantity, item.quantity);
  const safeExecuted = invalidReason ? 0 : executedQuantity;
  const pendingQuantity = Math.max(item.quantity - safeExecuted, 0);
  const initialProgress = item.quantity === 0 ? 0 : Math.min(100, (safeExecuted / item.quantity) * 100);
  const executedValue = item.totalValue * (initialProgress / 100);
  const status = getProgressStatus(initialProgress);

  return { item, executedQuantity: safeExecuted, pendingQuantity, initialProgress, executedValue, status, invalidReason };
}

function parseNumber(value: string | undefined) {
  if (!value) return 0;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function getInvalidReason(value: number, contractedQuantity: number) {
  if (Number.isNaN(value)) return "Valor invalido.";
  if (value < 0) return "No se permiten valores negativos.";
  if (value > contractedQuantity) return "El ejecutado inicial no puede superar la cantidad contratada.";
  return "";
}

function SummaryCard({ label, value, tone = "secondary" }: { label: string; value: string; tone?: "primary" | "secondary" | "alert" | "muted" }) {
  const className =
    tone === "primary"
      ? "border-dac-primary/20 bg-dac-primary text-white"
      : tone === "alert"
        ? "border-dac-alert/30 bg-dac-alert/10 text-dac-text"
        : tone === "muted"
          ? "border-dac-primary/10 bg-white text-dac-text"
          : "border-dac-secondary/25 bg-dac-secondary/10 text-dac-primary";

  return (
    <article className={"rounded-lg border p-4 shadow-sm " + className}>
      <p className="text-sm font-bold opacity-75">{label}</p>
      <p className="mt-3 text-2xl font-black">{value}</p>
    </article>
  );
}

function getStatusClass(status: ProgressStatus) {
  if (status === "Finalizado") return "inline-flex rounded-full bg-dac-secondary/15 px-3 py-1 text-xs font-black text-dac-primary";
  if (status === "En ejecucion") return "inline-flex rounded-full bg-dac-alert/15 px-3 py-1 text-xs font-black text-dac-text";
  return "inline-flex rounded-full bg-dac-primary/10 px-3 py-1 text-xs font-black text-dac-text/70";
}
