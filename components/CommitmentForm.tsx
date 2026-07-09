"use client";

import { useRef } from "react";
import type { Commitment, CommitmentPriority } from "@/types";

const inputClass = "focus-ring mt-2 w-full rounded-md border border-dac-primary/20 px-4 py-3";
const labelClass = "text-sm font-bold text-dac-text";

export function CommitmentForm({ onAdd }: { onAdd: (commitment: Commitment) => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const ownerRef = useRef<HTMLInputElement>(null);
  const dueDateRef = useRef<HTMLInputElement>(null);
  const priorityRef = useRef<HTMLSelectElement>(null);
  const originRef = useRef<HTMLInputElement>(null);

  function handleAdd() {
    const description = descriptionRef.current?.value.trim() ?? "";
    const owner = ownerRef.current?.value.trim() ?? "";
    const dueDate = dueDateRef.current?.value ?? "";
    const priority = (priorityRef.current?.value ?? "Media") as CommitmentPriority;
    const origin = originRef.current?.value.trim() || "Registro manual";

    if (!description || !owner || !dueDate) return;

    onAdd({
      id: "commitment-" + Date.now(),
      description,
      owner,
      dueDate,
      priority,
      origin,
      status: "Pendiente"
    });

    formRef.current?.reset();
  }

  return (
    <form ref={formRef} className="rounded-lg border border-dac-primary/15 bg-white p-4 shadow-panel sm:p-5">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-dac-secondary">Nuevo compromiso</p>
        <h2 className="mt-1 text-xl font-black text-dac-primary">Agregar compromiso</h2>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <label className={labelClass + " lg:col-span-2"}>
          Descripcion
          <textarea ref={descriptionRef} name="description" rows={3} className={inputClass + " resize-y"} placeholder="Describe el compromiso de obra" />
        </label>
        <label className={labelClass}>
          Responsable
          <input ref={ownerRef} name="owner" className={inputClass} placeholder="Nombre del responsable" />
        </label>
        <label className={labelClass}>
          Fecha limite
          <input ref={dueDateRef} name="dueDate" type="date" className={inputClass} />
        </label>
        <label className={labelClass}>
          Prioridad
          <select ref={priorityRef} name="priority" defaultValue="Media" className={inputClass}>
            <option>Baja</option>
            <option>Media</option>
            <option>Alta</option>
            <option>Critica</option>
          </select>
        </label>
        <label className={labelClass}>
          Origen
          <input ref={originRef} name="origin" className={inputClass} placeholder="Registro Diario, Interventoria" />
        </label>
      </div>

      <button type="button" onClick={handleAdd} className="focus-ring mt-5 w-full rounded-md bg-dac-primary px-5 py-3 font-bold text-white hover:bg-dac-secondary sm:w-auto">
        Agregar compromiso
      </button>
    </form>
  );
}
