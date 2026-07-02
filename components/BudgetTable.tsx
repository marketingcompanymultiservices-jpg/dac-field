"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BudgetFilters, type BudgetFilterState } from "@/components/BudgetFilters";
import { getProgressStatus } from "@/lib/progress";
import type { BudgetItem, BudgetProgressItem } from "@/types";

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

export function BudgetTable({ items, progressItems, projectId = "quintas-de-acuarela" }: { items: BudgetItem[]; progressItems: BudgetProgressItem[]; projectId?: string }) {
  const [filters, setFilters] = useState<BudgetFilterState>(initialFilters);
  const progressByItem = useMemo(() => new Map(progressItems.map((item) => [item.item, item])), [progressItems]);

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

  return (
    <section className="rounded-lg border border-dac-primary/15 bg-white shadow-panel">
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
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] border-collapse text-left">
          <thead className="bg-dac-primary text-white">
            <tr>
              {["ITEM", "DESCRIPCION", "UND", "CANTIDAD", "EJECUTADO ACUM.", "PENDIENTE", "% EJECUTADO", "ESTADO", "VALOR UNITARIO", "VALOR TOTAL", "CAPITULO", "SUBCAPITULO", "ACCION"].map((header) => (
                <th key={header} className="px-4 py-3 text-xs font-black uppercase">
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

              return (
                <tr key={item.item} className="border-b border-dac-primary/10 align-top last:border-b-0">
                  <td className="px-4 py-4 text-sm font-black text-dac-primary">{item.item}</td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-dac-text">{item.description}</p>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold">{item.unit}</td>
                  <td className="px-4 py-4 text-sm font-semibold">{numberFormatter.format(item.quantity)}</td>
                  <td className="px-4 py-4 text-sm font-semibold">{numberFormatter.format(progressItem?.executedQuantity ?? 0)}</td>
                  <td className="px-4 py-4 text-sm font-semibold">{numberFormatter.format(progressItem?.pendingQuantity ?? item.quantity)}</td>
                  <td className="px-4 py-4 text-sm font-black text-dac-primary">{progress.toFixed(1)} %</td>
                  <td className="px-4 py-4"><span className={getStatusClass(status)}>{status}</span></td>
                  <td className="px-4 py-4 text-sm font-semibold">{currencyFormatter.format(item.unitValue)}</td>
                  <td className="px-4 py-4 text-sm font-black text-dac-primary">{currencyFormatter.format(item.totalValue)}</td>
                  <td className="px-4 py-4 text-sm font-semibold">{item.chapter}</td>
                  <td className="px-4 py-4 text-sm font-semibold">{item.subchapter}</td>
                  <td className="px-4 py-4">
                    <Link href={"/projects/" + projectId + "/activities/" + encodeURIComponent(item.item)} className="focus-ring inline-flex rounded-md bg-dac-primary px-3 py-2 text-xs font-black text-white hover:bg-dac-secondary">
                      Ver actividad
                    </Link>
                  </td>
                </tr>
              );
            })}
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
