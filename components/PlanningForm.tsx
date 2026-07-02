"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { ActivityPlanning, BudgetItem, PlanningPriority } from "@/types";

type PlanningFormProps = {
  budgetItems: BudgetItem[];
  planningItems: ActivityPlanning[];
  onSave: (planning: Omit<ActivityPlanning, "status">) => void;
};

const inputClass = "focus-ring mt-2 w-full rounded-md border border-dac-primary/20 px-4 py-3 text-sm font-semibold";
const labelClass = "block text-sm font-bold text-dac-text";

export function PlanningForm({ budgetItems, planningItems, onSave }: PlanningFormProps) {
  const [search, setSearch] = useState("");
  const [budgetItemId, setBudgetItemId] = useState("");
  const [plannedQuantity, setPlannedQuantity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [owner, setOwner] = useState("");
  const [priority, setPriority] = useState<PlanningPriority>("Media");
  const [message, setMessage] = useState("");

  const selectedItem = budgetItems.find((item) => item.item === budgetItemId);
  const existingPlanning = planningItems.find((item) => item.budgetItemId === budgetItemId);

  const filteredItems = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return budgetItems.slice(0, 6);
    return budgetItems
      .filter((item) => [item.item, item.description, item.chapter, item.subchapter].some((value) => value.toLowerCase().includes(normalized)))
      .slice(0, 8);
  }, [budgetItems, search]);

  function selectActivity(item: BudgetItem) {
    const planned = planningItems.find((planning) => planning.budgetItemId === item.item);
    setBudgetItemId(item.item);
    setSearch(item.item + " - " + item.description);
    setPlannedQuantity(planned?.plannedQuantity ? String(planned.plannedQuantity) : "");
    setStartDate(planned?.startDate ?? "");
    setEndDate(planned?.endDate ?? "");
    setOwner(planned?.owner ?? "");
    setPriority(planned?.priority ?? "Media");
    setMessage("");
  }

  function savePlanning() {
    if (!selectedItem) {
      setMessage("Selecciona una actividad del presupuesto.");
      return;
    }

    const quantity = Number(plannedQuantity || 0);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setMessage("La cantidad programada debe ser mayor que cero.");
      return;
    }

    if (quantity > selectedItem.quantity) {
      setMessage("La cantidad programada no puede superar la cantidad contratada.");
      return;
    }

    if (!startDate || !endDate || !owner.trim()) {
      setMessage("Completa cantidad programada, fecha inicio, fecha fin y responsable.");
      return;
    }

    if (endDate < startDate) {
      setMessage("La fecha fin no puede ser anterior a la fecha inicio.");
      return;
    }

    onSave({
      budgetItemId: selectedItem.item,
      plannedQuantity: quantity,
      startDate,
      endDate,
      owner: owner.trim(),
      priority
    });
    setMessage("Se creo una nueva planificacion semanal.");
  }

  return (
    <section className="rounded-lg border border-dac-primary/15 bg-white p-4 shadow-panel sm:p-5">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-black uppercase text-dac-secondary">Programar actividad</p>
        <h2 className="text-xl font-black text-dac-primary">Planificacion semanal</h2>
        <p className="text-sm text-dac-text/70">Las actividades provienen exclusivamente del Presupuesto Maestro.</p>
      </div>

      {message && <p className="mt-4 rounded-md bg-dac-secondary/10 px-4 py-3 text-sm font-bold text-dac-primary">{message}</p>}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <Field label="Actividad">
            <input value={search} onChange={(event) => setSearch(event.target.value)} className={inputClass} placeholder="Buscar item, descripcion o capitulo" />
          </Field>
          <div className="mt-3 grid gap-2">
            {filteredItems.map((item) => {
              const active = item.item === budgetItemId;
              return (
                <button
                  key={item.item}
                  type="button"
                  onClick={() => selectActivity(item)}
                  className={
                    "focus-ring rounded-md border p-3 text-left transition " +
                    (active
                      ? "border-dac-primary bg-dac-primary text-white"
                      : "border-dac-primary/15 bg-white text-dac-text hover:border-dac-secondary hover:bg-dac-secondary/10")
                  }
                >
                  <span className="block text-sm font-black">{item.item} - {item.description}</span>
                  <span className="mt-1 block text-xs font-semibold opacity-75">{item.unit} - {item.chapter} - {item.subchapter}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {selectedItem && (
            <div className="rounded-md bg-dac-primary/[0.04] p-3 sm:col-span-2">
              <p className="text-xs font-bold uppercase text-dac-text/50">Actividad seleccionada</p>
              <p className="mt-1 font-black text-dac-primary">{selectedItem.item} - {selectedItem.description}</p>
              <p className="mt-1 text-sm font-semibold text-dac-text/60">Unidad: {selectedItem.unit} - Cantidad contratada: {selectedItem.quantity}</p>
              {existingPlanning && <p className="mt-1 text-sm font-semibold text-dac-alert">Ya tiene una programacion. Al guardar se actualizara.</p>}
            </div>
          )}
          <Field label="Cantidad programada">
            <input value={plannedQuantity} onChange={(event) => setPlannedQuantity(event.target.value)} className={inputClass} placeholder="48" />
          </Field>
          <Field label="Fecha inicio">
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={inputClass} />
          </Field>
          <Field label="Fecha fin">
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={inputClass} />
          </Field>
          <Field label="Responsable">
            <input value={owner} onChange={(event) => setOwner(event.target.value)} className={inputClass} placeholder="Hernan Aristizabal" />
          </Field>
          <Field label="Prioridad">
            <select value={priority} onChange={(event) => setPriority(event.target.value as PlanningPriority)} className={inputClass}>
              <option>Alta</option>
              <option>Media</option>
              <option>Baja</option>
            </select>
          </Field>
          <button type="button" onClick={savePlanning} className="focus-ring self-end rounded-md bg-dac-primary px-5 py-3 font-bold text-white hover:bg-dac-secondary">
            Guardar programacion
          </button>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={labelClass}>
      {label}
      {children}
    </label>
  );
}
