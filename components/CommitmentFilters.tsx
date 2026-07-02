import type { CommitmentPriority, CommitmentStatus } from "@/types";

export type CommitmentFilter = "Todos" | CommitmentStatus | "Alta / Critica";

const filters: CommitmentFilter[] = ["Todos", "Pendiente", "En proceso", "Vencido", "Cumplido", "Alta / Critica"];

export function CommitmentFilters({
  activeFilter,
  onChange
}: {
  activeFilter: CommitmentFilter;
  onChange: (filter: CommitmentFilter) => void;
}) {
  return (
    <section className="rounded-lg border border-dac-primary/15 bg-white p-4 shadow-sm">
      <p className="text-sm font-black uppercase text-dac-primary">Filtros</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => onChange(filter)}
            className={
              "focus-ring rounded-md border px-3 py-2 text-sm font-bold " +
              (activeFilter === filter
                ? "border-dac-primary bg-dac-primary text-white"
                : "border-dac-primary/15 bg-white text-dac-primary hover:bg-dac-secondary/10")
            }
          >
            {getLabel(filter)}
          </button>
        ))}
      </div>
    </section>
  );
}

function getLabel(filter: CommitmentFilter) {
  if (filter === "Pendiente") return "Pendientes";
  if (filter === "Vencido") return "Vencidos";
  if (filter === "Cumplido") return "Cumplidos";
  return filter;
}

export function matchesPriorityFilter(priority: CommitmentPriority) {
  return priority === "Alta" || priority === "Critica";
}
