import { supabaseClient } from "@/lib/supabaseClient";

export type ProgressEngineResult = {
  projectId: string;
  totalItems: number;
  updatedItems: number;
  totalExecutedQuantity: number;
  totalExecutedValue: number;
  totalPendingValue: number;
};

type ProgressEngineRow = {
  project_id: string;
  total_items: number | string | null;
  updated_items: number | string | null;
  total_executed_quantity: number | string | null;
  total_executed_value: number | string | null;
  total_pending_value: number | string | null;
};

type SupabaseProgressEngineError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

export async function recalculateProjectBudgetExecution(projectId: string): Promise<ProgressEngineResult> {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");

  const { data, error } = await supabaseClient.rpc("recalculate_project_budget_execution", {
    p_project_id: projectId
  });

  if (error) {
    throw buildProgressEngineError("No fue posible recalcular el avance presupuestal.", error, { projectId });
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("La funcion recalculate_project_budget_execution no devolvio resultados.");
  }

  return mapProgressEngineRow(row as ProgressEngineRow);
}

function mapProgressEngineRow(row: ProgressEngineRow): ProgressEngineResult {
  return {
    projectId: row.project_id,
    totalItems: Number(row.total_items ?? 0) || 0,
    updatedItems: Number(row.updated_items ?? 0) || 0,
    totalExecutedQuantity: Number(row.total_executed_quantity ?? 0) || 0,
    totalExecutedValue: Number(row.total_executed_value ?? 0) || 0,
    totalPendingValue: Number(row.total_pending_value ?? 0) || 0
  };
}

function buildProgressEngineError(message: string, error: unknown, context?: Record<string, unknown>) {
  const formatted = formatSupabaseError(error);
  console.error("[DAC Progress Engine] " + message, {
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

function formatSupabaseError(error: unknown): SupabaseProgressEngineError {
  const supabaseError = error as SupabaseProgressEngineError;
  return {
    code: supabaseError?.code,
    message: supabaseError?.message,
    details: supabaseError?.details,
    hint: supabaseError?.hint
  };
}
