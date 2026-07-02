import type { DocumentStatus, ProjectDocument } from "@/types";

export function DocumentSummary({ documents, activeFolders }: { documents: ProjectDocument[]; activeFolders: number }) {
  const cards = [
    { label: "Total documentos", value: documents.length, tone: "primary" },
    { label: "Documentos vigentes", value: countByStatus(documents, "Vigente"), tone: "secondary" },
    { label: "Proximos a vencer", value: countByStatus(documents, "Proxima a vencer"), tone: "alert" },
    { label: "Reemplazados", value: countByStatus(documents, "Reemplazado"), tone: "muted" },
    { label: "Carpetas activas", value: activeFolders, tone: "primary" }
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <article key={card.label} className={getCardClass(card.tone)}>
          <p className="text-sm font-bold opacity-75">{card.label}</p>
          <p className="mt-3 text-3xl font-black">{card.value}</p>
        </article>
      ))}
    </section>
  );
}

function countByStatus(documents: ProjectDocument[], status: DocumentStatus) {
  return documents.filter((document) => document.status === status).length;
}

function getCardClass(tone: string) {
  if (tone === "primary") return "rounded-lg border border-dac-primary/20 bg-dac-primary p-4 text-white shadow-sm";
  if (tone === "secondary") return "rounded-lg border border-dac-secondary/25 bg-dac-secondary/10 p-4 text-dac-primary shadow-sm";
  if (tone === "alert") return "rounded-lg border border-dac-alert/30 bg-dac-alert/10 p-4 text-dac-text shadow-sm";
  return "rounded-lg border border-dac-primary/10 bg-white p-4 text-dac-text shadow-sm";
}
