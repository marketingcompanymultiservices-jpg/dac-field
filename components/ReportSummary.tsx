import type { ProjectReport, ReportType } from "@/types";

export function ReportSummary({
  reports,
  reportTypes
}: {
  reports: ProjectReport[];
  reportTypes: ReportType[];
}) {
  const generatedReports = reports.filter((report) => report.status === "Generado");
  const lastGenerated = [...generatedReports].sort((a, b) => b.generationDate.localeCompare(a.generationDate))[0];
  const cards = [
    { label: "Total reportes", value: reports.length, tone: "primary" },
    { label: "Reportes generados", value: generatedReports.length, tone: "secondary" },
    { label: "Borradores", value: reports.filter((report) => report.status === "Borrador").length, tone: "alert" },
    { label: "Ultimo reporte generado", value: lastGenerated?.generationDate ?? "Sin reportes", tone: "muted" },
    { label: "Tipos disponibles", value: reportTypes.length, tone: "primary" }
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <article key={card.label} className={getCardClass(card.tone)}>
          <p className="text-sm font-bold opacity-75">{card.label}</p>
          <p className="mt-3 text-2xl font-black">{card.value}</p>
        </article>
      ))}
    </section>
  );
}

function getCardClass(tone: string) {
  if (tone === "primary") return "rounded-lg border border-dac-primary/20 bg-dac-primary p-4 text-white shadow-sm";
  if (tone === "secondary") return "rounded-lg border border-dac-secondary/25 bg-dac-secondary/10 p-4 text-dac-primary shadow-sm";
  if (tone === "alert") return "rounded-lg border border-dac-alert/30 bg-dac-alert/10 p-4 text-dac-text shadow-sm";
  return "rounded-lg border border-dac-primary/10 bg-white p-4 text-dac-text shadow-sm";
}
