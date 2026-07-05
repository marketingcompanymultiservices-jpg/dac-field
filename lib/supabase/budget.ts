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

type SupabaseBudgetError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

export async function loadProjectBudgetFromSupabase(projectId: string) {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");

  const { data: itemRows, error: itemsError } = await supabaseClient
    .from("project_budget_items")
    .select("*")
    .eq("project_id", projectId)
    .order("item", { ascending: true });

  if (itemsError) {
    throw buildBudgetOperationError("Error leyendo project_budget_items", itemsError);
  }

  const { data: versionRow, error: versionError } = await supabaseClient
    .from("project_budget_versions")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (versionError) {
    throw buildBudgetOperationError("Error leyendo project_budget_versions", versionError);
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

  const diagnostics = await getSupabaseBudgetDiagnostics();
  const rows = items.map((item) => toBudgetItemRow(projectId, item));

  console.info("[DAC Budget] Reemplazando presupuesto maestro en Supabase", {
    projectId,
    activitiesToInsert: items.length,
    versionTotalBudgetValue: version.totalBudgetValue,
    fileName: version.fileName,
    authenticatedUser: diagnostics.user,
    currentProfileRole: diagnostics.role,
    firstBudgetItemPayload: rows[0] ?? null
  });

  const versionPayload = toBudgetVersionRow(projectId, version);
  console.info("[DAC Budget] Intentando guardar project_budget_versions", {
    projectId,
    payload: versionPayload
  });

  const { data: versionData, error: versionError } = await supabaseClient
    .from("project_budget_versions")
    .upsert(versionPayload, { onConflict: "project_id" })
    .select("*")
    .single();

  if (versionError) {
    throw buildBudgetOperationError("Error guardando project_budget_versions", versionError, {
      projectId,
      payload: versionPayload,
      authenticatedUser: diagnostics.user,
      currentProfileRole: diagnostics.role
    });
  }

  console.info("[DAC Budget] Resultado project_budget_versions", {
    projectId,
    data: versionData,
    error: null
  });

  const { error: deleteError } = await supabaseClient
    .from("project_budget_items")
    .delete()
    .eq("project_id", projectId);

  if (deleteError) {
    throw buildBudgetOperationError("Error eliminando presupuesto anterior en project_budget_items", deleteError, {
      projectId,
      authenticatedUser: diagnostics.user,
      currentProfileRole: diagnostics.role
    });
  }

  let insertedCount = 0;
  if (rows.length > 0) {
    for (const chunk of chunkRows(rows, 500)) {
      console.info("[DAC Budget] Intentando insertar project_budget_items", {
        projectId,
        chunkSize: chunk.length,
        insertedBeforeChunk: insertedCount,
        firstChunkItemPayload: chunk[0] ?? null
      });

      const { data, error: insertError } = await supabaseClient
        .from("project_budget_items")
        .insert(chunk)
        .select("id");

      if (insertError) {
        throw buildBudgetOperationError("Error insertando actividades en project_budget_items", insertError, {
          projectId,
          versionSaved: true,
          chunkSize: chunk.length,
          insertedBeforeError: insertedCount,
          firstChunkItemPayload: chunk[0] ?? null,
          authenticatedUser: diagnostics.user,
          currentProfileRole: diagnostics.role
        });
      }

      insertedCount += data?.length ?? chunk.length;

      console.info("[DAC Budget] Resultado project_budget_items", {
        projectId,
        chunkSize: chunk.length,
        insertedInChunk: data?.length ?? chunk.length,
        insertedCount,
        error: null
      });
    }
  }

  console.info("[DAC Budget] Actividades insertadas en Supabase", {
    projectId,
    insertedCount
  });

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
    throw buildBudgetOperationError("Error actualizando project_budget_items", error, { projectId, itemCode, update });
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

async function getSupabaseBudgetDiagnostics() {
  if (!supabaseClient) return { user: null, role: null };

  const [{ data: userData, error: userError }, { data: roleData, error: roleError }] = await Promise.all([
    supabaseClient.auth.getUser(),
    supabaseClient.rpc("current_profile_role")
  ]);

  if (userError) {
    console.error("[DAC Budget] Error consultando usuario autenticado", formatSupabaseError(userError));
  }

  if (roleError) {
    console.error("[DAC Budget] Error consultando current_profile_role()", formatSupabaseError(roleError));
  }

  console.info("[DAC Budget] Diagnostico autenticacion/RLS", {
    authenticatedUser: userData.user
      ? {
          id: userData.user.id,
          email: userData.user.email
        }
      : null,
    currentProfileRole: typeof roleData === "string" ? roleData : null
  });

  return {
    user: userData.user
      ? {
          id: userData.user.id,
          email: userData.user.email
        }
      : null,
    role: typeof roleData === "string" ? roleData : null
  };
}

function buildBudgetOperationError(message: string, error: unknown, context?: Record<string, unknown>) {
  const formatted = formatSupabaseError(error);
  console.error("[DAC Budget] " + message, {
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

function formatSupabaseError(error: unknown): SupabaseBudgetError {
  const supabaseError = error as SupabaseBudgetError;
  return {
    code: supabaseError?.code,
    message: supabaseError?.message,
    details: supabaseError?.details,
    hint: supabaseError?.hint
  };
}
