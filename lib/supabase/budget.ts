import { supabaseClient } from "@/lib/supabaseClient";
import type { BudgetItem, BudgetVersion } from "@/types";

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
  executed_quantity: number | string | null;
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

type SupabaseBudgetError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

export async function loadProjectBudgetFromSupabase(projectId: string) {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");
  const { data: versionRow, error: versionError } = await supabaseClient
    .from("project_budget_versions")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "Oficial")
    .maybeSingle();

  if (versionError) {
    throw buildBudgetOperationError("Error leyendo version oficial en project_budget_versions", versionError);
  }

  if (!versionRow) {
    return {
      items: [],
      version: null
    };
  }

  const budgetItemsResponse = await supabaseClient
    .from("project_budget_items")
    .select("*", { count: "exact" })
    .eq("project_id", projectId)
    .eq("budget_version_id", (versionRow as BudgetVersionRow).id)
    .order("item", { ascending: true });
  const { data: itemRows, error: itemsError } = budgetItemsResponse;

  if (itemsError) {
    throw buildBudgetOperationError("Error leyendo project_budget_items", itemsError);
  }

  const items = ((itemRows ?? []) as BudgetItemRow[]).map(mapBudgetItemRow);

  return {
    items,
    version: versionRow ? mapBudgetVersionRow(versionRow as BudgetVersionRow) : null
  };
}

export async function replaceProjectBudgetInSupabase(projectId: string, items: BudgetItem[], version: BudgetVersion) {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");

  const diagnostics = await getSupabaseBudgetDiagnostics();
  const rows = items.map((item) => toBudgetItemRow(projectId, item));

  const versionPayload = toBudgetVersionRow(projectId, version);

  const { error: versionError } = await supabaseClient
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
    }
  }

  const remoteBudget = await loadProjectBudgetFromSupabase(projectId);

  return remoteBudget;
}

export async function createDraftProjectBudgetInSupabase(projectId: string, items: BudgetItem[], version: BudgetVersion) {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");

  const diagnostics = await getSupabaseBudgetDiagnostics();
  const versionPayload = toBudgetVersionRow(projectId, { ...version, status: "Borrador" });

  const { data: savedVersion, error: versionError } = await supabaseClient
    .from("project_budget_versions")
    .insert(versionPayload)
    .select("*")
    .single();

  if (versionError) {
    throw buildBudgetOperationError("Error guardando version Borrador en project_budget_versions", versionError, {
      projectId,
      payload: versionPayload,
      authenticatedUser: diagnostics.user,
      currentProfileRole: diagnostics.role
    });
  }

  const draftVersion = mapBudgetVersionRow(savedVersion as BudgetVersionRow);
  if (!draftVersion.id) {
    throw new Error("La version Borrador fue creada sin id. No se insertaron actividades.");
  }

  const rows = items.map((item) => toBudgetItemRow(projectId, { ...item, budgetVersionId: draftVersion.id }));
  let insertedCount = 0;
  if (rows.length > 0) {
    for (const chunk of chunkRows(rows, 500)) {
      const { data, error: insertError } = await supabaseClient
        .from("project_budget_items")
        .insert(chunk)
        .select("id");

      if (insertError) {
        throw buildBudgetOperationError("Error insertando actividades del presupuesto Borrador en project_budget_items", insertError, {
          projectId,
          budgetVersionId: draftVersion.id,
          chunkSize: chunk.length,
          insertedBeforeError: insertedCount,
          firstChunkItemPayload: chunk[0] ?? null,
          authenticatedUser: diagnostics.user,
          currentProfileRole: diagnostics.role
        });
      }

      insertedCount += data?.length ?? chunk.length;
    }
  }

  return {
    version: {
      ...draftVersion,
      totalActivities: insertedCount
    },
    insertedItems: insertedCount
  };
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
  } as BudgetItem;
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

function toBudgetItemRow(projectId: string, item: BudgetItem) {
  return {
    project_id: projectId,
    budget_version_id: item.budgetVersionId,
    item: item.item,
    import_order: item.importOrder ?? 0,
    budget_type: item.budgetType ?? (item.item.toUpperCase().trim().startsWith("OE") ? "Obra Extra" : "Presupuesto Base"),
    description: item.description,
    unit: item.unit,
    quantity: item.quantity,
    unit_value: item.unitValue,
    total_value: item.totalValue,
    chapter: item.chapter,
    subchapter: item.subchapter,
    initial_progress: item.initialProgress ?? 0,
    executed_quantity: item.executedQuantity ?? 0,
    executed_value: item.executedValue ?? 0,
    pending_quantity: item.pendingQuantity ?? Math.max(item.quantity - (item.executedQuantity ?? 0), 0),
    pending_value: item.pendingValue ?? Math.max(item.totalValue - (item.executedValue ?? 0), 0),
    physical_progress_percent: item.physicalProgressPercent ?? 0,
    financial_progress_percent: item.financialProgressPercent ?? 0
  };
}

function toBudgetVersionRow(projectId: string, version: BudgetVersion) {
  return {
    project_id: projectId,
    version_number: version.versionNumber,
    status: version.status ?? "Oficial",
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
