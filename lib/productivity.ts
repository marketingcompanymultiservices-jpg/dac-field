import { addDaysISO, getTodayISO, getWeekStartISO } from "@/lib/planning";
import type { BudgetItem, Commitment, DailyActivity, SmartAlert } from "@/types";

export type ProductivityStatus = "Alta productividad" | "Con movimiento" | "Baja productividad" | "Sin movimiento";

export type ActivityProductivity = {
  item: string;
  activity: string;
  unit: string;
  chapter: string;
  executedQuantity: number;
  daysWithMovement: number;
  dailyAverage: number;
  lastProgressDate: string;
  executedValue: number;
  responsible: string;
  status: ProductivityStatus;
};

export type ResponsibleProductivity = {
  responsible: string;
  activitiesRegistered: number;
  executedQuantity: number;
  executedValue: number;
  commitments: number;
  alerts: number;
};

export type ProductivitySummary = {
  totalProduction: number;
  executedValue: number;
  dailyAverage: number;
  weeklyMovingActivities: number;
  inactiveActivities: number;
  weeklyProductivity: number;
};

export function buildActivityProductivity(activities: DailyActivity[], budgetItems: BudgetItem[], today = getTodayISO()): ActivityProductivity[] {
  return budgetItems.map((budgetItem) => {
    const activityRecords = activities
      .filter((activity) => activity.budgetItemId === budgetItem.item)
      .sort((a, b) => b.date.localeCompare(a.date));
    const executedQuantity = activityRecords.reduce((sum, activity) => sum + Number(activity.quantity || 0), 0);
    const daysWithMovement = new Set(activityRecords.map((activity) => activity.date)).size;
    const dailyAverage = daysWithMovement > 0 ? executedQuantity / daysWithMovement : 0;
    const lastProgressDate = activityRecords[0]?.date ?? "";
    const executedValue = executedQuantity * budgetItem.unitValue;
    const responsible = activityRecords[0]?.owner || "Sin responsable";
    const daysWithoutMovement = lastProgressDate ? daysBetween(lastProgressDate, today) : 999;
    const status: ProductivityStatus =
      executedQuantity === 0
        ? "Sin movimiento"
        : daysWithoutMovement > 3
          ? "Baja productividad"
          : dailyAverage >= budgetItem.quantity * 0.05
            ? "Alta productividad"
            : "Con movimiento";

    return {
      item: budgetItem.item,
      activity: budgetItem.description,
      unit: budgetItem.unit,
      chapter: budgetItem.chapter,
      executedQuantity,
      daysWithMovement,
      dailyAverage,
      lastProgressDate: lastProgressDate || "Sin avance",
      executedValue,
      responsible,
      status
    };
  });
}

export function calculateProductivitySummary(rows: ActivityProductivity[], weekStart = getWeekStartISO(getTodayISO())): ProductivitySummary {
  const totalProduction = rows.reduce((sum, row) => sum + row.executedQuantity, 0);
  const executedValue = rows.reduce((sum, row) => sum + row.executedValue, 0);
  const totalDays = rows.reduce((sum, row) => sum + row.daysWithMovement, 0);
  const weekEnd = addDaysISO(weekStart, 6);
  const weeklyMovingActivities = rows.filter((row) => row.lastProgressDate >= weekStart && row.lastProgressDate <= weekEnd).length;
  const inactiveActivities = rows.filter((row) => row.status === "Sin movimiento" || row.status === "Baja productividad").length;

  return {
    totalProduction,
    executedValue,
    dailyAverage: totalDays > 0 ? totalProduction / totalDays : 0,
    weeklyMovingActivities,
    inactiveActivities,
    weeklyProductivity: rows.length > 0 ? (weeklyMovingActivities / rows.length) * 100 : 0
  };
}

export function buildResponsibleProductivity({
  activities,
  alerts,
  budgetItems,
  commitments
}: {
  activities: DailyActivity[];
  alerts: SmartAlert[];
  budgetItems: BudgetItem[];
  commitments: Commitment[];
}): ResponsibleProductivity[] {
  const budgetByItem = new Map(budgetItems.map((item) => [item.item, item]));
  const owners = new Set<string>();
  activities.forEach((activity) => owners.add(activity.owner || "Sin responsable"));
  commitments.forEach((commitment) => owners.add(commitment.owner || "Sin responsable"));
  alerts.forEach((alert) => owners.add(alert.responsible || "Sin responsable"));

  return Array.from(owners).map((responsible) => {
    const ownerActivities = activities.filter((activity) => (activity.owner || "Sin responsable") === responsible);
    return {
      responsible,
      activitiesRegistered: ownerActivities.length,
      executedQuantity: ownerActivities.reduce((sum, activity) => sum + Number(activity.quantity || 0), 0),
      executedValue: ownerActivities.reduce((sum, activity) => sum + Number(activity.quantity || 0) * (budgetByItem.get(activity.budgetItemId ?? "")?.unitValue ?? 0), 0),
      commitments: commitments.filter((commitment) => (commitment.owner || "Sin responsable") === responsible).length,
      alerts: alerts.filter((alert) => (alert.responsible || "Sin responsable") === responsible && alert.status !== "Cerrada").length
    };
  }).sort((a, b) => b.executedValue - a.executedValue);
}

function daysBetween(fromDate: string, toDate: string) {
  const from = new Date(fromDate + "T00:00:00").getTime();
  const to = new Date(toDate + "T00:00:00").getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.floor((to - from) / 86400000);
}
