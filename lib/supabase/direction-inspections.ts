import { supabaseClient } from "@/lib/supabaseClient";
import type { DirectionInspection, DirectionInspectionHistory } from "@/types";

type DirectionInspectionRow = {
  id: string;
  project_id: string;
  project_name: string;
  created_at: string;
  created_by: string;
  director: string;
  responsible: string;
  responsible_profile_id: string | null;
  responsible_name: string | null;
  responsible_email: string | null;
  status: DirectionInspection["status"];
  tower: string | null;
  floor: string | null;
  apartment: string | null;
  work_front: string | null;
  category: DirectionInspection["category"];
  priority: DirectionInspection["priority"];
  description: string;
  due_date: string;
  commitment_notes: string | null;
  observation_photo_ids: string[];
  response: string | null;
  attended_at: string | null;
  correction_photo_ids: string[];
  closed_at: string | null;
  updated_at: string;
  updated_by: string;
};

type DirectionInspectionHistoryRow = {
  id: string;
  inspection_id: string;
  user_name: string;
  action: string;
  detail: string;
  created_at: string;
};

type DirectionInspectionInsert = Omit<DirectionInspection, "id" | "createdAt" | "updatedAt" | "history">;

type SupabaseDiagnosticErrorInput = {
  operation: string;
  error: unknown;
  payload?: Record<string, unknown>;
  diagnostics?: DirectionInspectionDiagnostics;
};

type DirectionInspectionDiagnostics = {
  authUserId: string | null;
  authEmail: string | null;
  profileRole: string | null;
  profileActive: boolean | null;
  currentProfileRole: string | null;
  currentProfileRoleError: string | null;
  rlsExpectedToAllowWrite: boolean;
};

const writeAllowedRoles = ["Administrador", "Director Administrativo", "Director", "Residente de Obra"];

export function subscribeToDirectionInspectionChanges(projectId: string, onChange: () => void, onError?: (error: unknown) => void) {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");
  const client = supabaseClient;
  const channelName = "direction-inspections-" + projectId + "-" + Date.now() + "-" + Math.random().toString(16).slice(2);

  const channel = client
    .channel(channelName)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "direction_inspections", filter: "project_id=eq." + projectId },
      onChange
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "direction_inspection_history" },
      onChange
    )
    .subscribe((status, error) => {
      if (error) {
        console.error("[DAC DirectionInspections] Error en sincronizacion realtime", error);
        onError?.(error);
      }
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        onError?.(new Error("No fue posible mantener la sincronizacion en tiempo real de inspecciones."));
      }
    });

  return () => {
    void client.removeChannel(channel);
  };
}

export async function loadDirectionInspectionsFromSupabase(projectId?: string) {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");

  let query = supabaseClient
    .from("direction_inspections")
    .select("*")
    .order("created_at", { ascending: false });

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data: inspectionRows, error } = await query;

  if (error) {
    console.error("[DAC DirectionInspections] Error al cargar direction_inspections", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    throw new Error("Supabase SELECT direction_inspections | " + formatSupabaseError(error));
  }

  const inspections = (inspectionRows ?? []) as DirectionInspectionRow[];
  if (inspections.length === 0) return [];

  const ids = inspections.map((inspection) => inspection.id);
  const { data: historyRows, error: historyError } = await supabaseClient
    .from("direction_inspection_history")
    .select("*")
    .in("inspection_id", ids)
    .order("created_at", { ascending: true });

  if (historyError) {
    console.error("[DAC DirectionInspections] No fue posible cargar el historial. Se mostrara el listado principal.", {
      code: historyError.code,
      message: historyError.message,
      details: historyError.details,
      hint: historyError.hint
    });
    return inspections.map((row) => mapInspectionRow(row, []));
  }

  const historyByInspection = new Map<string, DirectionInspectionHistory[]>();
  ((historyRows ?? []) as DirectionInspectionHistoryRow[]).forEach((row) => {
    const current = historyByInspection.get(row.inspection_id) ?? [];
    current.push(mapHistoryRow(row));
    historyByInspection.set(row.inspection_id, current);
  });

  return inspections.map((row) => mapInspectionRow(row, historyByInspection.get(row.id) ?? []));
}

