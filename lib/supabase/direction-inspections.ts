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

export async function loadDirectionInspectionsFromSupabase() {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");

  const { data: inspectionRows, error } = await supabaseClient
    .from("direction_inspections")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const inspections = (inspectionRows ?? []) as DirectionInspectionRow[];
  if (inspections.length === 0) return [];

  const ids = inspections.map((inspection) => inspection.id);
  const { data: historyRows, error: historyError } = await supabaseClient
    .from("direction_inspection_history")
    .select("*")
    .in("inspection_id", ids)
    .order("created_at", { ascending: true });

  if (historyError) throw historyError;

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

  const { data, error } = await supabaseClient
    .from("direction_inspections")
    .insert(toInspectionRow(inspection))
    .select("*")
    .single();

  if (error) throw error;

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
  const { data, error } = await supabaseClient
    .from("direction_inspections")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  const history = await addDirectionInspectionHistory(id, user, action, detail);
  return { inspection: data as DirectionInspectionRow, history };
}

export async function addDirectionInspectionHistory(inspectionId: string, user: string, action: string, detail: string) {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");

  const { data, error } = await supabaseClient
    .from("direction_inspection_history")
    .insert({
      inspection_id: inspectionId,
      user_name: user,
      action,
      detail
    })
    .select("*")
    .single();

  if (error) throw error;
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
