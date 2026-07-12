import { supabaseClient } from "@/lib/supabaseClient";
import type {
  BudgetItem,
  BudgetVersion,
  BudgetVersionActivationResult,
  BudgetVersionComparison,
  BudgetVersionComparisonRow,
  BudgetVersionComparisonType,
  BudgetVersionSummary
} from "@/types";

type BudgetItemRow = {
  id: string;
  project_id: string;
  budget_version_id?: string | null;
  item: string;
  import_order: number | string | null;
  budget_type?: string | null;
  description: string;
  unit: string;
  quantity: number | string;
  unit_value: number | string;
  total_value: number | string;
  chapter: string;
  subchapter: string;
  initial_progress: number | string | null;
  executed_quantity?: number | string | null;
  executed_value?: number | string | null;
  pending_value?: number | string | null;
  pending_quantity?: number | string | null;
  physical_progress_percent?: number | string | null;
  financial_progress_percent?: number | string | null;
};

type BudgetVersionRow = {
  id?: string;
  project_id: string;
  version_number: number;
  status?: "Borrador" | "En revision" | "Oficial" | "Archivada";
  imported_at: string;
  imported_by: string;
  file_name: string;
  total_activities: number;
  total_budget_value: number | string;
};

type ActivationResultRow = {
  project_id: string;
  archived_budget_version_id: string;
  activated_budget_version_id: string;
  archived_version_number: number;
  activated_version_number: number;
  activated_items: number;
  activated_total_value: number | string;
  activated_at: string;
  activated_by: string;
};

type SupabaseBudgetVersionError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

export async function listProjectBudgetVersions(projectId: string): Promise<BudgetVersionSummary[]> {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");

  const [{ data: versionRows, error: versionsError }, { data: itemRows, error: itemsError }] = await Promise.all([
    supabaseClient
      .from("project_budget_versions")
      .select("*")
      .eq("project_id", projectId)
      .order("version_number", { ascending: false }),
    supabaseClient
      .from("project_budget_items")
      .select("*")
      .eq("project_id", projectId)
  ]);

  if (versionsError) {
    throw buildBudgetVersionOperationError("Error listando versiones de presupuesto", versionsError, { projectId });
  }

  if (itemsError) {
    throw buildBudgetVersionOperationError("Error listando items de versiones de presupuesto", itemsError, { projectId });
  }

  const itemsByVersion = groupItemsByVersion(((itemRows ?? []) as BudgetItemRow[]).map(mapBudgetItemRow));

  return ((versionRows ?? []) as BudgetVersionRow[]).map((row) => {
    const version = mapBudgetVersionRow(row);
    const items = version.id ? itemsByVersion.get(version.id) ?? [] : [];
    return buildVersionSummary(row.project_id, version, items);
  });
}

export async function loadProjectBudgetVersion(projectId: string, budgetVersionId: string): Promise<BudgetVersionSummary> {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");

  const [{ data: versionRow, error: versionError }, { data: itemRows, error: itemsError }] = await Promise.all([
    supabaseClient
      .from("project_budget_versions")
      .select("*")
      .eq("project_id", projectId)
      .eq("id", budgetVersionId)
      .single(),
    supabaseClient
      .from("project_budget_items")
      .select("*")
      .eq("project_id", projectId)
      .eq("budget_version_id", budgetVersionId)
      .order("import_order", { ascending: true })
      .order("item", { ascending: true })
  ]);

  if (versionError) {
    throw buildBudgetVersionOperationError("Error cargando version de presupuesto", versionError, { projectId, budgetVersionId });
  }

  if (itemsError) {
    throw buildBudgetVersionOperationError("Error cargando items de version de presupuesto", itemsError, { projectId, budgetVersionId });
  }

  return buildVersionSummary(
    (versionRow as BudgetVersionRow).project_id,
    mapBudgetVersionRow(versionRow as BudgetVersionRow),
    ((itemRows ?? []) as BudgetItemRow[]).map(mapBudgetItemRow)
  );
}

export async function loadProjectBudgetVersionItems(projectId: string, budgetVersionId: string): Promise<BudgetItem[]> {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");

  const { data, error } = await supabaseClient
    .from("project_budget_items")
    .select("*")
    .eq("project_id", projectId)
    .eq("budget_version_id", budgetVersionId)
    .order("import_order", { ascending: true })
    .order("item", { ascending: true });

  if (error) {
    throw buildBudgetVersionOperationError("Error cargando items de version de presupuesto", error, { projectId, budgetVersionId });
  }

  return ((data ?? []) as BudgetItemRow[]).map(mapBudgetItemRow);
}

export async function compareProjectBudgetVersions(
  projectId: string,
  sourceBudgetVersionId: string,
  targetBudgetVersionId: string
): Promise<BudgetVersionComparison> {
  const [sourceVersion, targetVersion, sourceItems, targetItems] = await Promise.all([
    loadProjectBudgetVersion(projectId, sourceBudgetVersionId),
    loadProjectBudgetVersion(projectId, targetBudgetVersionId),
    loadProjectBudgetVersionItems(projectId, sourceBudgetVersionId),
    loadProjectBudgetVersionItems(projectId, targetBudgetVersionId)
  ]);

  return compareBudgetVersionItems(sourceVersion, targetVersion, sourceItems, targetItems);
}

