"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { BudgetFilters, type BudgetFilterState } from "@/components/BudgetFilters";
import { useAuth } from "@/components/AuthProvider";
import { getProgressStatus } from "@/lib/progress";
import { useProjectStore } from "@/lib/project-store";
import type { BudgetItem, BudgetProgressItem, BudgetQuantityChange, ManualProgressChange } from "@/types";

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat("es-CO");

const initialFilters: BudgetFilterState = {
  chapter: "Todos",
  subchapter: "Todos",
  status: "Todos",
  search: ""
};

export function BudgetTable({
  items,
  progressItems,
  manualProgressChanges,
  budgetQuantityChanges,
  projectId = "quintas-de-acuarela",
  onUpdateManualProgress,
  onUpdateBudgetQuantity
}: {
  items: BudgetItem[];
  progressItems: BudgetProgressItem[];
  manualProgressChanges: ManualProgressChange[];
  budgetQuantityChanges: BudgetQuantityChange[];
  projectId?: string;
  onUpdateManualProgress: (change: Omit<ManualProgressChange, "id" | "date" | "origin">) => void;
  onUpdateBudgetQuantity: (change: Omit<BudgetQuantityChange, "id" | "date" | "origin">) => void;
}) {
  const { profile, user } = useAuth();
  const { adminRoles, currentUser } = useProjectStore();
  const [filters, setFilters] = useState<BudgetFilterState>(initialFilters);
  const [editingItem, setEditingItem] = useState("");
  const [baseQuantityDraft, setBaseQuantityDraft] = useState("");
  const [executedDraft, setExecutedDraft] = useState("");
  const [observationDraft, setObservationDraft] = useState("");
  const [responsibleDraft, setResponsibleDraft] = useState("");
  const [message, setMessage] = useState("");
  const progressByItem = useMemo(() => new Map(progressItems.map((item) => [item.item, item])), [progressItems]);
  const roleName = profile?.role ?? currentUser.role;
  const roleConfig = adminRoles.find((role) => role.name === roleName);
  const canEditBudget = roleName === "Administrador" || Boolean(roleConfig?.permissions.Presupuesto.Editar);

  const filteredItems = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesChapter = filters.chapter === "Todos" || item.chapter === filters.chapter;
      const matchesSubchapter = filters.subchapter === "Todos" || item.subchapter === filters.subchapter;
      const progressItem = progressByItem.get(item.item);
      const status = getProgressStatus(progressItem?.progress ?? 0);
      const matchesStatus = filters.status === "Todos" || status === filters.status;
      const matchesSearch =
        !search ||
        [item.item, item.description, item.unit, item.chapter, item.subchapter].some((value) => value.toLowerCase().includes(search));

      return matchesChapter && matchesSubchapter && matchesStatus && matchesSearch;
    });
  }, [filters, items, progressByItem]);

  function startEditing(item: BudgetItem) {
    const progressItem = progressByItem.get(item.item);
    setEditingItem(getBudgetRowKey(item));
    setBaseQuantityDraft(String(item.quantity));
    setExecutedDraft(String(progressItem?.executedQuantity ?? 0));
    setObservationDraft("");
    setResponsibleDraft(profile ? (profile.firstName + " " + profile.lastName).trim() : user?.email ?? "");
    setMessage("");
  }

  function cancelEditing() {
    setEditingItem("");
    setBaseQuantityDraft("");
    setExecutedDraft("");
    setObservationDraft("");
    setResponsibleDraft("");
    setMessage("");
  }

  function saveEditing(item: BudgetItem) {
    const progressItem = progressByItem.get(item.item);
    const previousQuantity = progressItem?.executedQuantity ?? 0;
    const nextBaseQuantity = Number(baseQuantityDraft);
    const nextQuantity = Number(executedDraft);

    if (!Number.isFinite(nextBaseQuantity)) {
      setMessage("La cantidad presupuestada debe ser un valor numerico.");
      return;
    }

    if (!Number.isFinite(nextQuantity)) {
      setMessage("La cantidad ejecutada acumulada debe ser un valor numerico.");
      return;
    }

    if (nextBaseQuantity < 0) {
      setMessage("La cantidad presupuestada no puede ser negativa.");
      return;
    }

    if (nextQuantity < 0) {
      setMessage("La cantidad ejecutada acumulada no puede ser negativa.");
      return;
    }

    if (nextBaseQuantity < nextQuantity) {
      setMessage("La cantidad presupuestada no puede ser menor que la cantidad ejecutada acumulada.");
      return;
    }

    const responsible = responsibleDraft.trim() || profile?.email || user?.email || "Usuario DAC";
    const observation = observationDraft.trim();

    if (nextBaseQuantity !== item.quantity) {
      onUpdateBudgetQuantity({
        activityId: item.item,
        item: item.item,
        description: item.description,
        previousQuantity: item.quantity,
        newQuantity: nextBaseQuantity,
        difference: nextBaseQuantity - item.quantity,
        user: responsible,
        observation
      });
    }

    if (nextQuantity !== previousQuantity) {
      onUpdateManualProgress({
        activityId: item.item,
        item: item.item,
        description: item.description,
        previousQuantity,
        newQuantity: nextQuantity,
        difference: nextQuantity - previousQuantity,
        user: responsible,
        observation
      });
    }

    if (nextBaseQuantity === item.quantity && nextQuantity === previousQuantity) {
      setMessage("No hay cambios para guardar.");
      return;
    }

    setMessage("Presupuesto y avance actualizados correctamente.");
    setEditingItem("");
    setBaseQuantityDraft("");
    setExecutedDraft("");
    setObservationDraft("");
    setResponsibleDraft("");
  }

  return (
    <section className="grid gap-6">
    <div className="rounded-lg border border-dac-primary/15 bg-white shadow-panel">
      <div className="border-b border-dac-primary/10 p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-dac-primary">Presupuesto maestro</h2>
              <p className="mt-1 text-sm text-dac-text/70">Base oficial para control fisico y financiero. Importacion Excel pendiente.</p>
            </div>
            <p className="text-sm font-black text-dac-primary">{filteredItems.length} actividades visibles</p>
          </div>

          <BudgetFilters items={items} filters={filters} onChange={setFilters} />
          {message && <p className="rounded-md bg-dac-secondary/10 px-4 py-3 text-sm font-black text-dac-primary">{message}</p>}
        </div>
      </div>

      <div className="max-h-[68vh] overflow-auto">
        <table className="w-full min-w-[980px] table-fixed border-separate border-spacing-0 text-left">
          <colgroup>
            <col className="w-[86px]" />
            <col />
            <col className="w-[70px]" />
            <col className="w-[105px]" />
            <col className="w-[105px]" />
            <col className="w-[105px]" />
            <col className="w-[92px]" />
            <col className="w-[138px]" />
          </colgroup>
          <thead className="sticky top-0 z-20 bg-dac-primary text-white shadow-sm">
            <tr>
              {["ITEM", "DESCRIPCION", "UND", "CANTIDAD", "EJECUTADO", "SALDO", "AVANCE", "ACCIONES"].map((header) => (
                <th key={header} className={"px-2.5 py-2.5 text-[11px] font-black uppercase " + (header === "ACCIONES" ? "sticky right-0 z-30 bg-dac-primary shadow-[-10px_0_14px_-14px_rgba(19,20,19,0.65)]" : "")}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const progressItem = progressByItem.get(item.item);
              const progress = progressItem?.progress ?? 0;
              const status = getProgressStatus(progress);
              const rowKey = getBudgetRowKey(item);

              return (
                <Fragment key={rowKey}>
                <tr className="align-top">
                  <td className="border-b border-dac-primary/10 px-2.5 py-3 text-sm font-black text-dac-primary">{item.item}</td>
                  <td className="border-b border-dac-primary/10 px-2.5 py-3">
                    <p className="truncate text-sm font-bold text-dac-text" title={item.description}>{item.description}</p>
                    <p className="mt-1 truncate text-[11px] font-semibold text-dac-text/55" title={item.chapter + " / " + item.subchapter}>
                      {item.chapter} / {item.subchapter} · V. unit. {currencyFormatter.format(item.unitValue)} · Total {currencyFormatter.format(item.totalValue)}
                    </p>
                  </td>
                  <td className="border-b border-dac-primary/10 px-2.5 py-3 text-sm font-semibold">{item.unit}</td>
                  <td className="border-b border-dac-primary/10 px-2.5 py-3 text-sm font-semibold tabular-nums">{numberFormatter.format(item.quantity)}</td>
                  <td className="border-b border-dac-primary/10 px-2.5 py-3 text-sm font-semibold tabular-nums">{numberFormatter.format(progressItem?.executedQuantity ?? 0)}</td>
                  <td className="border-b border-dac-primary/10 px-2.5 py-3 text-sm font-semibold tabular-nums">{numberFormatter.format(progressItem?.pendingQuantity ?? item.quantity)}</td>
                  <td className="border-b border-dac-primary/10 px-2.5 py-3">
                    <p className="text-sm font-black text-dac-primary tabular-nums">{progress.toFixed(1)} %</p>
                    <span className={getStatusClass(status)}>{status}</span>
                  </td>
                  <td className="sticky right-0 z-10 border-b border-dac-primary/10 bg-white px-2.5 py-2.5 shadow-[-10px_0_14px_-14px_rgba(19,20,19,0.45)]">
                    <div className="grid gap-1.5">
                      <Link href={"/projects/" + projectId + "/activities/" + encodeURIComponent(item.item)} className="focus-ring inline-flex rounded-md bg-dac-primary px-2 py-1.5 text-center text-[11px] font-black text-white hover:bg-dac-secondary">
                        Ver actividad
                      </Link>
                      {canEditBudget && (
                        <button type="button" onClick={() => startEditing(item)} className="focus-ring rounded-md border border-dac-primary px-2 py-1.5 text-[11px] font-black text-dac-primary hover:bg-dac-secondary/10">
                          Editar avance
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {editingItem === rowKey && (
                  <tr className="border-b border-dac-primary/10 bg-dac-primary/[0.03]">
                    <td colSpan={8} className="px-3 py-4">
                      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
                        <label className="block text-sm font-black text-dac-text">
                          Cantidad presupuestada real
                          <input value={baseQuantityDraft} onChange={(event) => setBaseQuantityDraft(event.target.value)} className="focus-ring mt-2 w-full rounded-md border border-dac-primary/20 bg-white px-3 py-3 text-sm font-semibold outline-none" />
                        </label>
                        <label className="block text-sm font-black text-dac-text">
                          Cantidad ejecutada acumulada
                          <input value={executedDraft} onChange={(event) => setExecutedDraft(event.target.value)} className="focus-ring mt-2 w-full rounded-md border border-dac-primary/20 bg-white px-3 py-3 text-sm font-semibold outline-none" />
                        </label>
                        <label className="block text-sm font-black text-dac-text">
                          Responsable de actualizacion
                          <input value={responsibleDraft} onChange={(event) => setResponsibleDraft(event.target.value)} className="focus-ring mt-2 w-full rounded-md border border-dac-primary/20 bg-white px-3 py-3 text-sm font-semibold outline-none" />
                        </label>
                        <label className="block text-sm font-black text-dac-text">
                          Observacion de actualizacion
                          <input value={observationDraft} onChange={(event) => setObservationDraft(event.target.value)} className="focus-ring mt-2 w-full rounded-md border border-dac-primary/20 bg-white px-3 py-3 text-sm font-semibold outline-none" />
                        </label>
                        <div className="grid gap-2 self-end sm:grid-cols-2 lg:grid-cols-1">
                          <button type="button" onClick={() => saveEditing(item)} className="focus-ring rounded-md bg-dac-primary px-4 py-3 text-sm font-black text-white hover:bg-dac-secondary">Guardar</button>
                          <button type="button" onClick={cancelEditing} className="focus-ring rounded-md border border-dac-alert px-4 py-3 text-sm font-black text-dac-alert hover:bg-dac-alert hover:text-white">Cancelar</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
    <ProgressChangeHistory changes={manualProgressChanges} budgetQuantityChanges={budgetQuantityChanges} />
    </section>
  );
}

function ProgressChangeHistory({ changes, budgetQuantityChanges }: { changes: ManualProgressChange[]; budgetQuantityChanges: BudgetQuantityChange[] }) {
  return (
    <section className="rounded-lg border border-dac-primary/15 bg-white p-4 shadow-panel sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase text-dac-secondary">Historial de cambios de avance</p>
          <h2 className="text-xl font-black text-dac-primary">Ediciones manuales</h2>
        </div>
        <p className="text-sm font-black text-dac-primary">{changes.length} registros</p>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead className="bg-dac-primary text-white">
            <tr>
              {["FECHA", "USUARIO", "ACTIVIDAD", "CANT. ANTERIOR", "CANT. NUEVA", "OBSERVACION"].map((header) => (
                <th key={header} className="px-4 py-3 text-xs font-black uppercase">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {changes.map((change) => (
              <tr key={change.id} className="border-b border-dac-primary/10 last:border-b-0">
                <td className="px-4 py-4 text-sm font-semibold">{new Date(change.date).toLocaleString("es-CO")}</td>
                <td className="px-4 py-4 text-sm font-semibold">{change.user}</td>
                <td className="px-4 py-4 text-sm font-black text-dac-primary">{change.item} - {change.description}</td>
                <td className="px-4 py-4 text-sm font-semibold">{numberFormatter.format(change.previousQuantity)}</td>
                <td className="px-4 py-4 text-sm font-semibold">{numberFormatter.format(change.newQuantity)}</td>
                <td className="px-4 py-4 text-sm font-semibold">{change.observation || "Sin observacion"}</td>
              </tr>
            ))}
            {changes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-5 text-sm font-semibold text-dac-text/60">Aun no hay cambios manuales de avance.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-6 overflow-x-auto">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h3 className="text-lg font-black text-dac-primary">Correcciones de cantidad presupuestada</h3>
          <p className="text-sm font-black text-dac-primary">{budgetQuantityChanges.length} registros</p>
        </div>
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead className="bg-dac-primary text-white">
            <tr>
              {["FECHA", "USUARIO", "ACTIVIDAD", "CANT. BASE ANTERIOR", "CANT. BASE NUEVA", "OBSERVACION"].map((header) => (
                <th key={header} className="px-4 py-3 text-xs font-black uppercase">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {budgetQuantityChanges.map((change) => (
              <tr key={change.id} className="border-b border-dac-primary/10 last:border-b-0">
                <td className="px-4 py-4 text-sm font-semibold">{new Date(change.date).toLocaleString("es-CO")}</td>
                <td className="px-4 py-4 text-sm font-semibold">{change.user}</td>
                <td className="px-4 py-4 text-sm font-black text-dac-primary">{change.item} - {change.description}</td>
                <td className="px-4 py-4 text-sm font-semibold">{numberFormatter.format(change.previousQuantity)}</td>
                <td className="px-4 py-4 text-sm font-semibold">{numberFormatter.format(change.newQuantity)}</td>
                <td className="px-4 py-4 text-sm font-semibold">{change.observation || "Sin observacion"}</td>
              </tr>
            ))}
            {budgetQuantityChanges.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-5 text-sm font-semibold text-dac-text/60">Aun no hay correcciones de cantidad presupuestada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getStatusClass(status: string) {
  if (status === "Finalizado") return "inline-flex rounded-full bg-dac-secondary/15 px-3 py-1 text-xs font-black text-dac-primary";
  if (status === "En ejecucion") return "inline-flex rounded-full bg-dac-alert/15 px-3 py-1 text-xs font-black text-dac-text";
  return "inline-flex rounded-full bg-dac-primary/10 px-3 py-1 text-xs font-black text-dac-text/70";
}

function getBudgetRowKey(item: BudgetItem) {
  return item.id ?? item.item + "-" + (item.importOrder ?? 0);
}
