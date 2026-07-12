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
  variant?: "subtotal" | "final";
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
      pending: budgetVersion?.subtotalBeforeVatPendingValue ?? 0,
      variant: "subtotal"
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
      pending: budgetVersion?.totalConstructionCostPendingValue ?? 0,
      variant: "subtotal"
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
      variant: "final"
    }
  ];

  const cards = [
    { label: "VALOR TOTAL PROYECTO", value: budgetVersion?.totalProjectValue ?? 0 },
    { label: "EJECUTADO", value: budgetVersion?.totalExecutedValue ?? 0 },
    { label: "POR EJECUTAR", value: budgetVersion?.totalPendingValue ?? 0 }
  ];

  return (
    <section className="grid gap-7">
      <div className="grid gap-5 lg:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.label}
            className="flex min-h-36 flex-col justify-between rounded-lg border border-dac-primary/10 bg-white p-6 shadow-sm ring-1 ring-dac-primary/[0.03]"
          >
            <p className="text-[11px] font-extrabold uppercase text-dac-text/45">{card.label}</p>
            <p className="mt-5 text-2xl font-black text-dac-primary md:text-3xl xl:text-[34px]">{currencyFormatter.format(card.value)}</p>
          </article>
        ))}
      </div>

      <div className="rounded-lg border border-dac-primary/10 bg-white shadow-sm ring-1 ring-dac-primary/[0.03]">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[40%]" />
              <col className="w-[20%]" />
              <col className="w-[20%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-dac-primary/10 bg-dac-primary/[0.04]">
                <th className="px-6 py-4 text-[11px] font-extrabold uppercase text-dac-primary/75">Concepto</th>
                <th className="px-6 py-4 text-right text-[11px] font-extrabold uppercase text-dac-primary/75">Presupuesto total</th>
                <th className="px-6 py-4 text-right text-[11px] font-extrabold uppercase text-dac-primary/75">Ejecutado</th>
                <th className="px-6 py-4 text-right text-[11px] font-extrabold uppercase text-dac-primary/75">Por ejecutar</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className={getRowClass(row.variant)}>
                  <td className={getLabelClass(row.variant)}>{row.label}</td>
                  <td className={getValueClass(row.variant)}>{currencyFormatter.format(row.total)}</td>
                  <td className={getValueClass(row.variant)}>{currencyFormatter.format(row.executed)}</td>
                  <td className={getValueClass(row.variant)}>{currencyFormatter.format(row.pending)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function getRowClass(variant?: FinancialRow["variant"]) {
  if (variant === "final") return "border-t border-dac-primary/20 bg-dac-primary/[0.04]";
  if (variant === "subtotal") return "border-t border-dac-primary/10 bg-dac-primary/[0.02]";
  return "border-b border-dac-primary/[0.06] last:border-b-0";
}

function getLabelClass(variant?: FinancialRow["variant"]) {
  const base = "px-6 py-4 text-sm leading-5";
  if (variant === "final") return base + " font-black uppercase text-dac-primary";
  if (variant === "subtotal") return base + " font-extrabold text-dac-text";
  return base + " font-semibold text-dac-text/75";
}

function getValueClass(variant?: FinancialRow["variant"]) {
  const base = "whitespace-nowrap px-6 py-4 text-right text-sm leading-5 tabular-nums";
  if (variant === "final") return base + " font-black text-dac-primary";
  if (variant === "subtotal") return base + " font-extrabold text-dac-text";
  return base + " font-medium text-dac-text/70";
}
