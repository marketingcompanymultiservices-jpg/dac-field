import type { DocumentStatus } from "@/types";

export type DocumentFilter = "Todos" | "Vigentes" | "Proximos a vencer" | "Reemplazados" | "Archivados";

const filters: DocumentFilter[] = ["Todos", "Vigentes", "Proximos a vencer", "Reemplazados", "Archivados"];

export function DocumentFilters({
  activeFilter,
  onChange,
  search,
  onSearchChange
}: {
  activeFilter: DocumentFilter;
  onChange: (filter: DocumentFilter) => void;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <section className="rounded-lg border border-dac-primary/15 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
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
                {filter}
              </button>
            ))}
          </div>
        </div>
        <label className="text-sm font-bold text-dac-text lg:min-w-96">
          Buscar documento
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="focus-ring mt-2 w-full rounded-md border border-dac-primary/20 px-4 py-3"
            placeholder="Nombre, carpeta, usuario u observacion"
          />
        </label>
      </div>
    </section>
  );
}

export function statusMatchesFilter(status: DocumentStatus, filter: DocumentFilter) {
  if (filter === "Todos") return true;
  if (filter === "Vigentes") return status === "Vigente";
  if (filter === "Proximos a vencer") return status === "Proxima a vencer";
  if (filter === "Reemplazados") return status === "Reemplazado";
  return status === "Archivado";
}
