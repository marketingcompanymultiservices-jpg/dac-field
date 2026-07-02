import { addDaysISO, getPlanningExecution, getPlanningStatus, getWeekStartISO } from "@/lib/planning";
import type { ActivityPlanning, BudgetItem, DailyActivity } from "@/types";

export type ProgrammedStatus = "En tiempo" | "Atrasada" | "Adelantada" | "Sin programacion";

export type ProgrammedRow = {
  item: string;
  activity: string;
  unit: string;
  chapter: string;
  responsible: string;
  plannedQuantity: number;
  executedQuantity: number;
  difference: number;
  compliance: number;
  status: ProgrammedStatus;
  weekStart: string;
};

export type ProgrammedSummary = {
  programmedProgress: number;
  executedProgress: number;
  deviation: number;
  delayedActivities: number;
  weeklyCompliance: number;
};

export type SCurvePoint = {
  week: string;
  programmed: number;
  executed: number;
};

export function buildProgrammedRows({
  activities,
  budgetItems,
  planningItems,
  weekStart
}: {
  activities: DailyActivity[];
  budgetItems: BudgetItem[];
  planningItems: ActivityPlanning[];
  weekStart: string;
}) {
  const budgetByItem = new Map(budgetItems.map((item) => [item.item, item]));
  const weekEnd = addDaysISO(weekStart, 6);
  const weeklyPlanning = planningItems.filter((planning) => planning.startDate >= weekStart && planning.startDate <= weekEnd);

  return weeklyPlanning.map((planning): ProgrammedRow => {
    const budget = budgetByItem.get(planning.budgetItemId);
    const executed = getPlanningExecution(planning, activities);
    const difference = executed - planning.plannedQuantity;
    const compliance = planning.plannedQuantity > 0 ? Math.min((executed / planning.plannedQuantity) * 100, 999) : 0;
    const planningStatus = getPlanningStatus(planning, executed);
    const status: ProgrammedStatus =
      planningStatus === "Atrasada"
        ? "Atrasada"
        : difference > 0
          ? "Adelantada"
          : "En tiempo";

    return {
      item: planning.budgetItemId,
      activity: budget?.description ?? "Actividad no encontrada",
      unit: budget?.unit ?? "-",
      chapter: budget?.chapter ?? "Sin capitulo",
      responsible: planning.owner,
      plannedQuantity: planning.plannedQuantity,
      executedQuantity: executed,
      difference,
      compliance,
      status,
      weekStart
    };
  });
}

export function calculateProgrammedSummary(rows: ProgrammedRow[], budgetItems: BudgetItem[]): ProgrammedSummary {
  const budgetByItem = new Map(budgetItems.map((item) => [item.item, item]));
  const totalBudgetValue = budgetItems.reduce((sum, item) => sum + item.totalValue, 0);
  const programmedValue = rows.reduce((sum, row) => sum + row.plannedQuantity * (budgetByItem.get(row.item)?.unitValue ?? 0), 0);
  const executedValue = rows.reduce((sum, row) => sum + row.executedQuantity * (budgetByItem.get(row.item)?.unitValue ?? 0), 0);
  const programmedProgress = totalBudgetValue > 0 ? (programmedValue / totalBudgetValue) * 100 : 0;
  const executedProgress = totalBudgetValue > 0 ? (executedValue / totalBudgetValue) * 100 : 0;
  const completedRows = rows.filter((row) => row.status !== "Atrasada" && row.compliance >= 100).length;

  return {
    programmedProgress,
    executedProgress,
    deviation: executedProgress - programmedProgress,
    delayedActivities: rows.filter((row) => row.status === "Atrasada").length,
    weeklyCompliance: rows.length > 0 ? (completedRows / rows.length) * 100 : 0
  };
}

export function buildSCurve(planningItems: ActivityPlanning[], activities: DailyActivity[], budgetItems: BudgetItem[]): SCurvePoint[] {
  const budgetByItem = new Map(budgetItems.map((item) => [item.item, item]));
  const weeks = new Set<string>();

  planningItems.forEach((planning) => weeks.add(getWeekStartISO(planning.startDate)));
  activities.forEach((activity) => weeks.add(getWeekStartISO(activity.date)));

  const sortedWeeks = Array.from(weeks).sort();
  let programmedAccumulated = 0;
  let executedAccumulated = 0;

  return sortedWeeks.map((week) => {
    const weekEnd = addDaysISO(week, 6);
    const plannedValue = planningItems
      .filter((planning) => planning.startDate >= week && planning.startDate <= weekEnd)
      .reduce((sum, planning) => sum + planning.plannedQuantity * (budgetByItem.get(planning.budgetItemId)?.unitValue ?? 0), 0);
    const executedValue = activities
      .filter((activity) => activity.date >= week && activity.date <= weekEnd)
      .reduce((sum, activity) => sum + activity.quantity * (budgetByItem.get(activity.budgetItemId ?? "")?.unitValue ?? 0), 0);

    programmedAccumulated += plannedValue;
    executedAccumulated += executedValue;

    return {
      week,
      programmed: programmedAccumulated,
      executed: executedAccumulated
    };
  });
}