export async function createDirectionInspectionInSupabase(inspection: DirectionInspectionInsert) {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");

  const payload = toInspectionRow(inspection);
  const diagnostics = await getDirectionInspectionDiagnostics();
  const missingFields = getMissingRequiredInspectionFields(payload);

  if (missingFields.length > 0) {
    throw new SupabaseDiagnosticError({
      operation: "Validacion local antes de INSERT en direction_inspections",
      error: {
        code: "DAC_REQUIRED_FIELDS",
        message: "Faltan campos obligatorios para guardar la inspeccion.",
        details: "Campos faltantes: " + missingFields.join(", ")
      },
      payload,
      diagnostics
    });
  }

  const { data, error } = await supabaseClient
    .from("direction_inspections")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    logSupabaseDiagnosticError("INSERT direction_inspections", error, payload, diagnostics);
    throw new SupabaseDiagnosticError({
      operation: "INSERT direction_inspections",
      error,
      payload,
      diagnostics
    });
  }

  const created = data as DirectionInspectionRow;
  const history = await addDirectionInspectionHistory(created.id, inspection.createdBy, "Inspeccion creada", "Observacion registrada desde Inspecciones de Direccion.");
  return mapInspectionRow(created, [history]);
}

export async function updateDirectionInspectionInSupabase(
  id: string,
  update: Partial<DirectionInspection>,
  user: string,
  action: string,
  detail: string
) {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");

  const payload = toInspectionUpdateRow({ ...update, updatedBy: user, updatedAt: new Date().toISOString() });
  const diagnostics = await getDirectionInspectionDiagnostics();
  const { data, error } = await supabaseClient
    .from("direction_inspections")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    logSupabaseDiagnosticError("UPDATE direction_inspections", error, payload, diagnostics);
    throw new SupabaseDiagnosticError({
      operation: "UPDATE direction_inspections",
      error,
      payload,
      diagnostics
    });
  }

  const history = await addDirectionInspectionHistory(id, user, action, detail);
  return { inspection: data as DirectionInspectionRow, history };
}

export async function addDirectionInspectionHistory(inspectionId: string, user: string, action: string, detail: string) {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");

  const payload = {
    inspection_id: inspectionId,
    user_name: user,
    action,
    detail
  };
  const diagnostics = await getDirectionInspectionDiagnostics();

  const { data, error } = await supabaseClient
    .from("direction_inspection_history")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    logSupabaseDiagnosticError("INSERT direction_inspection_history", error, payload, diagnostics);
    throw new SupabaseDiagnosticError({
      operation: "INSERT direction_inspection_history",
      error,
      payload,
      diagnostics
    });
  }
  return mapHistoryRow(data as DirectionInspectionHistoryRow);
}

export function mergeDirectionInspectionUpdate(
  current: DirectionInspection,
  row: DirectionInspectionRow,
  history: DirectionInspectionHistory
) {
  return mapInspectionRow(row, [...current.history, history]);
}

function mapInspectionRow(row: DirectionInspectionRow, history: DirectionInspectionHistory[]): DirectionInspection {
  return {
    id: row.id,
    projectId: row.project_id,
    projectName: row.project_name,
    createdAt: row.created_at,
    createdBy: row.created_by,
    director: row.director,
    responsible: row.responsible,
    responsibleProfileId: row.responsible_profile_id ?? undefined,
    responsibleName: row.responsible_name ?? undefined,
    responsibleEmail: row.responsible_email ?? undefined,
    status: row.status,
    tower: row.tower ?? "",
    floor: row.floor ?? "",
    apartment: row.apartment ?? "",
    workFront: row.work_front ?? "",
    category: row.category,
    priority: row.priority,
    description: row.description,
    dueDate: row.due_date,
    commitmentNotes: row.commitment_notes ?? "",
    observationPhotoIds: row.observation_photo_ids ?? [],
    response: row.response ?? undefined,
    attendedAt: row.attended_at ?? undefined,
    correctionPhotoIds: row.correction_photo_ids ?? [],
    closedAt: row.closed_at ?? undefined,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    history
  };
}

