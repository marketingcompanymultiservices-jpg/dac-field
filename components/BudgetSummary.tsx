import type { BudgetItem } from "@/types";

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat("es-CO");

export function BudgetSummary({ items }: { items: BudgetItem[] }) {
  const totalBudget = items.reduce((sum, item) => sum + item.totalValue, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const chapters = new Set(items.map((item) => item.chapter)).size;
  const subchapters = new Set(items.map((item) => item.subchapter)).size;

  const cards = [
    { label: "Numero total de actividades", value: numberFormatter.format(items.length), tone: "primary" },
    { label: "Valor total presupuesto", value: currencyFormatter.format(totalBudget), tone: "secondary" },
    { label: "Cantidad total de actividades", value: numberFormatter.format(totalQuantity), tone: "muted" },
    { label: "Capitulos", value: numberFormatter.format(chapters), tone: "primary" },
    { label: "Subcapitulos", value: numberFormatter.format(subchapters), tone: "alert" }
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
  if (tone === "alert") return "rounded-lg border border-dac-alert/30 bg-dac-alert/10 p-4 text-dac-text shadow-sm";
  if (tone === "muted") return "rounded-lg border border-dac-primary/10 bg-white p-4 text-dac-text shadow-sm";
  return "rounded-lg border border-dac-secondary/25 bg-dac-secondary/10 p-4 text-dac-primary shadow-sm";
}
