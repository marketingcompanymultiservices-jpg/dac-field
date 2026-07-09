import { supabaseClient } from "@/lib/supabaseClient";
import type { Commitment, DailyActivity, DailyPhoto, DailyReportEntry } from "@/types";

type DailyReportRow = {
  id: string;
  project_id: string;
  report_date: string;
  report_time: string;
  weather: string | null;
  administrative_staff: string | null;
  operative_staff: string | null;
  contractors: string | null;
  equipment: string | null;
  material: string | null;
  observations: string | null;
  problems: string | null;
  actions: string | null;
  signature: string | null;
  status: DailyReportEntry["status"];
  created_by: string | null;
  updated_by: string | null;
};

type ReportActivityRow = {
  id: string;
  project_id: string;
  daily_report_id: string;
  budget_item_id: string | null;
  activity: string;
  unit: string | null;
  quantity: number | string;
  observation: string | null;
  work_front: string | null;
  owner: string | null;
  start_time: string | null;
  end_time: string | null;
  photo_count: number | null;
  activity_date: string;
  activity_time: string | null;
  created_by: string | null;
  updated_by: string | null;
};

type ReportPhotoRow = {
  id: string;
  project_id: string;
  daily_report_id: string;
  name: string;
  photo_date: string;
  photo_time: string | null;
  user_name: string | null;
  description: string | null;
  activity_id: string | null;
  storage: "indexedDB" | "localStorage" | null;
  file_type: string | null;
  file_size: number | string | null;
  image_data: string | null;
  created_by: string | null;
  updated_by: string | null;
};

type CommitmentRow = {
  id: string;
  project_id: string | null;
  daily_report_id: string | null;
  budget_item_id: string | null;
  description: string;
  owner: string;
  due_date: string;
  priority: Commitment["priority"];
  status: Commitment["status"];
  origin: string;
  created_at: string | null;
  created_by: string | null;
  updated_by: string | null;
};

type DailyReportBundle = {
  dailyReports: DailyReportEntry[];
  activities: DailyActivity[];
  photos: DailyPhoto[];
  commitments: Commitment[];
};

type SupabaseOperationError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

const DAILY_REPORT_QUERY_TIMEOUT_MS = 25000;
const DAILY_REPORT_SAVE_TIMEOUT_MS = 30000;
const MAX_IMAGE_DATA_CHARACTERS = 700000;

export async function loadDailyReportBundleFromSupabase(projectId: string): Promise<DailyReportBundle> {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");

  const { data: userData } = await supabaseClient.auth.getUser();
  const authenticatedUser = userData.user?.email ?? "sin usuario autenticado";

  console.info("[DAC DailyReports] Consultando reportes diarios", {
    origin: "Supabase",
    projectId,
    authenticatedUser,
    sql: "select * from daily_reports where project_id = :project_id order by report_date desc, report_time desc"
  });

  const [reportsResult, activitiesResult, photosResult, commitmentsResult] = await withTimeout(
    Promise.all([
      supabaseClient.from("daily_reports").select("*").eq("project_id", projectId).order("report_date", { ascending: false }).order("report_time", { ascending: false }),
      supabaseClient.from("report_activities").select("*").eq("project_id", projectId).order("activity_date", { ascending: false }).order("activity_time", { ascending: false }),
      supabaseClient.from("report_photos").select("*").eq("project_id", projectId).order("photo_date", { ascending: false }).order("photo_time", { ascending: false }),
      supabaseClient.from("commitments").select("*").eq("project_id", projectId).order("created_at", { ascending: false })
    ]),
    DAILY_REPORT_QUERY_TIMEOUT_MS,
    "Timeout consultando reportes diarios en Supabase"
  );

  if (reportsResult.error) throw buildDailyReportOperationError("Error leyendo daily_reports", reportsResult.error, { projectId, authenticatedUser });
  if (activitiesResult.error) throw buildDailyReportOperationError("Error leyendo report_activities", activitiesResult.error, { projectId, authenticatedUser });
  if (photosResult.error) throw buildDailyReportOperationError("Error leyendo report_photos", photosResult.error, { projectId, authenticatedUser });
  if (commitmentsResult.error) throw buildDailyReportOperationError("Error leyendo commitments", commitmentsResult.error, { projectId, authenticatedUser });

  const dailyReports = ((reportsResult.data ?? []) as DailyReportRow[]).map(mapDailyReportRow);
  const activities = ((activitiesResult.data ?? []) as ReportActivityRow[]).map(mapReportActivityRow);
  const photos = ((photosResult.data ?? []) as ReportPhotoRow[]).map(mapReportPhotoRow);
  const commitments = ((commitmentsResult.data ?? []) as CommitmentRow[]).map(mapCommitmentRow);

  console.info("[DAC DailyReports] Resultado consulta Supabase", {
    origin: "Supabase",
    projectId,
    authenticatedUser,
    reportsFound: dailyReports.length,
    activitiesFound: activities.length,
    photosFound: photos.length,
    commitmentsFound: commitments.length
  });

  return { dailyReports, activities, photos, commitments };
}

