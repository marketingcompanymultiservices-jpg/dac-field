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

  if (itemsError) {
    logSupabaseBudgetError("Error leyendo project_budget_items", itemsError);
    throw itemsError;
  }

  const { data: versionRow, error: versionError } = await supabaseClient
    .from("project_budget_versions")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (versionError) {
    logSupabaseBudgetError("Error leyendo project_budget_versions", versionError);
    throw versionError;
  }

  const items = ((itemRows ?? []) as BudgetItemRow[]).map(mapBudgetItemRow);
  const totalBudgetValue = items.reduce((sum, item) => sum + item.totalValue, 0);

  console.info("[DAC Budget] Presupuesto leido desde Supabase", {
    projectId,
    activitiesRead: items.length,
    totalBudgetValueFromItems: totalBudgetValue
  });

  return {
    items,
    version: versionRow ? mapBudgetVersionRow(versionRow as BudgetVersionRow) : null
  };
}

export async function replaceProjectBudgetInSupabase(projectId: string, items: BudgetItem[], version: BudgetVersion) {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");

  console.info("[DAC Budget] Reemplazando presupuesto maestro en Supabase", {
    projectId,
    activitiesToInsert: items.length,
    versionTotalBudgetValue: version.totalBudgetValue,
    fileName: version.fileName
  });

  const { error: deleteError } = await supabaseClient
    .from("project_budget_items")
    .delete()
    .eq("project_id", projectId);

  if (deleteError) {
    logSupabaseBudgetError("Error eliminando presupuesto anterior", deleteError);
    throw deleteError;
  }

  let insertedCount = 0;
  if (items.length > 0) {
    const rows = items.map((item) => toBudgetItemRow(projectId, item));
    for (const chunk of chunkRows(rows, 500)) {
      const { data, error: insertError } = await supabaseClient
        .from("project_budget_items")
        .insert(chunk)
        .select("id");

      if (insertError) {
        logSupabaseBudgetError("Error insertando actividades en project_budget_items", insertError, {
          projectId,
          chunkSize: chunk.length,
          insertedBeforeError: insertedCount
        });
        throw insertError;
      }

      insertedCount += data?.length ?? chunk.length;
    }
  }

  console.info("[DAC Budget] Actividades insertadas en Supabase", {
    projectId,
    insertedCount
  });

  const { error: versionError } = await supabaseClient
    .from("project_budget_versions")
    .upsert(toBudgetVersionRow(projectId, version), { onConflict: "project_id" });

  if (versionError) {
    logSupabaseBudgetError("Error guardando project_budget_versions", versionError);
    throw versionError;
  }

  const remoteBudget = await loadProjectBudgetFromSupabase(projectId);
  const totalBudgetValue = remoteBudget.items.reduce((sum, item) => sum + item.totalValue, 0);

  console.info("[DAC Budget] Presupuesto importado y recargado desde Supabase", {
    projectId,
    activitiesInserted: insertedCount,
    activitiesRead: remoteBudget.items.length,
    totalBudgetValueFromItems: totalBudgetValue,
    versionTotalBudgetValue: remoteBudget.version?.totalBudgetValue ?? 0
  });

  return remoteBudget;
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

  if (error) {
    logSupabaseBudgetError("Error actualizando project_budget_items", error, { projectId, itemCode, update });
    throw error;
  }
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

function chunkRows<T>(rows: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
}

function logSupabaseBudgetError(message: string, error: unknown, context?: Record<string, unknown>) {
  const supabaseError = error as { code?: string; message?: string; details?: string; hint?: string };
  console.error("[DAC Budget] " + message, {
    code: supabaseError?.code,
    message: supabaseError?.message,
    details: supabaseError?.details,
    hint: supabaseError?.hint,
    context
  });
}
