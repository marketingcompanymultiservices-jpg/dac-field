import type { ActivityPlanning, PlanningStatus } from "@/types";

export function getPlanningStatus(planning: ActivityPlanning | undefined, executedQuantity = 0, today = getTodayISO()): PlanningStatus {
  if (!planning) return "Pendiente";
  if (executedQuantity >= planning.plannedQuantity && planning.plannedQuantity > 0) return "Finalizada";
  if (planning.endDate < today && executedQuantity < planning.plannedQuantity) return "Atrasada";
  if (executedQuantity > 0) return "En ejecucion";
  return "Pendiente";
}

export function getPlanningExecution(planning: ActivityPlanning, activities: Array<{ budgetItemId?: string; quantity: number; date: string }>) {
  return activities
    .filter((activity) => activity.budgetItemId === planning.budgetItemId && activity.date >= planning.startDate && activity.date <= planning.endDate)
    .reduce((sum, activity) => sum + Number(activity.quantity || 0), 0);
}

export function getPlanningProgress(planning: ActivityPlanning, executedQuantity: number) {
  if (!planning.plannedQuantity) return 0;
  return Math.min((executedQuantity / planning.plannedQuantity) * 100, 100);
}

export function isPlanningOverdue(planning: ActivityPlanning | undefined, executedQuantity = 0, today = getTodayISO()) {
  if (!planning) return false;
  return planning.endDate < today && executedQuantity < planning.plannedQuantity;
}

export function getDurationDays(startDate: string, endDate: string) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const diff = end.getTime() - start.getTime();
  if (Number.isNaN(diff)) return 0;
  return Math.max(Math.floor(diff / 86400000) + 1, 1);
}

export function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function getWeekStartISO(date = getTodayISO()) {
  const value = new Date(date + "T00:00:00");
  const day = value.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + diff);
  return value.toISOString().slice(0, 10);
}

export function addDaysISO(date: string, days: number) {
  const value = new Date(date + "T00:00:00");
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}
