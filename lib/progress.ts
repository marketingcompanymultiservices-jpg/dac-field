import type { BudgetItem, BudgetProgressItem, DailyActivity, ManualProgressChange, ProgressStatus } from "@/types";

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function getProgressStatus(progress: number): ProgressStatus {
  if (progress >= 100) return "Finalizado";
  if (progress > 0) return "En ejecucion";
  return "Sin iniciar";
}

export function buildProgressFromActivities(baseItems: BudgetItem[], activities: DailyActivity[], manualChanges: ManualProgressChange[] = []): BudgetProgressItem[] {
  return baseItems.map((item) => {
    const itemKey = normalize(item.description);
    const initialProgress = Math.min(Math.max(item.initialProgress ?? 0, 0), 100);
    const initialExecutedQuantity = item.quantity * (initialProgress / 100);
    const executedQuantity = activities
      .filter((activity) => {
        if (activity.budgetItemId) return activity.budgetItemId === item.item;
        const activityKey = normalize(activity.activity);
        return activityKey.includes(itemKey) || itemKey.includes(activityKey);
      })
      .reduce((sum, activity) => sum + activity.quantity, 0);
    const latestManualChange = manualChanges
      .filter((change) => change.item === item.item || change.activityId === item.item)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    const calculatedExecuted = initialExecutedQuantity + executedQuantity;
    const manualExecuted = item.executedQuantity ?? latestManualChange?.newQuantity;
    const cappedExecuted = Math.min(manualExecuted ?? calculatedExecuted, item.quantity);
    const progress = item.quantity === 0 ? 0 : Math.min(100, (cappedExecuted / item.quantity) * 100);

    return {
      ...item,
      executedQuantity: cappedExecuted,
      pendingQuantity: Math.max(item.quantity - cappedExecuted, 0),
      progress: Number(progress.toFixed(1))
    };
  });
}

export function calculateProgressSummary(items: BudgetProgressItem[]) {
  const totalBudget = items.reduce((sum, item) => sum + item.totalValue, 0);
  const executedValue = items.reduce((sum, item) => sum + item.totalValue * (item.progress / 100), 0);
  const pendingValue = Math.max(totalBudget - executedValue, 0);
  const generalProgress = totalBudget === 0 ? 0 : (executedValue / totalBudget) * 100;

  return {
    totalBudget,
    executedValue,
    pendingValue,
    generalProgress,
    completedCount: items.filter((item) => getProgressStatus(item.progress) === "Finalizado").length,
    activeCount: items.filter((item) => getProgressStatus(item.progress) === "En ejecucion").length,
    pendingCount: items.filter((item) => getProgressStatus(item.progress) === "Sin iniciar").length
  };
}