function mapHistoryRow(row: DirectionInspectionHistoryRow): DirectionInspectionHistory {
  return {
    id: row.id,
    user: row.user_name,
    date: row.created_at,
    action: row.action,
    detail: row.detail
  };
}

function toInspectionRow(inspection: DirectionInspectionInsert) {
  return {
    project_id: inspection.projectId,
    project_name: inspection.projectName,
    created_by: inspection.createdBy,
    director: inspection.director,
    responsible: inspection.responsible,
    responsible_profile_id: inspection.responsibleProfileId,
    responsible_name: inspection.responsibleName,
    responsible_email: inspection.responsibleEmail,
    status: inspection.status,
    tower: inspection.tower,
    floor: inspection.floor,
    apartment: inspection.apartment,
    work_front: inspection.workFront,
    category: inspection.category,
    priority: inspection.priority,
    description: inspection.description,
    due_date: inspection.dueDate,
    commitment_notes: inspection.commitmentNotes,
    observation_photo_ids: inspection.observationPhotoIds,
    response: inspection.response,
    attended_at: inspection.attendedAt,
    correction_photo_ids: inspection.correctionPhotoIds,
    closed_at: inspection.closedAt,
    updated_by: inspection.updatedBy
  };
}

function toInspectionUpdateRow(update: Partial<DirectionInspection>) {
  const payload: Record<string, unknown> = {};
  if (update.projectId !== undefined) payload.project_id = update.projectId;
  if (update.projectName !== undefined) payload.project_name = update.projectName;
  if (update.createdBy !== undefined) payload.created_by = update.createdBy;
  if (update.director !== undefined) payload.director = update.director;
  if (update.responsible !== undefined) payload.responsible = update.responsible;
  if (update.responsibleProfileId !== undefined) payload.responsible_profile_id = update.responsibleProfileId;
  if (update.responsibleName !== undefined) payload.responsible_name = update.responsibleName;
  if (update.responsibleEmail !== undefined) payload.responsible_email = update.responsibleEmail;
  if (update.status !== undefined) payload.status = update.status;
  if (update.tower !== undefined) payload.tower = update.tower;
  if (update.floor !== undefined) payload.floor = update.floor;
  if (update.apartment !== undefined) payload.apartment = update.apartment;
  if (update.workFront !== undefined) payload.work_front = update.workFront;
  if (update.category !== undefined) payload.category = update.category;
  if (update.priority !== undefined) payload.priority = update.priority;
  if (update.description !== undefined) payload.description = update.description;
  if (update.dueDate !== undefined) payload.due_date = update.dueDate;
  if (update.commitmentNotes !== undefined) payload.commitment_notes = update.commitmentNotes;
  if (update.observationPhotoIds !== undefined) payload.observation_photo_ids = update.observationPhotoIds;
  if (update.response !== undefined) payload.response = update.response;
  if (update.attendedAt !== undefined) payload.attended_at = update.attendedAt;
  if (update.correctionPhotoIds !== undefined) payload.correction_photo_ids = update.correctionPhotoIds;
  if (update.closedAt !== undefined) payload.closed_at = update.closedAt;
  if (update.updatedAt !== undefined) payload.updated_at = update.updatedAt;
  if (update.updatedBy !== undefined) payload.updated_by = update.updatedBy;
  return payload;
}

