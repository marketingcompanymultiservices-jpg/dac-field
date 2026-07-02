import type { Commitment } from "@/types";

export function CommitmentSummary({ commitments }: { commitments: Commitment[] }) {
  const items = [
    { label: "Total compromisos", value: commitments.length, tone: "primary" },
    { label: "Pendientes", value: commitments.filter((item) => item.status === "Pendiente").length, tone: "alert" },
    { label: "En proceso", value: commitments.filter((item) => item.status === "En proceso").length, tone: "secondary" },
    { label: "Vencidos", value: commitments.filter((item) => item.status === "Vencido").length, tone: "danger" },
    { label: "Cumplidos", value: commitments.filter((item) => item.status === "Cumplido").length, tone: "secondary" },
    { label: "Criticos", value: commitments.filter((item) => item.priority === "Critica").length, tone: "danger" }
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <article key={item.label} className={getCardClass(item.tone)}>
          <p className="text-sm font-bold opacity-75">{item.label}</p>
          <p className="mt-3 text-3xl font-black">{item.value}</p>
        </article>
      ))}
    </section>
  );
}

function getCardClass(tone: string) {
  if (tone === "primary") return "rounded-lg border border-dac-primary/20 bg-dac-primary p-4 text-white shadow-sm";
  if (tone === "secondary") return "rounded-lg border border-dac-secondary/25 bg-dac-secondary/10 p-4 text-dac-primary shadow-sm";
  if (tone === "danger") return "rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm";
  return "rounded-lg border border-dac-alert/30 bg-dac-alert/10 p-4 text-dac-text shadow-sm";
}
