"use client";

import type { ReactNode } from "react";
import type { BudgetItem } from "@/types";

export type BudgetFilterState = {
  chapter: string;
  subchapter: string;
  status: string;
  search: string;
};

export function BudgetFilters({
  items,
  filters,
  onChange
}: {
  items: BudgetItem[];
  filters: BudgetFilterState;
  onChange: (filters: BudgetFilterState) => void;
}) {
  const controlClass =
    "focus-ring w-full rounded-md border border-dac-primary/15 bg-white px-3 py-2 text-sm font-semibold text-dac-text shadow-sm outline-none";
  const chapters = ["Todos", ...Array.from(new Set(items.map((item) => item.chapter)))];
  const subchapters = ["Todos", ...Array.from(new Set(items.map((item) => item.subchapter)))];
  const statuses = ["Todos", "Sin iniciar", "En ejecucion", "Finalizado"];

  function updateFilter(key: keyof BudgetFilterState, value: string) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Field label="Capitulo">
        <select value={filters.chapter} onChange={(event) => updateFilter("chapter", event.target.value)} className={controlClass}>
          {chapters.map((chapter) => (
            <option key={chapter}>{chapter}</option>
          ))}
        </select>
      </Field>

      <Field label="Subcapitulo">
        <select value={filters.subchapter} onChange={(event) => updateFilter("subchapter", event.target.value)} className={controlClass}>
          {subchapters.map((subchapter) => (
            <option key={subchapter}>{subchapter}</option>
          ))}
        </select>
      </Field>

      <Field label="Estado">
        <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)} className={controlClass}>
          {statuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </Field>

      <Field label="Buscar actividad">
        <input
          value={filters.search}
          onChange={(event) => updateFilter("search", event.target.value)}
          className={controlClass}
          placeholder="Item, descripcion o capitulo"
          type="search"
        />
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase text-dac-text/50">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