export function compareBudgetVersionItems(
  sourceVersion: BudgetVersion,
  targetVersion: BudgetVersion,
  sourceItems: BudgetItem[],
  targetItems: BudgetItem[]
): BudgetVersionComparison {
  const sourceByKey = new Map(sourceItems.map((item) => [buildComparisonKey(item), item]));
  const targetByKey = new Map(targetItems.map((item) => [buildComparisonKey(item), item]));
  const newItems: BudgetVersionComparisonRow[] = [];
  const removedItems: BudgetVersionComparisonRow[] = [];
  const changedItems: BudgetVersionComparisonRow[] = [];
  const chapterChanges: BudgetVersionComparisonRow[] = [];
  const extraWorksChanges: BudgetVersionComparisonRow[] = [];

  for (const [key, targetItem] of targetByKey) {
    const sourceItem = sourceByKey.get(key);
    if (!sourceItem) {
      const row = buildComparisonRow("Nuevo", key, undefined, targetItem);
      newItems.push(row);
      if (isExtraWork(targetItem)) extraWorksChanges.push(row);
      continue;
    }

    const changes = getChangedTypes(sourceItem, targetItem);
    for (const type of changes) {
      const row = buildComparisonRow(type, key, sourceItem, targetItem);
      if (type === "Cambio capitulo") chapterChanges.push(row);
      if (type === "Cambio obra extra") extraWorksChanges.push(row);
      changedItems.push(row);
    }
  }

  for (const [key, sourceItem] of sourceByKey) {
    if (targetByKey.has(key)) continue;
    const row = buildComparisonRow("Eliminado", key, sourceItem, undefined);
    removedItems.push(row);
    if (isExtraWork(sourceItem)) extraWorksChanges.push(row);
  }

  return {
    sourceVersion,
    targetVersion,
    sourceItems: sourceItems.length,
    targetItems: targetItems.length,
    newItems,
    removedItems,
    changedItems,
    chapterChanges,
    extraWorksChanges,
    totalDifference: targetItems.reduce((sum, item) => sum + item.totalValue, 0) - sourceItems.reduce((sum, item) => sum + item.totalValue, 0)
  };
}

export async function activateProjectBudgetVersion(projectId: string, budgetVersionId: string): Promise<BudgetVersionActivationResult> {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");

  const { data, error } = await supabaseClient.rpc("activate_project_budget_version", {
    p_project_id: projectId,
    p_budget_version_id: budgetVersionId
  });

  if (error) {
    throw buildBudgetVersionOperationError("Error activando version de presupuesto", error, { projectId, budgetVersionId });
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("La RPC activate_project_budget_version no retorno resultado.");
  }

  return mapActivationResultRow(row as ActivationResultRow);
}

function buildComparisonKey(item: BudgetItem) {
  return [normalizeKeyPart(item.item), item.importOrder ?? 0, normalizeKeyPart(item.description)].join("|");
}

