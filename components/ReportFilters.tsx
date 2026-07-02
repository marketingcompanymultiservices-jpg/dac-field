import type { ProjectReport } from "@/types";

export type ReportFilter =
  | "Todos"
  | "Generados"
  | "Borradores"
  | "Diario"
  | "Semanal"
  | "Mensual"
  | "Fotografico"
  | "Avance"
  | "Compromisos"
  | "Programado vs Ejecutado"
  | "Productividad"
  | "Documental";

const filters: ReportFilter[] = [
  "Todos",
  "Generados",
  "Borradores",
  "Diario",
  "Semanal",
  "Mensual",
  "Fotografico",
  "Avance",
  "Compromisos",
  "Programado vs Ejecutado",
  "Productividad",
  "Documental"
];

export function ReportFilters({
  activeFilter,
  onChange
}: {
  activeFilter: ReportFilter;
  onChange: (filter: ReportFilter) => void;
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
            {filter}
          </button>
        ))}
      </div>
    </section>
  );
}

export function reportMatchesFilter(report: ProjectReport, filter: ReportFilter) {
  if (filter === "Todos") return true;
  if (filter === "Generados") return report.status === "Generado";
  if (filter === "Borradores") return report.status === "Borrador";
  if (filter === "Diario") return report.type === "Reporte Diario de Obra";
  if (filter === "Semanal") return report.type === "Reporte Semanal";
  if (filter === "Mensual") return report.type === "Reporte Mensual";
  if (filter === "Fotografico") return report.type === "Reporte Fotografico";
  if (filter === "Avance") return report.type === "Reporte de Avance";
  if (filter === "Compromisos") return report.type === "Reporte de Compromisos";
  if (filter === "Programado vs Ejecutado") return report.type === "Reporte Programado vs Ejecutado";
  if (filter === "Productividad") return report.type === "Reporte de Productividad";
  return report.type === "Reporte Documental";
}
