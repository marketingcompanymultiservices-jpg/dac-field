import { ProgressBar } from "@/components/ProgressBar";

type ProgressSummaryProps = {
  generalProgress: number;
  totalBudget: number;
  executedValue: number;
  pendingValue: number;
  completedCount: number;
  activeCount: number;
  pendingCount: number;
};

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

export function ProgressSummary({
  generalProgress,
  totalBudget,
  executedValue,
  pendingValue,
  completedCount,
  activeCount,
  pendingCount
}: ProgressSummaryProps) {
  const cards = [
    { label: "Avance fisico general", value: generalProgress.toFixed(1) + " %", tone: "primary" },
    { label: "Valor total presupuesto", value: currencyFormatter.format(totalBudget), tone: "secondary" },
    { label: "Valor ejecutado estimado", value: currencyFormatter.format(executedValue), tone: "secondary" },
    { label: "Valor pendiente estimado", value: currencyFormatter.format(pendingValue), tone: "muted" },
    { label: "Actividades finalizadas", value: String(completedCount), tone: "primary" },
    { label: "Actividades en ejecucion", value: String(activeCount), tone: "alert" },
    { label: "Actividades sin iniciar", value: String(pendingCount), tone: "muted" }
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className={getCardClass(card.tone)}>
          <p className="text-sm font-bold opacity-75">{card.label}</p>
          <p className="mt-3 text-2xl font-black sm:text-3xl">{card.value}</p>
          {card.label === "Avance fisico general" && <ProgressBar value={generalProgress} className="mt-4 bg-white/25" />}
        </article>
      ))}
    </section>
  );
}

function getCardClass(tone: string) {
  if (tone === "primary") return "rounded-lg border border-dac-primary/20 bg-dac-primary p-4 text-white shadow-sm";
  if (tone === "alert") return "rounded-lg border border-dac-alert/30 bg-dac-alert/10 p-4 text-dac-text shadow-sm";
  if (tone === "muted") return "rounded-lg border border-dac-primary/10 bg-white p-4 text-dac-text shadow-sm";
  return "rounded-lg border border-dac-secondary/25 bg-dac-secondary/10 p-4 text-dac-primary shadow-sm";
}