async function getDirectionInspectionDiagnostics(): Promise<DirectionInspectionDiagnostics> {
  if (!supabaseClient) {
    return {
      authUserId: null,
      authEmail: null,
      profileRole: null,
      profileActive: null,
      currentProfileRole: null,
      currentProfileRoleError: "Supabase no esta configurado.",
      rlsExpectedToAllowWrite: false
    };
  }

  const { data: userData } = await supabaseClient.auth.getUser();
  const authUser = userData.user;
  let profileRole: string | null = null;
  let profileActive: boolean | null = null;

  if (authUser?.id) {
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("rol,activo")
      .eq("id", authUser.id)
      .maybeSingle();

    if (profileError) {
      console.error("[DAC DirectionInspections] profiles role diagnostic error", {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint
      });
    }

    profileRole = (profile?.rol as string | undefined) ?? null;
    profileActive = (profile?.activo as boolean | undefined) ?? null;
  }

  const { data: roleData, error: roleError } = await supabaseClient.rpc("current_profile_role");
  const currentProfileRole = typeof roleData === "string" ? roleData : null;
  const currentProfileRoleError = roleError ? formatSupabaseError(roleError) : null;

  if (roleError) {
    console.error("[DAC DirectionInspections] current_profile_role diagnostic error", {
      code: roleError.code,
      message: roleError.message,
      details: roleError.details,
      hint: roleError.hint
    });
  }

  return {
    authUserId: authUser?.id ?? null,
    authEmail: authUser?.email ?? null,
    profileRole,
    profileActive,
    currentProfileRole,
    currentProfileRoleError,
    rlsExpectedToAllowWrite: Boolean(currentProfileRole && writeAllowedRoles.includes(currentProfileRole))
  };
}

function getMissingRequiredInspectionFields(payload: Record<string, unknown>) {
  const requiredFields = [
    "project_id",
    "project_name",
    "created_by",
    "director",
    "responsible",
    "responsible_profile_id",
    "responsible_name",
    "responsible_email",
    "status",
    "category",
    "priority",
    "description",
    "due_date",
    "observation_photo_ids",
    "correction_photo_ids",
    "updated_by"
  ];

  return requiredFields.filter((field) => {
    const value = payload[field];
    if (Array.isArray(value)) return false;
    return value === undefined || value === null || value === "";
  });
}

function logSupabaseDiagnosticError(operation: string, error: unknown, payload: Record<string, unknown>, diagnostics: DirectionInspectionDiagnostics) {
  console.error("[DAC DirectionInspections] Supabase error", {
    operation,
    error: normalizeSupabaseError(error),
    payload,
    diagnostics
  });
}

function formatSupabaseError(error: unknown) {
  const normalized = normalizeSupabaseError(error);
  return [
    normalized.code ? "code: " + normalized.code : null,
    normalized.message ? "message: " + normalized.message : null,
    normalized.details ? "details: " + normalized.details : null,
    normalized.hint ? "hint: " + normalized.hint : null
  ]
    .filter(Boolean)
    .join(" | ");
}

function normalizeSupabaseError(error: unknown) {
  if (error && typeof error === "object") {
    const source = error as { code?: string; message?: string; details?: string; hint?: string; status?: number | string };
    return {
      code: source.code ?? "",
      message: source.message ?? "Error desconocido de Supabase.",
      details: source.details ?? "",
      hint: source.hint ?? "",
      status: source.status ?? ""
    };
  }

  return {
    code: "",
    message: error instanceof Error ? error.message : String(error),
    details: "",
    hint: "",
    status: ""
  };
}

class SupabaseDiagnosticError extends Error {
  constructor({ operation, error, payload, diagnostics }: SupabaseDiagnosticErrorInput) {
    const normalized = normalizeSupabaseError(error);
    super(
      [
        "Supabase " + operation,
        "code: " + (normalized.code || "sin codigo"),
        "message: " + normalized.message,
        "details: " + (normalized.details || "sin detalles"),
        "hint: " + (normalized.hint || "sin hint"),
        "rol profiles: " + (diagnostics?.profileRole ?? "sin rol"),
        "current_profile_role(): " + (diagnostics?.currentProfileRole ?? "sin rol"),
        "RLS permite escritura esperada: " + (diagnostics?.rlsExpectedToAllowWrite ? "si" : "no")
      ].join(" | ")
    );
    this.name = "SupabaseDiagnosticError";
    console.error("[DAC DirectionInspections] DiagnosticError", {
      operation,
      error: normalized,
      payload,
      diagnostics
    });
  }
}
