import { supabaseClient } from "@/lib/supabaseClient";
import type { BudgetItem, BudgetVersion } from "@/types";

type BudgetItemRow = {
  id: string;
  project_id: string;
  item: string;
  description: string;
  unit: string;
  quantity: number | string;
  unit_value: number | string;
  total_value: number | string;
  chapter: string;
  subchapter: string;
  initial_progress: number | string | null;
  executed_quantity: number | string | null;
};

type BudgetVersionRow = {
  project_id: string;
  version_number: number;
  imported_at: string;
  imported_by: string;
  file_name: string;
  total_activities: number;
  total_budget_value: number | string;
};

export async function loadProjectBudgetFromSupabase(projectId: string) {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");

  const { data: itemRows, error: itemsError } = await supabaseClient
    .from("project_budget_items")
    .select("*")
    .eq("project_id", projectId)
    .order("item", { ascending: true });

  if (itemsError) throw itemsError;

  const { data: versionRow, error: versionError } = await supabaseClient
    .from("project_budget_versions")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (versionError) throw versionError;

  return {
    items: ((itemRows ?? []) as BudgetItemRow[]).map(mapBudgetItemRow),
    version: versionRow ? mapBudgetVersionRow(versionRow as BudgetVersionRow) : null
  };
}

export async function replaceProjectBudgetInSupabase(projectId: string, items: BudgetItem[], version: BudgetVersion) {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");

  const { error: deleteError } = await supabaseClient
    .from("project_budget_items")
    .delete()
    .eq("project_id", projectId);

  if (deleteError) throw deleteError;

  if (items.length > 0) {
    const { error: insertError } = await supabaseClient
      .from("project_budget_items")
      .insert(items.map((item) => toBudgetItemRow(projectId, item)));

    if (insertError) throw insertError;
  }

  const { error: versionError } = await supabaseClient
    .from("project_budget_versions")
    .upsert(toBudgetVersionRow(projectId, version), { onConflict: "project_id" });

  if (versionError) throw versionError;

  return loadProjectBudgetFromSupabase(projectId);
}

export async function updateProjectBudgetItemInSupabase(projectId: string, itemCode: string, update: Partial<BudgetItem>) {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (update.quantity !== undefined) payload.quantity = update.quantity;
  if (update.unitValue !== undefined) payload.unit_value = update.unitValue;
  if (update.totalValue !== undefined) payload.total_value = update.totalValue;
  if (update.initialProgress !== undefined) payload.initial_progress = update.initialProgress;
  if (update.executedQuantity !== undefined) payload.executed_quantity = update.executedQuantity;
  if (update.description !== undefined) payload.description = update.description;
  if (update.unit !== undefined) payload.unit = update.unit;
  if (update.chapter !== undefined) payload.chapter = update.chapter;
  if (update.subchapter !== undefined) payload.subchapter = update.subchapter;

  const { data, error } = await supabaseClient
    .from("project_budget_items")
    .update(payload)
    .eq("project_id", projectId)
    .eq("item", itemCode)
    .select("*")
    .single();

  if (error) throw error;
  return mapBudgetItemRow(data as BudgetItemRow);
}

function mapBudgetItemRow(row: BudgetItemRow): BudgetItem {
  return {
    id: row.id,
    item: row.item,
    description: row.description,
    unit: row.unit,
    quantity: Number(row.quantity) || 0,
    unitValue: Number(row.unit_value) || 0,
    totalValue: Number(row.total_value) || 0,
    chapter: row.chapter,
    subchapter: row.subchapter,
    initialProgress: Number(row.initial_progress ?? 0) || 0,
    executedQuantity: Number(row.executed_quantity ?? 0) || 0
  };
}

function mapBudgetVersionRow(row: BudgetVersionRow): BudgetVersion {
  return {
    versionNumber: row.version_number,
    importedAt: row.imported_at,
    importedBy: row.imported_by,
    fileName: row.file_name,
    totalActivities: row.total_activities,
    totalBudgetValue: Number(row.total_budget_value) || 0
  };
}

function toBudgetItemRow(projectId: string, item: BudgetItem) {
  return {
    project_id: projectId,
    item: item.item,
    description: item.description,
    unit: item.unit,
    quantity: item.quantity,
    unit_value: item.unitValue,
    total_value: item.totalValue,
    chapter: item.chapter,
    subchapter: item.subchapter,
    initial_progress: item.initialProgress ?? 0,
    executed_quantity: item.executedQuantity ?? 0
  };
}

function toBudgetVersionRow(projectId: string, version: BudgetVersion) {
  return {
    project_id: projectId,
    version_number: version.versionNumber,
    imported_at: version.importedAt,
    imported_by: version.importedBy,
    file_name: version.fileName,
    total_activities: version.totalActivities,
    total_budget_value: version.totalBudgetValue
  };
}