function normalizeKeyPart(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getChangedTypes(sourceItem: BudgetItem, targetItem: BudgetItem): BudgetVersionComparisonType[] {
  const changes: BudgetVersionComparisonType[] = [];
  if (!sameNumber(sourceItem.quantity, targetItem.quantity)) changes.push("Cambio cantidad");
  if (!sameNumber(sourceItem.unitValue, targetItem.unitValue)) changes.push("Cambio valor unitario");
  if (!sameNumber(sourceItem.totalValue, targetItem.totalValue)) changes.push("Cambio valor total");
  if (normalizeKeyPart(sourceItem.chapter) !== normalizeKeyPart(targetItem.chapter) || normalizeKeyPart(sourceItem.subchapter) !== normalizeKeyPart(targetItem.subchapter)) changes.push("Cambio capitulo");
  if ((sourceItem.budgetType ?? "") !== (targetItem.budgetType ?? "")) changes.push("Cambio obra extra");
  return changes;
}

function buildComparisonRow(type: BudgetVersionComparisonType, comparisonKey: string, sourceItem?: BudgetItem, targetItem?: BudgetItem): BudgetVersionComparisonRow {
  return {
    comparisonKey,
    type,
    sourceItem,
    targetItem,
    quantityDifference: (targetItem?.quantity ?? 0) - (sourceItem?.quantity ?? 0),
    unitValueDifference: (targetItem?.unitValue ?? 0) - (sourceItem?.unitValue ?? 0),
    totalValueDifference: (targetItem?.totalValue ?? 0) - (sourceItem?.totalValue ?? 0),
    chapterChanged: Boolean(sourceItem && targetItem && (normalizeKeyPart(sourceItem.chapter) !== normalizeKeyPart(targetItem.chapter) || normalizeKeyPart(sourceItem.subchapter) !== normalizeKeyPart(targetItem.subchapter))),
    budgetTypeChanged: Boolean(sourceItem && targetItem && (sourceItem.budgetType ?? "") !== (targetItem.budgetType ?? ""))
  };
}

function sameNumber(left: number, right: number) {
  return Math.abs(left - right) < 0.0001;
}

function isExtraWork(item: BudgetItem) {
  return (item.budgetType ?? "").toLowerCase() === "obra extra" || item.item.trim().toUpperCase().startsWith("OE");
}

function groupItemsByVersion(items: BudgetItem[]) {
  const grouped = new Map<string, BudgetItem[]>();
  for (const item of items) {
    if (!item.budgetVersionId) continue;
    grouped.set(item.budgetVersionId, [...(grouped.get(item.budgetVersionId) ?? []), item]);
  }
  return grouped;
}

function buildVersionSummary(projectId: string, version: BudgetVersion, items: BudgetItem[]): BudgetVersionSummary {
  const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);
  const directCostValue = items.filter((item) => !isExtraWork(item)).reduce((sum, item) => sum + item.totalValue, 0);
  const extraWorksValue = items.filter(isExtraWork).reduce((sum, item) => sum + item.totalValue, 0);
  const executedValue = items.reduce((sum, item) => sum + (item.executedValue ?? 0), 0);
  const pendingValue = items.reduce((sum, item) => sum + (item.pendingValue ?? Math.max(item.totalValue - (item.executedValue ?? 0), 0)), 0);
  const executedPhysicalWeight = items.reduce((sum, item) => sum + item.totalValue * ((item.physicalProgressPercent ?? 0) / 100), 0);

  return {
    ...version,
    projectId,
    itemCount: items.length,
    totalActivities: version.totalActivities || items.length,
    totalBudgetValue: version.totalBudgetValue || totalValue,
    directCostValue,
    extraWorksValue,
    executedValue,
    pendingValue,
    physicalProgressPercent: totalValue > 0 ? (executedPhysicalWeight / totalValue) * 100 : 0,
    financialProgressPercent: totalValue > 0 ? (executedValue / totalValue) * 100 : 0
  };
}

function mapBudgetItemRow(row: BudgetItemRow): BudgetItem {
  return {
    id: row.id,
    budgetVersionId: row.budget_version_id ?? undefined,
    item: row.item,
    importOrder: Number(row.import_order ?? 0) || 0,
    budgetType: row.budget_type ?? undefined,
    description: row.description,
    unit: row.unit,
    quantity: Number(row.quantity) || 0,
    unitValue: Number(row.unit_value) || 0,
    totalValue: Number(row.total_value) || 0,
    chapter: row.chapter,
    subchapter: row.subchapter,
    initialProgress: Number(row.initial_progress ?? 0) || 0,
    executedQuantity: Number(row.executed_quantity ?? 0) || 0,
    executedValue: Number(row.executed_value ?? 0) || 0,
    pendingValue: Number(row.pending_value ?? 0) || 0,
    pendingQuantity: Number(row.pending_quantity ?? 0) || 0,
    physicalProgressPercent: Number(row.physical_progress_percent ?? 0) || 0,
    financialProgressPercent: Number(row.financial_progress_percent ?? 0) || 0
  };
}

function mapBudgetVersionRow(row: BudgetVersionRow): BudgetVersion {
  return {
    id: row.id,
    versionNumber: row.version_number,
    status: row.status,
    importedAt: row.imported_at,
    importedBy: row.imported_by,
    fileName: row.file_name,
    totalActivities: row.total_activities,
    totalBudgetValue: Number(row.total_budget_value) || 0
  };
}

function mapActivationResultRow(row: ActivationResultRow): BudgetVersionActivationResult {
  return {
    projectId: row.project_id,
    archivedBudgetVersionId: row.archived_budget_version_id,
    activatedBudgetVersionId: row.activated_budget_version_id,
    archivedVersionNumber: row.archived_version_number,
    activatedVersionNumber: row.activated_version_number,
    activatedItems: row.activated_items,
    activatedTotalValue: Number(row.activated_total_value) || 0,
    activatedAt: row.activated_at,
    activatedBy: row.activated_by
  };
}

function buildBudgetVersionOperationError(message: string, error: unknown, context?: Record<string, unknown>) {
  const formatted = formatSupabaseError(error);
  console.error("[DAC BudgetVersions] " + message, {
    ...formatted,
    context
  });

  return new Error(
    [
      message,
      "code: " + (formatted.code ?? "sin codigo"),
      "message: " + (formatted.message ?? "sin mensaje"),
      "details: " + (formatted.details ?? "sin detalles"),
      "hint: " + (formatted.hint ?? "sin sugerencia")
    ].join(" | ")
  );
}

function formatSupabaseError(error: unknown): SupabaseBudgetVersionError {
  const supabaseError = error as SupabaseBudgetVersionError;
  return {
    code: supabaseError?.code,
    message: supabaseError?.message,
    details: supabaseError?.details,
    hint: supabaseError?.hint
  };
}
