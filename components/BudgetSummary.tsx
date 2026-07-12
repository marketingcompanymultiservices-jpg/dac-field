import type { BudgetVersion } from "@/types";

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

type FinancialRow = {
  label: string;
  total: number;
  executed: number;
  pending: number;
  emphasis?: boolean;
};

export function BudgetSummary({ budgetVersion }: { budgetVersion: BudgetVersion | null }) {
  const rows: FinancialRow[] = [
    {
      label: "Costo Directo",
      total: budgetVersion?.directCostValue ?? 0,
      executed: budgetVersion?.directCostExecutedValue ?? 0,
      pending: budgetVersion?.directCostPendingValue ?? 0
    },
    {
      label: "Administración",
      total: budgetVersion?.administrationValue ?? 0,
      executed: budgetVersion?.administrationExecutedValue ?? 0,
      pending: budgetVersion?.administrationPendingValue ?? 0
    },
    {
      label: "Imprevistos",
      total: budgetVersion?.contingencyValue ?? 0,
      executed: budgetVersion?.contingencyExecutedValue ?? 0,
      pending: budgetVersion?.contingencyPendingValue ?? 0
    },
    {
      label: "Utilidad",
      total: budgetVersion?.utilityValue ?? 0,
      executed: budgetVersion?.utilityExecutedValue ?? 0,
      pending: budgetVersion?.utilityPendingValue ?? 0
    },
    {
      label: "Subtotal antes de IVA",
      total: budgetVersion?.subtotalBeforeVatValue ?? 0,
      executed: budgetVersion?.subtotalBeforeVatExecutedValue ?? 0,
      pending: budgetVersion?.subtotalBeforeVatPendingValue ?? 0
    },
    {
      label: "IVA sobre Utilidad",
      total: budgetVersion?.utilityVatValue ?? 0,
      executed: budgetVersion?.utilityVatExecutedValue ?? 0,
      pending: budgetVersion?.utilityVatPendingValue ?? 0
    },
    {
      label: "Total Costos de Obra",
      total: budgetVersion?.totalConstructionCostValue ?? 0,
      executed: budgetVersion?.totalConstructionCostExecutedValue ?? 0,
      pending: budgetVersion?.totalConstructionCostPendingValue ?? 0
    },
    {
      label: "Intereses",
      total: budgetVersion?.interestValue ?? 0,
      executed: budgetVersion?.interestExecutedValue ?? 0,
      pending: budgetVersion?.interestPendingValue ?? 0
    },
    {
      label: "Interventoría",
      total: budgetVersion?.supervisionValue ?? 0,
      executed: budgetVersion?.supervisionExecutedValue ?? 0,
      pending: budgetVersion?.supervisionPendingValue ?? 0
    },
    {
      label: "TOTAL OBRA CIVIL + INTERVENTORÍA",
      total: budgetVersion?.totalProjectValue ?? 0,
      executed: budgetVersion?.totalExecutedValue ?? 0,
      pending: budgetVersion?.totalPendingValue ?? 0,
      emphasis: true
    }
  ];

  const cards = [
    { label: "VALOR TOTAL PROYECTO", value: budgetVersion?.totalProjectValue ?? 0 },
    { label: "EJECUTADO", value: budgetVersion?.totalExecutedValue ?? 0 },
    { label: "POR EJECUTAR", value: budgetVersion?.totalPendingValue ?? 0 }
  ];

  return (
    <section className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="rounded-lg border border-dac-primary/15 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase text-dac-text/50">{card.label}</p>
            <p className="mt-3 text-2xl font-black text-dac-primary xl:text-3xl">{currencyFormatter.format(card.value)}</p>
          </article>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-dac-primary/10 bg-white shadow-sm">
        <table className="min-w-full border-collapse text-left">
          <thead className="bg-dac-primary text-white">
            <tr>
              <th className="px-4 py-3 text-xs font-black uppercase tracking-wide">Concepto</th>
              <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wide">Presupuesto total</th>
              <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wide">Ejecutado</th>
              <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wide">Por ejecutar</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className={row.emphasis ? "bg-dac-secondary/10" : "border-b border-dac-primary/10 last:border-b-0"}>
                <td className={getLabelClass(row.emphasis)}>{row.label}</td>
                <td className={getValueClass(row.emphasis)}>{currencyFormatter.format(row.total)}</td>
                <td className={getValueClass(row.emphasis)}>{currencyFormatter.format(row.executed)}</td>
                <td className={getValueClass(row.emphasis)}>{currencyFormatter.format(row.pending)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getLabelClass(emphasis?: boolean) {
  return "px-4 py-3 text-sm " + (emphasis ? "font-black text-dac-primary" : "font-bold text-dac-text");
}

function getValueClass(emphasis?: boolean) {
  return "whitespace-nowrap px-4 py-3 text-right text-sm " + (emphasis ? "font-black text-dac-primary" : "font-semibold text-dac-text/80");
}
