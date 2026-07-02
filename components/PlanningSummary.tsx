import { getPlanningExecution, getPlanningStatus, getTodayISO, getWeekStartISO } from "@/lib/planning";
import type { ActivityPlanning, DailyActivity } from "@/types";

type PlanningSummaryProps = {
  planningItems: ActivityPlanning[];
  activities: DailyActivity[];
};

export function PlanningSummary({ activities, planningItems }: PlanningSummaryProps) {
  const today = getTodayISO();
  const weekStart = getWeekStartISO(today);
  const weekEnd = getWeekStartISO(today) ? new Date(weekStart + "T00:00:00") : new Date();
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndISO = weekEnd.toISOString().slice(0, 10);
  const weeklyItems = planningItems.filter((item) => item.startDate >= weekStart && item.startDate <= weekEndISO);
  const statuses = weeklyItems.map((item) => getPlanningStatus(item, getPlanningExecution(item, activities), today));
  const completed = statuses.filter((status) => status === "Finalizada").length;
  const pending = statuses.filter((status) => status === "Pendiente" || status === "Atrasada").length;
  const compliance = weeklyItems.length > 0 ? (completed / weeklyItems.length) * 100 : 0;

  const cards = [
    { label: "Actividades programadas", value: weeklyItems.length, tone: "primary" },
    { label: "Actividades terminadas", value: completed, tone: "secondary" },
    { label: "Actividades pendientes", value: pending, tone: "alert" },
    { label: "Cumplimiento semanal %", value: compliance.toFixed(1) + " %", tone: "muted" }
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className={getCardClass(card.tone)}>
          <p className="text-sm font-bold opacity-75">{card.label}</p>
          <p className="mt-3 text-3xl font-black">{card.value}</p>
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
