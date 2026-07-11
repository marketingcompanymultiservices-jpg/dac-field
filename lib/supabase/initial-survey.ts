import { supabaseClient } from "@/lib/supabaseClient";
import type { BudgetItem, InitialSurveyItem } from "@/types";

type InitialSurveyRow = {
  id: string;
  project_id: string;
  budget_item_id: string | null;
  item: string;
  import_order: number | string | null;
  executed_quantity: number | string;
  observation: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

type SupabaseInitialSurveyError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

export async function loadProjectInitialSurveyItems(projectId: string) {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");

  const { data, error } = await supabaseClient
    .from("project_initial_survey_items")
    .select("*")
    .eq("project_id", projectId)
    .order("import_order", { ascending: true })
    .order("item", { ascending: true });

  if (error) {
    throw buildInitialSurveyOperationError("Error leyendo project_initial_survey_items", error, { projectId });
  }

  return ((data ?? []) as InitialSurveyRow[]).map(mapInitialSurveyRow);
}

export async function saveProjectInitialSurveyItems(projectId: string, items: BudgetItem[], observations: Record<string, string> = {}) {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");
  if (items.length === 0) {
    throw new Error("No hay actividades del presupuesto para guardar en el levantamiento inicial.");
  }

  const { data: userData, error: userError } = await supabaseClient.auth.getUser();
  if (userError) {
    throw buildInitialSurveyOperationError("Error consultando usuario autenticado", userError, { projectId });
  }

  const userEmail = userData.user?.email ?? "Usuario DAC";
  const savedRows: InitialSurveyItem[] = [];

  for (const item of items) {
    const payload = {
      project_id: projectId,
      budget_item_id: item.id ?? null,
      item: item.item,
      import_order: item.importOrder ?? 0,
      executed_quantity: item.executedQuantity ?? 0,
      observation: observations[getSurveyKey(item)]?.trim() || null,
      updated_by: userEmail,
      updated_at: new Date().toISOString()
    };

    const existing = item.id ? await findExistingSurveyRow(projectId, item.id) : null;

    if (existing) {
      const { data, error } = await supabaseClient
        .from("project_initial_survey_items")
        .update(payload)
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error) {
        throw buildInitialSurveyOperationError("Error actualizando project_initial_survey_items", error, { projectId, item: item.item, payload });
      }

      savedRows.push(mapInitialSurveyRow(data as InitialSurveyRow));
      continue;
    }

    const { data, error } = await supabaseClient
      .from("project_initial_survey_items")
      .insert({ ...payload, created_by: userEmail })
      .select("*")
      .single();

    if (error) {
      throw buildInitialSurveyOperationError("Error insertando project_initial_survey_items", error, { projectId, item: item.item, payload });
    }

    savedRows.push(mapInitialSurveyRow(data as InitialSurveyRow));
  }

  if (savedRows.length === 0) {
    throw new Error("No se guardo ningun registro en project_initial_survey_items.");
  }

  return savedRows;
}

async function findExistingSurveyRow(projectId: string, budgetItemId: string) {
  if (!supabaseClient) return null;

  const { data, error } = await supabaseClient
    .from("project_initial_survey_items")
    .select("*")
    .eq("project_id", projectId)
    .eq("budget_item_id", budgetItemId)
    .maybeSingle();

  if (error) {
    throw buildInitialSurveyOperationError("Error buscando project_initial_survey_items", error, { projectId, budgetItemId });
  }

  return data as InitialSurveyRow | null;
}

function mapInitialSurveyRow(row: InitialSurveyRow): InitialSurveyItem {
  return {
    id: row.id,
    projectId: row.project_id,
    budgetItemId: row.budget_item_id ?? undefined,
    item: row.item,
    importOrder: Number(row.import_order ?? 0) || 0,
    executedQuantity: Number(row.executed_quantity ?? 0) || 0,
    observation: row.observation ?? undefined,
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function getSurveyKey(item: BudgetItem) {
  return item.id ?? item.item + "-" + (item.importOrder ?? 0);
}

function buildInitialSurveyOperationError(message: string, error: unknown, context?: Record<string, unknown>) {
  const formatted = formatSupabaseError(error);
  console.error("[DAC InitialSurvey] " + message, {
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

function formatSupabaseError(error: unknown): SupabaseInitialSurveyError {
  const supabaseError = error as SupabaseInitialSurveyError;
  return {
    code: supabaseError?.code,
    message: supabaseError?.message,
    details: supabaseError?.details,
    hint: supabaseError?.hint
  };
}