export async function saveDailyReportBundleToSupabase(input: {
  projectId: string;
  report: DailyReportEntry;
  activities: DailyActivity[];
  photos: DailyPhoto[];
  commitments: Commitment[];
}) {
  if (!supabaseClient) throw new Error("Supabase no esta configurado.");

  const { data: userData } = await supabaseClient.auth.getUser();
  const authenticatedUser = userData.user?.email ?? "sin usuario autenticado";
  const sanitizedPhotos = sanitizePhotosForSupabase(input.photos);
  const payload = {
    project_id: input.projectId,
    report: input.report,
    activities: input.activities,
    photos: sanitizedPhotos,
    commitments: input.commitments
  };

  console.info("[DAC DailyReports] Guardando paquete transaccional en Supabase", {
    origin: "Supabase",
    projectId: input.projectId,
    authenticatedUser,
    sql: "select public.save_daily_report_bundle(:payload)",
    reportId: input.report.id,
    activitiesToSave: input.activities.length,
    photosToSave: input.photos.length,
    photosWithImageData: sanitizedPhotos.filter((photo) => Boolean(photo.imageData)).length,
    largeImagesOmitted: input.photos.filter((photo) => (photo.imageData?.length ?? 0) > MAX_IMAGE_DATA_CHARACTERS).length,
    commitmentsToSave: input.commitments.length
  });

  const { data, error } = await withTimeout(
    supabaseClient.rpc("save_daily_report_bundle", { payload }),
    DAILY_REPORT_SAVE_TIMEOUT_MS,
    "Timeout ejecutando save_daily_report_bundle en Supabase"
  );

  if (error) {
    console.error("[DAC DailyReports] Error completo guardando reporte diario", {
      origin: "Supabase",
      projectId: input.projectId,
      authenticatedUser,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      report: input.report,
      firstActivity: input.activities[0] ?? null,
      firstPhoto: sanitizedPhotos[0] ? { ...sanitizedPhotos[0], imageData: sanitizedPhotos[0].imageData ? "[base64]" : undefined } : null,
      firstCommitment: input.commitments[0] ?? null
    });
    throw buildDailyReportOperationError("Error guardando paquete diario en Supabase", error, {
      projectId: input.projectId,
      authenticatedUser,
      reportId: input.report.id
    });
  }

  console.info("[DAC DailyReports] Reporte diario guardado en Supabase", {
    origin: "Supabase",
    projectId: input.projectId,
    authenticatedUser,
    result: data
  });

  return data;
}

