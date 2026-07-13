"use client";

import type { BudgetVersion } from "@/types";
import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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

const chartColors = ["#004C6D", "#00B2D7", "#6C8794", "#D78C37", "#93A8B0", "#4B6874", "#B9C6CB"];

export function BudgetSummary({ budgetVersion }: { budgetVersion: BudgetVersion | null }) {
  const conceptRows: FinancialRow[] = [
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
      label: "IVA sobre Utilidad",
      total: budgetVersion?.utilityVatValue ?? 0,
      executed: budgetVersion?.utilityVatExecutedValue ?? 0,
      pending: budgetVersion?.utilityVatPendingValue ?? 0
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
    }
  ];

  const rows: FinancialRow[] = [
    conceptRows[0],
    conceptRows[1],
    conceptRows[2],
    conceptRows[3],
    {
      label: "Subtotal antes de IVA",
      total: budgetVersion?.subtotalBeforeVatValue ?? 0,
      executed: budgetVersion?.subtotalBeforeVatExecutedValue ?? 0,
      pending: budgetVersion?.subtotalBeforeVatPendingValue ?? 0,
      variant: "subtotal"
    },
    conceptRows[4],
    {
      label: "Total Costos de Obra",
      total: budgetVersion?.totalConstructionCostValue ?? 0,
      executed: budgetVersion?.totalConstructionCostExecutedValue ?? 0,
      pending: budgetVersion?.totalConstructionCostPendingValue ?? 0,
      variant: "subtotal"
    },
    conceptRows[5],
    conceptRows[6],
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

  const totalProjectValue = budgetVersion?.totalProjectValue ?? 0;

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

      <div className="grid gap-5 xl:grid-cols-[1.18fr_0.82fr]">
        <FinancialChartCard title="Ejecución por concepto">
          <div className="h-[430px] min-w-0">
            <ResponsiveContainer width="100%" height={430}>
              <BarChart data={conceptRows} layout="vertical" margin={{ top: 6, right: 22, bottom: 6, left: 18 }} barGap={4}>
                <CartesianGrid horizontal={false} stroke="#E6EEF1" strokeDasharray="3 3" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="label" width={132} tickLine={false} axisLine={false} tick={{ fill: "#131413", fontSize: 12, fontWeight: 600 }} />
                <Tooltip cursor={{ fill: "rgba(0, 76, 109, 0.05)" }} content={<ExecutionTooltip />} />
                <Bar dataKey="executed" stackId="budget" fill="#004C6D" radius={[5, 0, 0, 5]} isAnimationActive={false} />
                <Bar dataKey="pending" stackId="budget" fill="#D8E3E7" radius={[0, 5, 5, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-dac-text/65">
            <LegendDot color="#004C6D" label="Ejecutado" />
            <LegendDot color="#D8E3E7" label="Por ejecutar" />
          </div>
        </FinancialChartCard>

        <FinancialChartCard title="Composición del presupuesto">
          <div className="relative h-[350px] min-w-0">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={conceptRows}
                  dataKey="total"
                  nameKey="label"
                  innerRadius="62%"
                  outerRadius="86%"
                  paddingAngle={1}
                  stroke="#FFFFFF"
                  strokeWidth={3}
                  isAnimationActive={false}
                >
                  {conceptRows.map((entry, index) => (
                    <Cell key={entry.label} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CompositionTooltip totalProjectValue={totalProjectValue} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="max-w-52 text-center">
                <p className="text-[10px] font-black uppercase text-dac-text/45">Valor total proyecto</p>
                <p className="mt-2 text-lg font-black text-dac-primary sm:text-xl">{currencyFormatter.format(totalProjectValue)}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {conceptRows.map((row, index) => (
              <LegendDot key={row.label} color={chartColors[index % chartColors.length]} label={row.label} />
            ))}
          </div>
        </FinancialChartCard>
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

function FinancialChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="min-w-0 rounded-lg border border-dac-primary/10 bg-white p-5 shadow-sm ring-1 ring-dac-primary/[0.03]">
      <h3 className="text-sm font-black uppercase text-dac-primary">{title}</h3>
      <div className="mt-4">{children}</div>
    </article>
  );
}

function ExecutionTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: FinancialRow }> }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const percent = row.total > 0 ? (row.executed / row.total) * 100 : 0;
  return (
    <TooltipBox title={row.label}>
      <TooltipLine label="Presupuesto total" value={currencyFormatter.format(row.total)} />
      <TooltipLine label="Ejecutado" value={currencyFormatter.format(row.executed)} />
      <TooltipLine label="Por ejecutar" value={currencyFormatter.format(row.pending)} />
      <TooltipLine label="% ejecutado" value={percent.toFixed(1) + " %"} />
    </TooltipBox>
  );
}

function CompositionTooltip({ active, payload, totalProjectValue }: { active?: boolean; payload?: Array<{ payload: FinancialRow }>; totalProjectValue: number }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const percent = totalProjectValue > 0 ? (row.total / totalProjectValue) * 100 : 0;
  return (
    <TooltipBox title={row.label}>
      <TooltipLine label="Valor" value={currencyFormatter.format(row.total)} />
      <TooltipLine label="% del total" value={percent.toFixed(1) + " %"} />
    </TooltipBox>
  );
}

function TooltipBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-w-56 rounded-lg border border-dac-primary/10 bg-white p-3 shadow-lg">
      <p className="text-xs font-black uppercase text-dac-primary">{title}</p>
      <div className="mt-2 grid gap-1">{children}</div>
    </div>
  );
}

function TooltipLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <span className="font-semibold text-dac-text/60">{label}</span>
      <span className="font-black text-dac-text">{value}</span>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold text-dac-text/65">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
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
