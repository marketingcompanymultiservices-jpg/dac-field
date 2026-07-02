import type { DashboardMetric } from "@/types";

const toneClasses: Record<NonNullable<DashboardMetric["tone"]>, string> = {
  primary: "border-dac-primary/20 bg-dac-primary text-white",
  secondary: "border-dac-secondary/25 bg-dac-secondary/10 text-dac-primary",
  alert: "border-dac-alert/30 bg-dac-alert/10 text-dac-text"
};

export function StatCard({ metric }: { metric: DashboardMetric }) {
  return (
    <article className={"rounded-lg border p-4 shadow-sm " + toneClasses[metric.tone ?? "primary"]}>
      <p className="text-sm font-semibold opacity-80">{metric.label}</p>
      <p className="mt-3 text-3xl font-black">{metric.value}</p>
    </article>
  );
}
