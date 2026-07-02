"use client";

import { useMemo, useState } from "react";
import { ProgressBar } from "@/components/ProgressBar";
import { getProgressStatus } from "@/lib/progress";
import type { BudgetProgressItem, ProgressStatus } from "@/types";

type Filter = "Todas" | ProgressStatus;

const filters: Filter[] = ["Todas", "Finalizado", "En ejecucion", "Sin iniciar"];

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat("es-CO");

export function ProgressTable({ items }: { items: BudgetProgressItem[] }) {
  const [filter, setFilter] = useState<Filter>("Todas");

  const filteredItems = useMemo(() => {
    if (filter === "Todas") return items;
    return items.filter((item) => getProgressStatus(item.progress) === filter);
  }, [filter, items]);

  return (
    <section className="rounded-lg border border-dac-primary/15 bg-white shadow-panel">
      <div className="border-b border-dac-primary/10 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-dac-primary">Presupuesto y avance por actividad</h2>
            <p className="mt-1 text-sm text-dac-text/70">Carga real desde Excel pendiente para un sprint futuro.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            {filters.map((item) => (
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
                {item === "Finalizado" ? "Finalizadas" : item === "Todas" ? "Todas" : item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] border-collapse text-left">
          <thead className="bg-dac-primary text-white">
            <tr>
              {["ITEM", "DESCRIPCION", "UND", "CANT", "EJEC.", "PEND.", "VALOR UNIT.", "VALOR TOTAL", "%", "ESTADO"].map((header) => (
                <th key={header} className="px-4 py-3 text-xs font-black uppercase">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const status = getProgressStatus(item.progress);

              return (
                <tr key={item.item} className="border-b border-dac-primary/10 align-top last:border-b-0">
                  <td className="px-4 py-4 text-sm font-black text-dac-primary">{item.item}</td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-dac-text">{item.description}</p>
                    <ProgressBar value={item.progress} className="mt-3" />
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold">{item.unit}</td>
                  <td className="px-4 py-4 text-sm font-semibold">{numberFormatter.format(item.quantity)}</td>
                  <td className="px-4 py-4 text-sm font-semibold">{numberFormatter.format(item.executedQuantity ?? 0)}</td>
                  <td className="px-4 py-4 text-sm font-semibold">{numberFormatter.format(item.pendingQuantity ?? item.quantity)}</td>
                  <td className="px-4 py-4 text-sm font-semibold">{currencyFormatter.format(item.unitValue)}</td>
                  <td className="px-4 py-4 text-sm font-semibold">{currencyFormatter.format(item.totalValue)}</td>
                  <td className="px-4 py-4 text-sm font-black text-dac-primary">{item.progress} %</td>
                  <td className="px-4 py-4">
                    <span className={getStatusClass(status)}>{status}</span>
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

function getStatusClass(status: ProgressStatus) {
  if (status === "Finalizado") return "inline-flex rounded-full bg-dac-secondary/15 px-3 py-1 text-xs font-black text-dac-primary";
  if (status === "En ejecucion") return "inline-flex rounded-full bg-dac-alert/15 px-3 py-1 text-xs font-black text-dac-text";
  return "inline-flex rounded-full bg-dac-primary/10 px-3 py-1 text-xs font-black text-dac-text/70";
}