function sanitizePhotosForSupabase(photos: DailyPhoto[]) {
  return photos.map((photo) => {
    if (!photo.imageData || photo.imageData.length <= MAX_IMAGE_DATA_CHARACTERS) return photo;

    console.warn("[DAC DailyReports] image_data omitida para evitar bloqueo del guardado movil", {
      origin: "Supabase",
      photoId: photo.id,
      name: photo.name,
      imageDataCharacters: photo.imageData.length,
      maxImageDataCharacters: MAX_IMAGE_DATA_CHARACTERS
    });

    return {
      ...photo,
      imageData: undefined
    };
  });
}

function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = globalThis.setTimeout(() => {
      reject(
        buildDailyReportOperationError(message, {
          code: "DAC_TIMEOUT",
          message,
          details: "La operacion supero " + timeoutMs + " ms sin respuesta.",
          hint: "Revisa conectividad, RLS, funcion save_daily_report_bundle y tamano de fotografias."
        })
      );
    }, timeoutMs);

    Promise.resolve(promise)
      .then((value) => {
        globalThis.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        globalThis.clearTimeout(timeoutId);
        reject(error);
      });
  });
}

function mapDailyReportRow(row: DailyReportRow): DailyReportEntry {
  return {
    id: row.id,
    projectId: row.project_id,
    date: row.report_date,
    time: row.report_time,
    weather: row.weather ?? "",
    administrativeStaff: row.administrative_staff ?? "",
    operativeStaff: row.operative_staff ?? "",
    contractors: row.contractors ?? "",
    equipment: row.equipment ?? "",
    material: row.material ?? "",
    observations: row.observations ?? "",
    problems: row.problems ?? "",
    actions: row.actions ?? "",
    signature: row.signature ?? "",
    status: row.status,
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined
  };
}

function mapReportActivityRow(row: ReportActivityRow): DailyActivity {
  return {
    id: row.id,
    projectId: row.project_id,
    budgetItemId: row.budget_item_id ?? undefined,
    activity: row.activity,
    unit: row.unit ?? "",
    quantity: Number(row.quantity ?? 0),
    observation: row.observation ?? "",
    workFront: row.work_front ?? undefined,
    owner: row.owner ?? undefined,
    startTime: row.start_time ?? undefined,
    endTime: row.end_time ?? undefined,
    photoCount: row.photo_count ?? undefined,
    date: row.activity_date,
    time: row.activity_time ?? "",
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined
  };
}

function mapReportPhotoRow(row: ReportPhotoRow): DailyPhoto {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    date: row.photo_date,
    time: row.photo_time ?? "",
    user: row.user_name ?? "",
    description: row.description ?? "",
    activityId: row.activity_id ?? undefined,
    reportId: row.daily_report_id,
    dailyReportId: row.daily_report_id,
    type: row.file_type ?? undefined,
    size: row.file_size === null ? undefined : Number(row.file_size),
    storage: row.storage ?? "indexedDB",
    imageData: row.image_data ?? undefined,
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined
  };
}

function mapCommitmentRow(row: CommitmentRow): Commitment {
  return {
    id: row.id,
    projectId: row.project_id ?? undefined,
    budgetItemId: row.budget_item_id ?? undefined,
    dailyReportId: row.daily_report_id ?? undefined,
    description: row.description,
    owner: row.owner,
    dueDate: row.due_date,
    priority: row.priority,
    status: row.status,
    origin: row.origin,
    createdAt: row.created_at ?? undefined,
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined
  };
}

function buildDailyReportOperationError(message: string, error: SupabaseOperationError, context?: Record<string, unknown>) {
  const fullMessage = [
    message,
    "code: " + (error.code ?? "sin codigo"),
    "message: " + (error.message ?? "sin mensaje"),
    "details: " + (error.details ?? "sin detalles"),
    "hint: " + (error.hint ?? "sin sugerencia")
  ]
    .filter(Boolean)
    .join(" | ");

  console.error("[DAC DailyReports] " + message, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
    context
  });

  return new Error(fullMessage);
}
